"""JWT token creation, verification, and revocation."""
from datetime import datetime, timedelta, timezone

from authlib.jose import JWTClaims, jwt
from cryptography.hazmat.primitives.serialization import load_pem_private_key, load_pem_public_key

from secureverse.config import settings


def _private_key():
    """Load the RS256 private key from disk."""
    with open(settings.rs256_private_key_path, "rb") as f:
        return load_pem_private_key(f.read(), password=None)


def _public_key():
    """Load the RS256 public key from disk."""
    with open(settings.rs256_public_key_path, "rb") as f:
        return load_pem_public_key(f.read())


def create_access_token(did: str, role: str, expires_minutes: int = 15) -> str:
    """Create a signed RS256 JWT access token."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": did, "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
    }
    token = jwt.encode({"alg": "RS256"}, payload, _private_key())
    return token.decode()


def create_refresh_token(did: str, role: str) -> str:
    """Create a long-lived refresh token."""
    return create_access_token(did, role, expires_minutes=60 * 24 * 7)


async def verify_token(token: str, redis_client) -> JWTClaims:
    """Verify a JWT and raise ValueError if revoked or invalid."""
    if await redis_client.sismember("revoked_tokens", token):
        raise ValueError("Token revoked")
    claims = jwt.decode(token, _public_key())
    claims.validate()
    return claims


async def revoke_token(token: str, redis_client):
    """Add a token to the revoked set in Redis."""
    await redis_client.sadd("revoked_tokens", token)
    await redis_client.expire("revoked_tokens", 60 * 60 * 24 * 7)
