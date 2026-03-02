"""
Credential encryption/decryption using AES-256-GCM.
The ENCRYPTION_KEY env var is a base64-encoded 32-byte key.
"""

import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from src.config import ENCRYPTION_KEY


def _get_key() -> bytes:
    """Decode the base64 encryption key."""
    return base64.b64decode(ENCRYPTION_KEY)


def encrypt(plaintext: str) -> str:
    """
    Encrypt a string value. Returns base64-encoded nonce+ciphertext.
    Store the returned string in articles.credentials.encrypted_value.
    """
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce for GCM
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    # Concatenate nonce + ciphertext and base64 encode
    return base64.b64encode(nonce + ciphertext).decode("utf-8")


def decrypt(encrypted_value: str) -> str:
    """
    Decrypt a value from articles.credentials.encrypted_value.
    Expects the base64 format produced by encrypt().
    """
    key = _get_key()
    raw = base64.b64decode(encrypted_value)
    nonce = raw[:12]
    ciphertext = raw[12:]
    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode("utf-8")
