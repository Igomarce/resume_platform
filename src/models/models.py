from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default='user', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    api_credentials = db.relationship('APICredential', backref='user', lazy=True, cascade='all, delete-orphan')
    files = db.relationship('File', backref='user', lazy=True, cascade='all, delete-orphan')
    documents = db.relationship('Document', backref='user', lazy=True, cascade='all, delete-orphan')
    profiles = db.relationship('Profile', backref='user', lazy=True, cascade='all, delete-orphan')
    companies = db.relationship('Company', backref='user', lazy=True, cascade='all, delete-orphan')
    letters = db.relationship('Letter', backref='user', lazy=True, cascade='all, delete-orphan')
    email_drafts = db.relationship('EmailDraft', backref='user', lazy=True, cascade='all, delete-orphan')
    audit_logs = db.relationship('AuditLog', backref='user', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class APICredential(db.Model):
    __tablename__ = 'api_credentials'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    provider = db.Column(db.String(100), nullable=False)
    api_key_enc = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'provider': self.provider,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class File(db.Model):
    __tablename__ = 'files'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    source = db.Column(db.String(50), nullable=False)  # local, gdrive, dropbox, onedrive
    provider_file_id = db.Column(db.String(255))
    file_name = db.Column(db.String(255), nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    size = db.Column(db.Integer, nullable=False)
    storage_url = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    documents = db.relationship('Document', backref='file', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'source': self.source,
            'file_name': self.file_name,
            'mime_type': self.mime_type,
            'size': self.size,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    file_id = db.Column(db.String(36), db.ForeignKey('files.id', ondelete='SET NULL'))
    doc_type = db.Column(db.String(50), nullable=False)  # resume, certificate, portfolio, other
    language = db.Column(db.String(10), nullable=False)
    raw_text = db.Column(db.Text)
    edited_text = db.Column(db.Text)
    status = db.Column(db.String(50), nullable=False)  # uploaded, ocred, edited
    version = db.Column(db.Integer, default=1, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profiles = db.relationship('Profile', backref='document', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'doc_type': self.doc_type,
            'language': self.language,
            'status': self.status,
            'version': self.version,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Profile(db.Model):
    __tablename__ = 'profiles'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    document_id = db.Column(db.String(36), db.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False)
    sectors = db.Column(db.JSON)
    roles = db.Column(db.JSON)
    skills = db.Column(db.JSON)
    summary = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    letters = db.relationship('Letter', backref='profile', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'sectors': self.sectors,
            'roles': self.roles,
            'skills': self.skills,
            'summary': self.summary,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    website = db.Column(db.String(500))
    source_url = db.Column(db.String(500))
    summary = db.Column(db.Text)
    focus_areas = db.Column(db.JSON)
    requirements = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    letters = db.relationship('Letter', backref='company', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'website': self.website,
            'source_url': self.source_url,
            'summary': self.summary,
            'focus_areas': self.focus_areas,
            'requirements': self.requirements,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Letter(db.Model):
    __tablename__ = 'letters'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    profile_id = db.Column(db.String(36), db.ForeignKey('profiles.id', ondelete='CASCADE'), nullable=False)
    company_id = db.Column(db.String(36), db.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    language = db.Column(db.String(10), nullable=False)
    tone = db.Column(db.String(50), nullable=False)
    subject = db.Column(db.String(500))
    body = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), nullable=False)  # draft, edited, exported, sent
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    email_drafts = db.relationship('EmailDraft', backref='letter', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'profile_id': self.profile_id,
            'company_id': self.company_id,
            'language': self.language,
            'tone': self.tone,
            'subject': self.subject,
            'body': self.body,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class EmailDraft(db.Model):
    __tablename__ = 'email_drafts'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    letter_id = db.Column(db.String(36), db.ForeignKey('letters.id', ondelete='CASCADE'), nullable=False)
    to_email = db.Column(db.String(255))
    cc = db.Column(db.String(500))
    bcc = db.Column(db.String(500))
    subject = db.Column(db.String(500))
    body = db.Column(db.Text, nullable=False)
    export_link = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'letter_id': self.letter_id,
            'to_email': self.to_email,
            'cc': self.cc,
            'bcc': self.bcc,
            'subject': self.subject,
            'body': self.body,
            'export_link': self.export_link,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class AuditLog(db.Model):
    __tablename__ = 'audit_log'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='SET NULL'))
    action = db.Column(db.String(100), nullable=False)
    entity_type = db.Column(db.String(100))
    entity_id = db.Column(db.String(36))
    payload = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'payload': self.payload,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

