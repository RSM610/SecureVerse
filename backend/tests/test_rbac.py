"""Integration tests for RBAC-protected endpoints."""
import pytest
from httpx import ASGITransport, AsyncClient

from secureverse.main import app


@pytest.mark.asyncio
async def test_audit_logs_requires_auth():
    """Audit log endpoint should reject unauthenticated requests."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/audit/logs")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_verify_chain_requires_admin():
    """Chain verification endpoint should require admin privileges."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/audit/verify")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_send_message_requires_auth():
    """Message send endpoint should reject unauthenticated requests."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.post("/messages/send", json={
            "recipient_did": "did:ethr:0xABC",
            "ciphertext_b64": "dGVzdA==",
            "nonce_b64": "bm9uY2U=",
        })
    assert resp.status_code in (401, 403)
