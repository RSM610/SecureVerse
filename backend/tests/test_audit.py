from secureverse.audit.logger import _compute_hmac

def test_hmac_deterministic():
    h1 = _compute_hmac("GENESIS", "did:ethr:0xABC", "USER_LOGIN", "2026-04-15T10:00:00+00:00")
    h2 = _compute_hmac("GENESIS", "did:ethr:0xABC", "USER_LOGIN", "2026-04-15T10:00:00+00:00")
    assert h1 == h2 and len(h1) == 64

def test_hmac_changes_with_timestamp():
    h1 = _compute_hmac("GENESIS", "did:ethr:0xABC", "USER_LOGIN", "2026-04-15T10:00:00+00:00")
    h2 = _compute_hmac("GENESIS", "did:ethr:0xABC", "USER_LOGIN", "2026-04-15T11:00:00+00:00")
    assert h1 != h2

def test_chain_breaks_on_tamper():
    h1 = _compute_hmac("GENESIS", "did:ethr:0xABC", "LOGIN", "2026-04-15T10:00:00+00:00")
    good    = _compute_hmac(h1,         "did:ethr:0xABC", "LOGOUT", "2026-04-15T10:05:00+00:00")
    tampered= _compute_hmac("TAMPERED", "did:ethr:0xABC", "LOGOUT", "2026-04-15T10:05:00+00:00")
    assert good != tampered
