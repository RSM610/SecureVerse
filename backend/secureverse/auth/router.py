from fastapi import APIRouter, HTTPException, Request, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, field_validator
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from secureverse.db.models import User, get_session
from secureverse.db.redis_client import get_redis
from secureverse.auth.tokens import create_access_token, create_refresh_token, revoke_token, verify_token
from secureverse.auth.mfa import generate_totp_secret, get_totp_uri, qr_as_base64, verify_totp
from secureverse.blockchain.did import verify_did_ownership, register_did
from secureverse.audit.logger import write_audit

router  = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)
bearer  = HTTPBearer(auto_error=False)

class RegisterRequest(BaseModel):
    did: str
    public_key_hex: str
    wallet_address: str
    private_key_hex: str

    @field_validator("did")
    @classmethod
    def did_must_start(cls, v):
        if not v.startswith("did:"): raise ValueError("DID must start with 'did:'")
        return v

class RegisterResponse(BaseModel):
    totp_uri: str
    qr_base64: str
    message: str

class LoginRequest(BaseModel):
    did: str
    challenge_hex: str
    signature_hex: str
    totp_code: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    did: str
    role: str

class MeResponse(BaseModel):
    did: str; role: str; created_at: str

@router.post("/register", response_model=RegisterResponse)
async def register(body: RegisterRequest, session=Depends(get_session), redis=Depends(get_redis)):
    result = await session.execute(select(User).where(User.did == body.did))
    if result.scalar_one_or_none(): raise HTTPException(409, "DID already registered")
    try:
        await register_did(body.did, body.public_key_hex, body.wallet_address, body.private_key_hex)
    except Exception as e:
        raise HTTPException(502, f"Blockchain error: {e}")
    totp_secret = generate_totp_secret()
    session.add(User(did=body.did, totp_secret=totp_secret, role="user"))
    await session.commit()
    await write_audit(body.did, "USER_REGISTERED", session)
    uri = get_totp_uri(totp_secret, body.did)
    return RegisterResponse(totp_uri=uri, qr_base64=qr_as_base64(uri),
                            message="Registration successful. Scan the QR code.")

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, body: LoginRequest,
                session=Depends(get_session), redis=Depends(get_redis)):
    result = await session.execute(select(User).where(User.did == body.did))
    user = result.scalar_one_or_none()
    if not user: raise HTTPException(401, "Unknown DID")
    now = datetime.now(timezone.utc)
    if user.locked_until and user.locked_until.replace(tzinfo=timezone.utc) > now:
        raise HTTPException(429, "Account locked — try again later")
    if not await verify_did_ownership(body.did, bytes.fromhex(body.challenge_hex), body.signature_hex):
        user.failed_attempts += 1
        if user.failed_attempts >= 5:
            user.locked_until = now + timedelta(minutes=15)
            await write_audit(body.did, "ACCOUNT_LOCKED", session)
        await session.commit()
        raise HTTPException(401, "Invalid signature")
    if not verify_totp(user.totp_secret, body.totp_code):
        raise HTTPException(401, "Invalid TOTP code")
    user.failed_attempts = 0; user.locked_until = None
    await session.commit()
    await write_audit(body.did, "USER_LOGIN", session)
    return TokenResponse(access_token=create_access_token(body.did, user.role),
                         refresh_token=create_refresh_token(body.did, user.role),
                         did=body.did, role=user.role)

@router.post("/logout")
async def logout(body: dict, redis=Depends(get_redis)):
    await revoke_token(body.get("token", ""), redis)
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=MeResponse)
async def me(creds: HTTPAuthorizationCredentials = Security(bearer),
             session=Depends(get_session), redis=Depends(get_redis)):
    if not creds: raise HTTPException(401, "Missing token")
    claims = await verify_token(creds.credentials, redis)
    result = await session.execute(select(User).where(User.did == claims["sub"]))
    user = result.scalar_one_or_none()
    if not user: raise HTTPException(404, "User not found")
    return MeResponse(did=user.did, role=user.role, created_at=user.created_at.isoformat())s