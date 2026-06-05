import hmac
import hashlib
import base64
import json
import time
from typing import Dict, Any, Optional
from cryptography.fernet import Fernet
from backend.config import SECRET_KEY
from backend.database import save_user, get_user

def get_fernet() -> Fernet:
    # Derive a key from the SECRET_KEY using SHA256 to ensure it is 32 bytes and base64-encoded
    key = base64.urlsafe_b64encode(hashlib.sha256(SECRET_KEY.encode()).digest())
    return Fernet(key)

class AuthService:
    @staticmethod
    def encrypt_token(token: str) -> str:
        """Encrypts a string symmetrically using Fernet."""
        if not token:
            return ""
        try:
            f = get_fernet()
            return f.encrypt(token.encode('utf-8')).decode('utf-8')
        except Exception:
            return ""

    @staticmethod
    def decrypt_token(encrypted_token: str) -> str:
        """Decrypts a string symmetrically using Fernet."""
        if not encrypted_token:
            return ""
        try:
            f = get_fernet()
            return f.decrypt(encrypted_token.encode('utf-8')).decode('utf-8')
        except Exception:
            return ""

    @staticmethod
    def generate_token(payload: Dict[str, Any], expires_in: int = 604800) -> str:
        """Generates a secure HMAC-SHA256 signed base64 token."""
        header = {"alg": "HS256", "typ": "JWT"}
        
        payload_copy = payload.copy()
        payload_copy["exp"] = time.time() + expires_in
        
        # Base64 encode header and payload
        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode('utf-8')).decode('utf-8').rstrip('=')
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload_copy).encode('utf-8')).decode('utf-8').rstrip('=')
        
        # Create signature
        message = f"{header_b64}.{payload_b64}"
        signature = hmac.new(
            SECRET_KEY.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        signature_b64 = base64.urlsafe_b64encode(signature).decode('utf-8').rstrip('=')
        
        return f"{header_b64}.{payload_b64}.{signature_b64}"

    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """Verifies HMAC-SHA256 signature and returns the payload if valid."""
        try:
            parts = token.split(".")
            if len(parts) != 3:
                return None
                
            header_b64, payload_b64, signature_b64 = parts
            
            # Recreate signature
            message = f"{header_b64}.{payload_b64}"
            
            # Ensure padding
            def add_padding(b64_str: str) -> str:
                return b64_str + '=' * (4 - len(b64_str) % 4)
                
            expected_sig = hmac.new(
                SECRET_KEY.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            ).digest()
            
            expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode('utf-8').rstrip('=')
            
            # Constant-time comparison
            if not hmac.compare_digest(signature_b64, expected_sig_b64):
                return None
                
            # Decode payload
            payload_str = base64.urlsafe_b64decode(add_padding(payload_b64).encode('utf-8')).decode('utf-8')
            payload = json.loads(payload_str)
            
            # Check expiration
            if payload.get("exp", 0) < time.time():
                return None
                
            return payload
        except Exception:
            return None

    @staticmethod
    def login_user(username: str, github_token: Optional[str] = None, avatar_url: Optional[str] = None) -> Dict[str, Any]:
        """Logs in a user, encrypting the token, and returning a signed session token."""
        avatar = avatar_url or f"https://github.com/{username}.png"
        
        # Symmetrically encrypt the token before database storage
        encrypted = AuthService.encrypt_token(github_token or "")
        
        # Save to DB
        user = save_user(username, avatar, encrypted)
        
        # Generate session token
        token = AuthService.generate_token({"username": username, "user_id": user["id"]})
        
        return {
            "token": token,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "avatar_url": user["avatar_url"],
                "has_github_token": bool(github_token or user.get("github_token"))
            }
        }

