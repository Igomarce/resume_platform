from flask import Blueprint, request, jsonify
from src.models.models import db, File, Document, AuditLog
from src.utils.auth import token_required
from src.utils.ocr import process_file_ocr

ocr_bp = Blueprint('ocr', __name__)

@ocr_bp.route('/run', methods=['POST'])
@token_required
def run_ocr(current_user):
    """Run OCR on an uploaded file."""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('file_id'):
            return jsonify({'error': 'file_id is required'}), 400
        
        # Get file
        file = File.query.filter_by(id=data['file_id'], user_id=current_user.id).first()
        if not file:
            return jsonify({'error': 'File not found'}), 404
        
        # Process OCR
        ocr_result = process_file_ocr(file.storage_url, file.mime_type)
        
        if ocr_result['status'] == 'failed':
            return jsonify({'error': ocr_result.get('error', 'OCR processing failed')}), 500
        
        # Create or update document
        doc_type = data.get('doc_type', 'resume')
        existing_doc = Document.query.filter_by(file_id=file.id, user_id=current_user.id).first()
        
        if existing_doc:
            # Update existing document
            existing_doc.raw_text = ocr_result['text']
            existing_doc.language = ocr_result['language']
            existing_doc.status = 'ocred'
            existing_doc.version += 1
            document = existing_doc
        else:
            # Create new document
            document = Document(
                user_id=current_user.id,
                file_id=file.id,
                doc_type=doc_type,
                language=ocr_result['language'],
                raw_text=ocr_result['text'],
                status='ocred'
            )
            db.session.add(document)
        
        db.session.commit()
        
        # Log the action
        audit_log = AuditLog(
            user_id=current_user.id,
            action='ocr_processed',
            entity_type='document',
            entity_id=document.id,
            payload={'file_id': file.id, 'language': ocr_result['language']}
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'OCR processing completed',
            'document': document.to_dict(),
            'text': ocr_result['text']
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ocr_bp.route('/<document_id>', methods=['GET'])
@token_required
def get_ocr_result(current_user, document_id):
    """Get OCR result for a document."""
    try:
        document = Document.query.filter_by(id=document_id, user_id=current_user.id).first()
        
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        return jsonify({
            'document': document.to_dict(),
            'raw_text': document.raw_text,
            'edited_text': document.edited_text
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ocr_bp.route('/<document_id>/edit', methods=['PUT'])
@token_required
def edit_document(current_user, document_id):
    """Edit the text of a document."""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or 'edited_text' not in data:
            return jsonify({'error': 'edited_text is required'}), 400
        
        # Get document
        document = Document.query.filter_by(id=document_id, user_id=current_user.id).first()
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        # Update document
        document.edited_text = data['edited_text']
        document.status = 'edited'
        document.version += 1
        
        db.session.commit()
        
        # Log the action
        audit_log = AuditLog(
            user_id=current_user.id,
            action='document_edited',
            entity_type='document',
            entity_id=document.id
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Document updated successfully',
            'document': document.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

