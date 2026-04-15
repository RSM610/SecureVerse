from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from secureverse.db.models import User, get_session
from secureverse.db.redis_client import get_redis
from secureverse.auth.tokens import verify_token

bearer = HTTPBearer()

def require_role(*allowed_roles: str):
    async def checker(
        creds: HTTPAuthorizationCredentials = Security(bearer),
        session=Depends(get_session),
        redis=Depends(get_redis),
    ) -> str:
        claims = await verify_token(creds.credentials, redis)
        did    = claims["sub"]
        cached = await redis.get(f"role:{did}")
        if cached:
            role = cached.decode() if isinstance(cached, bytes) else cached
        else:
            result = await session.execute(select(User).where(User.did == did))
            user   = result.scalar_one_or_none()
            if not user: raise HTTPException(403, "User not found")
            role = user.role
            await redis.setex(f"role:{did}", 60, role)
        if role not in allowed_roles:
            raise HTTPException(403, f"Insufficient role. Required: {allowed_roles}")
        return did
    return checker