from flask import Blueprint, request, jsonify
from src.models.models import db, EmailDraft, Letter, AuditLog
from src.utils.auth import token_required
import urllib.parse

email_bp = Blueprint('email', __name__)

@email_bp.route('/draft', methods=['POST'])
@token_required
def create_email_draft(current_user):
    """Create an email draft from a letter."""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('letter_id'):
            return jsonify({'error': 'letter_id is required'}), 400
        
        # Get letter
        letter = Letter.query.filter_by(id=data['letter_id'], user_id=current_user.id).first()
        if not letter:
            return jsonify({'error': 'Letter not found'}), 404
        
        # Get email parameters
        to_email = data.get('to_email', '')
        cc = data.get('cc', '')
        bcc = data.get('bcc', '')
        
        # Create email draft
        email_draft = EmailDraft(
            user_id=current_user.id,
            letter_id=letter.id,
            to_email=to_email,
            cc=cc,
            bcc=bcc,
            subject=letter.subject,
            body=letter.body
        )
        
        db.session.add(email_draft)
        db.session.commit()
        
        # Log the action
        audit_log = AuditLog(
            user_id=current_user.id,
            action='email_draft_created',
            entity_type='email_draft',
            entity_id=email_draft.id,
            payload={'letter_id': letter.id}
        )
        db.session.add(audit_log)
        db.session.commit()
        
        # Generate mailto link
        mailto_link = generate_mailto_link(to_email, cc, bcc, letter.subject, letter.body)
        
        return jsonify({
            'message': 'Email draft created successfully',
            'email_draft': email_draft.to_dict(),
            'mailto_link': mailto_link
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@email_bp.route('/<email_id>', methods=['GET'])
@token_required
def get_email_draft(current_user, email_id):
    """Get an email draft by ID."""
    try:
        email_draft = EmailDraft.query.filter_by(id=email_id, user_id=current_user.id).first()
        
        if not email_draft:
            return jsonify({'error': 'Email draft not found'}), 404
        
        # Generate mailto link
        mailto_link = generate_mailto_link(
            email_draft.to_email,
            email_draft.cc,
            email_draft.bcc,
            email_draft.subject,
            email_draft.body
        )
        
        return jsonify({
            'email_draft': email_draft.to_dict(),
            'mailto_link': mailto_link
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@email_bp.route('/<email_id>', methods=['PUT'])
@token_required
def update_email_draft(current_user, email_id):
    """Update an email draft."""
    try:
        data = request.get_json()
        
        # Get email draft
        email_draft = EmailDraft.query.filter_by(id=email_id, user_id=current_user.id).first()
        if not email_draft:
            return jsonify({'error': 'Email draft not found'}), 404
        
        # Update fields
        if 'to_email' in data:
            email_draft.to_email = data['to_email']
        if 'cc' in data:
            email_draft.cc = data['cc']
        if 'bcc' in data:
            email_draft.bcc = data['bcc']
        if 'subject' in data:
            email_draft.subject = data['subject']
        if 'body' in data:
            email_draft.body = data['body']
        
        db.session.commit()
        
        # Log the action
        audit_log = AuditLog(
            user_id=current_user.id,
            action='email_draft_updated',
            entity_type='email_draft',
            entity_id=email_draft.id
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Email draft updated successfully',
            'email_draft': email_draft.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@email_bp.route('/list', methods=['GET'])
@token_required
def list_email_drafts(current_user):
    """List all email drafts for the current user."""
    try:
        email_drafts = EmailDraft.query.filter_by(user_id=current_user.id).all()
        
        return jsonify({
            'email_drafts': [draft.to_dict() for draft in email_drafts]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_mailto_link(to_email, cc='', bcc='', subject='', body=''):
    """Generate a mailto link with parameters."""
    params = []
    
    if cc:
        params.append(f"cc={urllib.parse.quote(cc)}")
    if bcc:
        params.append(f"bcc={urllib.parse.quote(bcc)}")
    if subject:
        params.append(f"subject={urllib.parse.quote(subject)}")
    if body:
        params.append(f"body={urllib.parse.quote(body)}")
    
    mailto = f"mailto:{to_email}"
    if params:
        mailto += "?" + "&".join(params)
    
    return mailto

