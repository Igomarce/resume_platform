from flask import Blueprint, request, jsonify
from src.models.models import db, User, AuditLog
from src.utils.auth import hash_password, check_password, generate_token, token_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user."""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('name') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Name, email, and password are required'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 400
        
        # Create new user
        hashed_pwd = hash_password(data['password'])
        new_user = User(
            name=data['name'],
            email=data['email'],
            password_hash=hashed_pwd,
            role=data.get('role', 'user')
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        # Log the action
        audit_log = AuditLog(
            user_id=new_user.id,
            action='user_signup',
            entity_type='user',
            entity_id=new_user.id
        )
        db.session.add(audit_log)
        db.session.commit()
        
        # Generate token
        token = generate_token(new_user.id)
        
        return jsonify({
            'message': 'User created successfully',
            'token': token,
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate a user and return a token."""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = User.query.filter_by(email=data['email']).first()
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check password
        if not check_password(data['password'], user.password_hash):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Generate token
        token = generate_token(user.id)
        
        # Log the action
        audit_log = AuditLog(
            user_id=user.id,
            action='user_login',
            entity_type='user',
            entity_id=user.id
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout a user (client-side token removal)."""
    try:
        # Log the action
        audit_log = AuditLog(
            user_id=current_user.id,
            action='user_logout',
            entity_type='user',
            entity_id=current_user.id
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get current user information."""
    return jsonify({'user': current_user.to_dict()}), 200

