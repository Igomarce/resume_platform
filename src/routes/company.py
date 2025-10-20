from flask import Blueprint, request, jsonify
from src.models.models import db, Company, APICredential, AuditLog
from src.utils.auth import token_required
from src.utils.llm import analyze_company
from src.utils.encryption import decrypt_api_key

company_bp = Blueprint('company', __name__)

@company_bp.route('/analyze', methods=['POST'])
@token_required
def analyze_company_endpoint(current_user):
    """Analyze a company using LLM."""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('name'):
            return jsonify({'error': 'Company name is required'}), 400
        
        company_name = data['name']
        website = data.get('website')
        job_url = data.get('job_url')
        
        # Get API key
        api_key = None
        provider = data.get('provider', 'openai')
        credential = APICredential.query.filter_by(user_id=current_user.id, provider=provider).first()
        if credential:
            api_key = decrypt_api_key(credential.api_key_enc)
        
        # Get model
        model = data.get('model', 'gpt-4.1-mini')
        
        # Analyze company
        result = analyze_company(company_name, website=website, job_url=job_url, api_key=api_key, model=model)
        
        if result['status'] == 'failed':
            return jsonify({'error': result.get('error', 'Company analysis failed')}), 500
        
        analysis = result['analysis']
        
        # Create company record
        company = Company(
            user_id=current_user.id,
            name=company_name,
            website=website,
            source_url=job_url,
            summary=analysis.get('summary', ''),
            focus_areas=analysis.get('focus_areas', []),
            requirements=analysis.get('requirements', [])
        )
        
        db.session.add(company)
        db.session.commit()
        
        # Log the action
        audit_log = AuditLog(
            user_id=current_user.id,
            action='company_analyzed',
            entity_type='company',
            entity_id=company.id,
            payload={'name': company_name, 'model': model}
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Company analyzed successfully',
            'company': company.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@company_bp.route('/<company_id>', methods=['GET'])
@token_required
def get_company(current_user, company_id):
    """Get a company by ID."""
    try:
        company = Company.query.filter_by(id=company_id, user_id=current_user.id).first()
        
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        return jsonify({'company': company.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@company_bp.route('/<company_id>', methods=['PUT'])
@token_required
def update_company(current_user, company_id):
    """Update a company."""
    try:
        data = request.get_json()
        
        # Get company
        company = Company.query.filter_by(id=company_id, user_id=current_user.id).first()
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Update fields
        if 'name' in data:
            company.name = data['name']
        if 'website' in data:
            company.website = data['website']
        if 'source_url' in data:
            company.source_url = data['source_url']
        if 'summary' in data:
            company.summary = data['summary']
        if 'focus_areas' in data:
            company.focus_areas = data['focus_areas']
        if 'requirements' in data:
            company.requirements = data['requirements']
        
        db.session.commit()
        
        # Log the action
        audit_log = AuditLog(
            user_id=current_user.id,
            action='company_updated',
            entity_type='company',
            entity_id=company.id
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Company updated successfully',
            'company': company.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@company_bp.route('/list', methods=['GET'])
@token_required
def list_companies(current_user):
    """List all companies for the current user."""
    try:
        companies = Company.query.filter_by(user_id=current_user.id).all()
        
        return jsonify({
            'companies': [company.to_dict() for company in companies]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

