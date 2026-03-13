# utils/helpers.py
import secrets

def generate_secure_id():
    return secrets.token_hex(64)