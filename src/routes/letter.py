from flask import Blueprint, request, jsonify
from src.models.models import db, Letter, Profile, Company, APICredential, AuditLog
from src.utils.auth import token_required
from src.utils.llm import generate_cover_letter
from src.utils.encryption import decrypt_api_key

letter_bp = Blueprint('letter', __name__)

@letter_bp.route('/generate', methods=['POST'])
@token_required
def generate_letter(current_user):
    """Generate a cover letter using LLM."""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('profile_id') or not data.get('company_id'):
            return jsonify({'error': 'profile_id and company_id are required'}), 400
        
        # Get profile
        profile = Profile.query.filter_by(id=data['profile_id'], user_id=current_user.id).first()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        # Get company
        company = Company.query.filter_by(id=data['company_id'], user_id=current_user.id).first()
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Get parameters
        language = data.get('language', 'en')
        tone = data.get('tone', 'formal')
        
        # Get API key
        api_key = None
        provider = data.get('provider', 'openai')
        credential = APICredential.query.filter_by(user_id=current_user.id, provider=provider).first()
        if credential:
            api_key = decrypt_api_key(credential.api_key_enc)
        
        # Get model
        model = data.get('model', 'gpt-4.1-mini')
        
        # Prepare profile and company data
        profile_data = {
            'sectors': profile.sectors or [],
            'roles': profile.roles or [],
            'skills': profile.skills or [],
            'summary': profile.summary or ''
        }
        
        company_data = {
            'name': company.name,
            'summary': company.summary or '',
            'focus_areas': company.focus_areas or [],
            'requirements': company.requirements or []
        }
        
        # Generate cover letter
        result = generate_cover_letter(profile_data, company_data, language=language, tone=tone, api_key=api_key, model=model)
        
        if result['status'] == 'failed':
            return jsonify({'error': result.get('error', 'Letter generation failed')}), 500
        
        letter_text = result['letter']
        
        # Create letter record
        letter = Letter(
            user_id=current_user.id,
            profile_id=profile.id,
            company_id=company.id,
            language=language,
            tone=tone,
            subject=f"Application for position at {company.name}",
            body=letter_text,
            status='draft'
        )
        
        db.session.add(letter)
        db.session.commit()
        
        # Log the action
        audit_log = AuditLog(
            user_id=current_user.id,
            action='letter_generated',
            entity_type='letter',
            entity_id=letter.id,
            payload={'profile_id': profile.id, 'company_id': company.id, 'model': model}
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Letter generated successfully',
            'letter': letter.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@letter_bp.route('/<letter_id>', methods=['GET'])
@token_required
def get_letter(current_user, letter_id):
    """Get a letter by ID."""
    try:
        letter = Letter.query.filter_by(id=letter_id, user_id=current_user.id).first()
        
        if not letter:
            return jsonify({'error': 'Letter not found'}), 404
        
        return jsonify({'letter': letter.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@letter_bp.route('/<letter_id>', methods=['PUT'])
@token_required
def update_letter(current_user, letter_id):
    """Update a letter."""
    try:
        data = request.get_json()
        
        # Get letter
        letter = Letter.query.filter_by(id=letter_id, user_id=current_user.id).first()
        if not letter:
            return jsonify({'error': 'Letter not found'}), 404
        
        # Update fields
        if 'subject' in data:
            letter.subject = data['subject']
        if 'body' in data:
            letter.body = data['body']
        if 'status' in data:
            letter.status = data['status']
        
        db.session.commit()
        
        # Log the action
        audit_log = AuditLog(
            user_id=current_user.id,
            action='letter_updated',
            entity_type='letter',
            entity_id=letter.id
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Letter updated successfully',
            'letter': letter.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@letter_bp.route('/list', methods=['GET'])
@token_required
def list_letters(current_user):
    """List all letters for the current user."""
    try:
        letters = Letter.query.filter_by(user_id=current_user.id).all()
        
        return jsonify({
            'letters': [letter.to_dict() for letter in letters]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

