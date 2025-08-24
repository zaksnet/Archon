"""
Encryption utilities for securing provider credentials
"""

import os
import base64
from typing import Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import logging

logger = logging.getLogger(__name__)


class CredentialEncryption:
    """Handles encryption and decryption of sensitive credentials"""
    
    def __init__(self, master_key: Optional[str] = None):
        """
        Initialize encryption with a master key
        
        Args:
            master_key: Master encryption key. If not provided, uses environment variable
        """
        self.master_key = master_key or os.getenv("ENCRYPTION_KEY")
        
        if not self.master_key:
            # Generate a key if none exists (for development only)
            logger.warning("No encryption key provided. Generating one for development use.")
            self.master_key = Fernet.generate_key().decode()
            logger.info(f"Generated encryption key: {self.master_key}")
            logger.warning("Please set ENCRYPTION_KEY environment variable for production use!")
        
        self.cipher = self._initialize_cipher()
    
    def _initialize_cipher(self) -> Fernet:
        """Initialize the Fernet cipher with the master key"""
        # Ensure the key is properly formatted
        if isinstance(self.master_key, str):
            try:
                # Try to use the key directly if it's already a valid Fernet key
                return Fernet(self.master_key.encode() if len(self.master_key) == 44 else self.master_key)
            except Exception:
                # If not a valid Fernet key, derive one from the provided string
                return self._derive_key(self.master_key)
        else:
            return Fernet(self.master_key)
    
    def _derive_key(self, password: str) -> Fernet:
        """Derive a Fernet key from a password string"""
        # Use a fixed salt for consistency (in production, store this securely)
        salt = b'archon_provider_salt_v1'
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return Fernet(key)
    
    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt a plaintext string
        
        Args:
            plaintext: The string to encrypt
            
        Returns:
            Base64 encoded encrypted string
        """
        if not plaintext:
            return ""
        
        try:
            encrypted = self.cipher.encrypt(plaintext.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise ValueError("Failed to encrypt credential")
    
    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt an encrypted string
        
        Args:
            ciphertext: Base64 encoded encrypted string
            
        Returns:
            Decrypted plaintext string
        """
        if not ciphertext:
            return ""
        
        try:
            # Decode from base64
            encrypted = base64.urlsafe_b64decode(ciphertext.encode())
            # Decrypt
            decrypted = self.cipher.decrypt(encrypted)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise ValueError("Failed to decrypt credential")
    
    def rotate_encryption(self, old_ciphertext: str, new_master_key: str) -> str:
        """
        Re-encrypt data with a new master key
        
        Args:
            old_ciphertext: Currently encrypted data
            new_master_key: New master key to use
            
        Returns:
            Data encrypted with new key
        """
        # Decrypt with current key
        plaintext = self.decrypt(old_ciphertext)
        
        # Create new cipher with new key
        old_cipher = self.cipher
        self.master_key = new_master_key
        self.cipher = self._initialize_cipher()
        
        try:
            # Encrypt with new key
            return self.encrypt(plaintext)
        except Exception as e:
            # Restore old cipher if encryption fails
            self.cipher = old_cipher
            raise e
    
    @staticmethod
    def generate_key() -> str:
        """Generate a new Fernet encryption key"""
        return Fernet.generate_key().decode()
    
    def validate_key(self) -> bool:
        """Validate that the encryption key works"""
        try:
            test_string = "test_validation_string"
            encrypted = self.encrypt(test_string)
            decrypted = self.decrypt(encrypted)
            return decrypted == test_string
        except Exception:
            return False


# Global instance for convenience
_encryption = None

def get_encryption() -> CredentialEncryption:
    """Get or create the global encryption instance"""
    global _encryption
    if _encryption is None:
        _encryption = CredentialEncryption()
    return _encryption


def encrypt_credential(plaintext: str) -> str:
    """Convenience function to encrypt a credential"""
    return get_encryption().encrypt(plaintext)


def decrypt_credential(ciphertext: str) -> str:
    """Convenience function to decrypt a credential"""
    return get_encryption().decrypt(ciphertext)