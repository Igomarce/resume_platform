from flask import Blueprint, request, jsonify
from src.models.models import db, APICredential, AuditLog
from src.utils.auth import token_required
from src.utils.encryption import encrypt_api_key, decrypt_api_key
from src.utils.llm import validate_api_key

settings_bp = Blueprint('settings', __name__)

AVAILABLE_MODELS = [
    {'id': 'gpt-4.1-mini', 'name': 'GPT-4.1 Mini', 'provider': 'openai'},
    {'id': 'gpt-4.1-nano', 'name': 'GPT-4.1 Nano', 'provider': 'openai'},
    {'id': 'gemini-2.5-flash', 'name': 'Gemini 2.5 Flash', 'provider': 'google'},
]

@settings_bp.route('/models', methods=['GET'])
@token_required
def get_models(current_user):
    """Get available LLM models."""
    return jsonify({'models': AVAILABLE_MODELS}), 200

@settings_bp.route('/api-key', methods=['POST'])
@token_required
def save_api_key(current_user):
    """Save or update an API key for an LLM provider."""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('provider') or not data.get('api_key'):
            return jsonify({'error': 'provider and api_key are required'}), 400
        
        provider = data['provider']
        api_key = data['api_key']
        
        # Validate API key format
        if not api_key.startswith('sk-'):
            return jsonify({'error': 'Invalid API key format'}), 400
        
        # Optionally validate the key by making a test request
        if data.get('validate', False):
            is_valid = validate_api_key(api_key, provider)
            if not is_valid:
                return jsonify({'error': 'API key validation failed'}), 400
        
        # Encrypt API key
        encrypted_key = encrypt_api_key(api_key)
        
        # Check if credential already exists
        existing_credential = APICredential.query.filter_by(user_id=current_user.id, provider=provider).first()
        
        if existing_credential:
            # Update existing credential
            existing_credential.api_key_enc = encrypted_key
            credential = existing_credential
        else:
            # Create new credential
            credential = APICredential(
                user_id=current_user.id,
                provider=provider,
                api_key_enc=encrypted_key
            )
            db.session.add(credential)
        
        db.session.commit()
        
        # Log the action
        audit_log = AuditLog(
            user_id=current_user.id,
            action='api_key_saved',
            entity_type='api_credential',
            entity_id=credential.id,
            payload={'provider': provider}
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'API key saved successfully',
            'credential': credential.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/api-key/<provider>', methods=['GET'])
@token_required
def get_api_key(current_user, provider):
    """Get API key status for a provider (without revealing the key)."""
    try:
        credential = APICredential.query.filter_by(user_id=current_user.id, provider=provider).first()
        
        if not credential:
            return jsonify({'exists': False}), 200
        
        return jsonify({
            'exists': True,
            'credential': credential.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/api-key/<provider>', methods=['DELETE'])
@token_required
def delete_api_key(current_user, provider):
    """Delete an API key for a provider."""
    try:
        credential = APICredential.query.filter_by(user_id=current_user.id, provider=provider).first()
        
        if not credential:
            return jsonify({'error': 'API key not found'}), 404
        
        credential_id = credential.id
        
        db.session.delete(credential)
        db.session.commit()
        
        # Log the action
        audit_log = AuditLog(
            user_id=current_user.id,
            action='api_key_deleted',
            entity_type='api_credential',
            entity_id=credential_id,
            payload={'provider': provider}
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({'message': 'API key deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

