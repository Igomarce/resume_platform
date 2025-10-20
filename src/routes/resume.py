from flask import Blueprint, request, jsonify
from src.models.models import db, Document, Profile, APICredential, AuditLog
from src.utils.auth import token_required
from src.utils.llm import analyze_resume
from src.utils.encryption import decrypt_api_key

resume_bp = Blueprint('resume', __name__)

@resume_bp.route('/analyze', methods=['POST'])
@token_required
def analyze_resume_endpoint(current_user):
    """Analyze a resume document using LLM."""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('document_id'):
            return jsonify({'error': 'document_id is required'}), 400
        
        # Get document
        document = Document.query.filter_by(id=data['document_id'], user_id=current_user.id).first()
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        # Get text to analyze (prefer edited text over raw text)
        text_to_analyze = document.edited_text if document.edited_text else document.raw_text
        if not text_to_analyze:
            return jsonify({'error': 'Document has no text to analyze'}), 400
        
        # Get API key
        api_key = None
        provider = data.get('provider', 'openai')
        credential = APICredential.query.filter_by(user_id=current_user.id, provider=provider).first()
        if credential:
            api_key = decrypt_api_key(credential.api_key_enc)
        
        # Get model
        model = data.get('model', 'gpt-4.1-mini')
        
        # Analyze resume
        result = analyze_resume(text_to_analyze, api_key=api_key, model=model)
        
        if result['status'] == 'failed':
            return jsonify({'error': result.get('error', 'Resume analysis failed')}), 500
        
        analysis = result['analysis']
        
        # Create or update profile
        existing_profile = Profile.query.filter_by(document_id=document.id, user_id=current_user.id).first()
        
        if existing_profile:
            # Update existing profile
            existing_profile.sectors = analysis.get('sectors', [])
            existing_profile.roles = analysis.get('roles', [])
            existing_profile.skills = analysis.get('skills', [])
            existing_profile.summary = analysis.get('summary', '')
            profile = existing_profile
        else:
            # Create new profile
            profile = Profile(
                user_id=current_user.id,
                document_id=document.id,
                sectors=analysis.get('sectors', []),
                roles=analysis.get('roles', []),
                skills=analysis.get('skills', []),
                summary=analysis.get('summary', '')
            )
            db.session.add(profile)
        
        db.session.commit()
        
        # Log the action
        audit_log = AuditLog(
            user_id=current_user.id,
            action='resume_analyzed',
            entity_type='profile',
            entity_id=profile.id,
            payload={'document_id': document.id, 'model': model}
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Resume analyzed successfully',
            'profile': profile.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/<profile_id>', methods=['GET'])
@token_required
def get_profile(current_user, profile_id):
    """Get a profile by ID."""
    try:
        profile = Profile.query.filter_by(id=profile_id, user_id=current_user.id).first()
        
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        return jsonify({'profile': profile.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/<profile_id>', methods=['PUT'])
@token_required
def update_profile(current_user, profile_id):
    """Update a profile."""
    try:
        data = request.get_json()
        
        # Get profile
        profile = Profile.query.filter_by(id=profile_id, user_id=current_user.id).first()
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        # Update fields
        if 'sectors' in data:
            profile.sectors = data['sectors']
        if 'roles' in data:
            profile.roles = data['roles']
        if 'skills' in data:
            profile.skills = data['skills']
        if 'summary' in data:
            profile.summary = data['summary']
        
        db.session.commit()
        
        # Log the action
        audit_log = AuditLog(
            user_id=current_user.id,
            action='profile_updated',
            entity_type='profile',
            entity_id=profile.id
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'profile': profile.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/list', methods=['GET'])
@token_required
def list_profiles(current_user):
    """List all profiles for the current user."""
    try:
        profiles = Profile.query.filter_by(user_id=current_user.id).all()
        
        return jsonify({
            'profiles': [profile.to_dict() for profile in profiles]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

