import hmac as _hmac, hashlib, datetime, uuid
from sqlalchemy import select
from secureverse.db.models import AuditEntry, get_session
from secureverse.config import settings
from fastapi import APIRouter, Depends
from secureverse.rbac.middleware import require_role
from pydantic import BaseModel

router = APIRouter(prefix="/audit", tags=["audit"])
SECRET = bytes.fromhex(settings.hmac_secret)

def _compute_hmac(prev_hmac: str, user_did: str, action: str, ts: str) -> str:
    msg = f"{prev_hmac}|{user_did}|{action}|{ts}".encode()
    return _hmac.new(SECRET, msg, hashlib.sha256).hexdigest()

async def write_audit(user_did: str, action: str, session, details=None):
    result = await session.execute(
        select(AuditEntry).order_by(AuditEntry.timestamp.desc()).limit(1))
    last      = result.scalar_one_or_none()
    prev_hmac = last.hmac_chain if last else "GENESIS"
    ts        = datetime.datetime.now(datetime.timezone.utc).isoformat()
    chain     = _compute_hmac(prev_hmac, user_did, action, ts)
    session.add(AuditEntry(id=str(uuid.uuid4()), user_did=user_did, action=action,
        timestamp=datetime.datetime.fromisoformat(ts),
        hmac_chain=chain, prev_hmac=prev_hmac, details=details))
    await session.commit()

async def verify_chain(session) -> bool:
    result  = await session.execute(select(AuditEntry).order_by(AuditEntry.timestamp.asc()))
    entries = result.scalars().all()
    prev    = "GENESIS"
    for e in entries:
        if _compute_hmac(prev, e.user_did, e.action, e.timestamp.isoformat()) != e.hmac_chain:
            return False
        prev = e.hmac_chain
    return True

class AuditEntryOut(BaseModel):
    id: str; user_did: str; action: str; timestamp: str; hmac_chain: str; details: str | None

@router.get("/logs", response_model=list[AuditEntryOut])
async def get_logs(limit: int = 50, did=Depends(require_role("admin", "moderator")),
                    session=Depends(get_session)):
    result = await session.execute(
        select(AuditEntry).order_by(AuditEntry.timestamp.desc()).limit(limit))
    return [AuditEntryOut(id=e.id, user_did=e.user_did, action=e.action,
            timestamp=e.timestamp.isoformat(), hmac_chain=e.hmac_chain, details=e.details)
            for e in result.scalars().all()]

@router.get("/verify")
async def verify(did=Depends(require_role("admin")), session=Depends(get_session)):
    return {"chain_valid": await verify_chain(session), "verified_by": did}