import base64
import pytest

from src.server.providers.security.encryption import CredentialEncryption, encrypt_credential, decrypt_credential


def test_encrypt_decrypt_roundtrip_with_explicit_key():
    key = CredentialEncryption.generate_key()
    enc = CredentialEncryption(master_key=key)

    plaintext = "super-secret"
    cipher = enc.encrypt(plaintext)

    assert isinstance(cipher, str)
    # Should be urlsafe base64
    base64.urlsafe_b64decode(cipher.encode())

    back = enc.decrypt(cipher)
    assert back == plaintext


def test_encrypt_handles_empty_and_decrypt_handles_empty():
    key = CredentialEncryption.generate_key()
    enc = CredentialEncryption(master_key=key)

    assert enc.encrypt("") == ""
    assert enc.decrypt("") == ""


def test_decrypt_invalid_cipher_raises():
    key = CredentialEncryption.generate_key()
    enc = CredentialEncryption(master_key=key)

    with pytest.raises(ValueError):
        enc.decrypt("not-base64!")


def test_rotate_key_preserves_plaintext():
    key1 = CredentialEncryption.generate_key()
    key2 = CredentialEncryption.generate_key()

    enc = CredentialEncryption(master_key=key1)
    c1 = enc.encrypt("token-123")

    c2 = enc.rotate_encryption(c1, key2)
    # After rotation, decrypt with the new cipher
    assert enc.decrypt(c2) == "token-123"


def test_validate_key_true_for_functioning_cipher():
    key = CredentialEncryption.generate_key()
    enc = CredentialEncryption(master_key=key)
    assert enc.validate_key() is True


def test_module_level_helpers_use_singleton():
    # Basic smoke test for helpers
    cipher = encrypt_credential("abc")
    assert isinstance(cipher, str)
    assert decrypt_credential(cipher) == "abc"
