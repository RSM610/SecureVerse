"""Integration tests for authentication endpoints."""
import pytest
from httpx import ASGITransport, AsyncClient

from secureverse.main import app


@pytest.mark.asyncio
async def test_health():
    """Health endpoint should return 200 with status ok."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_login_unknown_did():
    """Login with an unregistered DID should return 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.post("/auth/login", json={
            "did": "did:ethr:0xDEAD",
            "challenge_hex": "aa" * 32,
            "signature_hex": "bb" * 65,
            "totp_code": "000000",
        })
    assert resp.status_code == 401
