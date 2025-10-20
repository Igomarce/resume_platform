from cryptography.fernet import Fernet
import os

# In production, store this in environment variable
ENCRYPTION_KEY = b'Zk8vJ3qR5tN9wX2pL6mK4hF7gD1sA0yU8iO3eB5nC7vM='

def get_cipher():
    """Get a Fernet cipher instance."""
    return Fernet(ENCRYPTION_KEY)

def encrypt_api_key(api_key):
    """Encrypt an API key."""
    cipher = get_cipher()
    encrypted = cipher.encrypt(api_key.encode('utf-8'))
    return encrypted.decode('utf-8')

def decrypt_api_key(encrypted_key):
    """Decrypt an API key."""
    cipher = get_cipher()
    decrypted = cipher.decrypt(encrypted_key.encode('utf-8'))
    return decrypted.decode('utf-8')

