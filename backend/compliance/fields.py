"""Field-level encryption helpers for sensitive data at rest.

Use Fernet (symmetric, authenticated) from `cryptography` to keep
implementation surface tiny — no extra Django package required.

The key is derived from settings.SECRET_KEY (HKDF). On rotation, you must
re-encrypt existing ciphertexts via a data migration.
"""
from __future__ import annotations

import base64

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from django.conf import settings
from django.db import models


_FERNET: Fernet | None = None


def _get_fernet() -> Fernet:
    global _FERNET
    if _FERNET is None:
        secret = (settings.SECRET_KEY or "").encode("utf-8")
        derived = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b"lafoi-fernet-v1",
            info=b"field-encryption",
        ).derive(secret)
        key = base64.urlsafe_b64encode(derived)
        _FERNET = Fernet(key)
    return _FERNET


class EncryptedTextField(models.TextField):
    """A TextField whose contents are stored encrypted at rest.

    Reads transparently decrypt; if a ciphertext is corrupt or missing the
    leading marker, returns the raw value unchanged so legacy plaintext rows
    continue to work during a migration window.
    """

    description = "Encrypted text"

    PREFIX = "lf:1:"  # version marker so we can rotate later without breaking

    def from_db_value(self, value, expression, connection):
        return self._maybe_decrypt(value)

    def to_python(self, value):
        if isinstance(value, str) and value.startswith(self.PREFIX):
            return self._maybe_decrypt(value)
        return value

    def get_prep_value(self, value):
        if value is None or value == "":
            return value
        if isinstance(value, str) and value.startswith(self.PREFIX):
            return value  # already encrypted
        token = _get_fernet().encrypt(value.encode("utf-8")).decode("utf-8")
        return f"{self.PREFIX}{token}"

    def _maybe_decrypt(self, value):
        if value is None or value == "":
            return value
        if not isinstance(value, str) or not value.startswith(self.PREFIX):
            return value
        try:
            ciphertext = value[len(self.PREFIX):].encode("utf-8")
            return _get_fernet().decrypt(ciphertext).decode("utf-8")
        except (InvalidToken, ValueError):
            return value
