from fastapi import APIRouter, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import json
from secureverse.db.redis_client import get_redis
from secureverse.auth.tokens import verify_token
from secureverse.audit.logger import write_audit
from secureverse.db.models import get_session

router = APIRouter(prefix="/messages", tags=["messaging"])
bearer = HTTPBearer()

class EncryptedMessage(BaseModel):
    recipient_did: str
    ciphertext_b64: str
    nonce_b64: str

@router.post("/send")
async def send_message(msg: EncryptedMessage,
                        creds: HTTPAuthorizationCredentials = Security(bearer),
                        redis=Depends(get_redis), session=Depends(get_session)):
    claims     = await verify_token(creds.credentials, redis)
    sender_did = claims["sub"]
    payload    = {"sender_did": sender_did, "recipient_did": msg.recipient_did,
                   "ciphertext_b64": msg.ciphertext_b64, "nonce_b64": msg.nonce_b64}
    await redis.lpush(f"msgs:{msg.recipient_did}", json.dumps(payload))
    await redis.expire(f"msgs:{msg.recipient_did}", 86400)
    await write_audit(sender_did, f"MESSAGE_SENT:{msg.recipient_did}", session)
    return {"message": "Delivered"}

@router.get("/inbox")
async def inbox(creds: HTTPAuthorizationCredentials = Security(bearer),
                 redis=Depends(get_redis)):
    claims = await verify_token(creds.credentials, redis)
    items  = await redis.lrange(f"msgs:{claims['sub']}", 0, 49)
    return [json.loads(i) for i in items]