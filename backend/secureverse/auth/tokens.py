from authlib.jose import jwt, JWTClaims
from cryptography.hazmat.primitives.serialization import load_pem_private_key, load_pem_public_key
from datetime import datetime, timedelta, timezone
from secureverse.config import settings

def _private_key():
    with open(settings.rs256_private_key_path, "rb") as f:
        return load_pem_private_key(f.read(), password=None)

def _public_key():
    with open(settings.rs256_public_key_path, "rb") as f:
        return load_pem_public_key(f.read())

def create_access_token(did: str, role: str, expires_minutes: int = 15) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": did, "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
    }
    token = jwt.encode({"alg": "RS256"}, payload, _private_key())
    return token.decode()

def create_refresh_token(did: str, role: str) -> str:
    return create_access_token(did, role, expires_minutes=60 * 24 * 7)

async def verify_token(token: str, redis_client) -> JWTClaims:
    if await redis_client.sismember("revoked_tokens", token):
        raise ValueError("Token revoked")
    claims = jwt.decode(token, _public_key())
    claims.validate()
    return claims

async def revoke_token(token: str, redis_client):
    await redis_client.sadd("revoked_tokens", token)
    await redis_client.expire("revoked_tokens", 60 * 60 * 24 * 7)