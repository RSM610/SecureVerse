import pytest
from httpx import AsyncClient, ASGITransport
from secureverse.main import app

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_login_unknown_did():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.post("/auth/login", json={
            "did": "did:ethr:0xDEAD",
            "challenge_hex": "aa" * 32,
            "signature_hex": "bb" * 65,
            "totp_code": "000000",
        })
    assert resp.status_code == 401
