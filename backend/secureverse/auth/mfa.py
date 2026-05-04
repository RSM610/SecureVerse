"""TOTP-based multi-factor authentication utilities."""
import base64
import io

import pyotp
import qrcode


def generate_totp_secret() -> str:
    """Generate a random base32 TOTP secret."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, did: str) -> str:
    """Build a provisioning URI for the given DID and TOTP secret."""
    return pyotp.TOTP(secret).provisioning_uri(name=did, issuer_name="SecureVerse")


def verify_totp(secret: str, code: str) -> bool:
    """Return True if *code* is valid for *secret* within a one-step window."""
    return pyotp.TOTP(secret).verify(code, valid_window=1)


def qr_as_base64(uri: str) -> str:
    """Render *uri* as a PNG QR code and return it base64-encoded."""
    buf = io.BytesIO()
    qrcode.make(uri).save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()
