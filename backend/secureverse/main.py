from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
from secureverse.db.models import Base, engine
from secureverse.auth.router import router as auth_router, limiter
from secureverse.messaging.relay import router as messaging_router
from secureverse.audit.logger import router as audit_router
from secureverse.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(title="SecureVerse Identity Layer",
              version="1.0.0", lifespan=lifespan)

app.add_middleware(CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth_router)
app.include_router(messaging_router)
app.include_router(audit_router)

@app.get("/health")
async def health(): return {"status": "ok", "service": "SecureVerse"}