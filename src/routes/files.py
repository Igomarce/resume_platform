from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
from src.models.models import db, File, Document, AuditLog
from src.utils.auth import token_required
from src.utils.ocr import process_file_ocr

files_bp = Blueprint('files', __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'docx'}

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_mime_type(filename):
    """Get MIME type based on file extension."""
    ext = filename.rsplit('.', 1)[1].lower()
    mime_types = {
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
    return mime_types.get(ext, 'application/octet-stream')

@files_bp.route('/upload', methods=['POST'])
@token_required
def upload_file(current_user):
    """Upload a file."""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, f"{current_user.id}_{filename}")
        file.save(file_path)
        
        # Get file info
        file_size = os.path.getsize(file_path)
        mime_type = get_mime_type(filename)
        
        # Create file record
        new_file = File(
            user_id=current_user.id,
            source='local',
            file_name=filename,
            mime_type=mime_type,
            size=file_size,
            storage_url=file_path
        )
        
        db.session.add(new_file)
        db.session.commit()
        
        # Log the action
        audit_log = AuditLog(
            user_id=current_user.id,
            action='file_upload',
            entity_type='file',
            entity_id=new_file.id,
            payload={'filename': filename, 'size': file_size}
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'File uploaded successfully',
            'file': new_file.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@files_bp.route('/<file_id>', methods=['GET'])
@token_required
def get_file(current_user, file_id):
    """Get file information."""
    try:
        file = File.query.filter_by(id=file_id, user_id=current_user.id).first()
        
        if not file:
            return jsonify({'error': 'File not found'}), 404
        
        return jsonify({'file': file.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@files_bp.route('/<file_id>/download', methods=['GET'])
@token_required
def download_file(current_user, file_id):
    """Download a file."""
    try:
        file = File.query.filter_by(id=file_id, user_id=current_user.id).first()
        
        if not file:
            return jsonify({'error': 'File not found'}), 404
        
        if not os.path.exists(file.storage_url):
            return jsonify({'error': 'File not found on disk'}), 404
        
        return send_file(file.storage_url, as_attachment=True, download_name=file.file_name)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@files_bp.route('/import', methods=['POST'])
@token_required
def import_file(current_user):
    """Import a file from cloud storage (placeholder for future implementation)."""
    try:
        data = request.get_json()
        
        # This is a placeholder for cloud import functionality
        # In production, implement OAuth flows for Google Drive, Dropbox, OneDrive
        
        return jsonify({
            'message': 'Cloud import feature coming soon',
            'requested_source': data.get('source')
        }), 501
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

