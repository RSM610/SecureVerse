import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import BubbleBackground from '../components/BubbleBackground'

// ── Ethereum personal_sign (matches eth_account.recover_message on the backend) ──
// Backend uses: encode_defunct(primitive=challenge) then recover_message(msg, signature=...)
// That's the standard Ethereum "personal sign" / EIP-191 prefix approach.

async function importPrivateKey(hexKey) {
  // Strip 0x prefix
  const clean = hexKey.startsWith('0x') || hexKey.startsWith('0X')
    ? hexKey.slice(2)
    : hexKey

  if (clean.length !== 64) throw new Error('Private key must be 32 bytes (64 hex chars)')

  const keyBytes = hexToBytes(clean)
  return keyBytes
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Ethereum personal_sign: keccak256("\x19Ethereum Signed Message:\n" + len + message)
// We need to implement this without ethers to keep bundle small.
// We'll use the SubtleCrypto API for SHA-256, but Ethereum uses keccak256.
// Best approach: use a small inline keccak implementation or import from a CDN.
// Since this project already has no ethers dep in frontend, we'll do the signing
// by calling the backend challenge endpoint differently — but actually the cleanest
// fix is to use the secp256k1 library that's already available via tweetnacl won't work
// for secp256k1. Let's use noble/secp256k1 via dynamic import from esm.sh

async function signChallenge(privateKeyHex, challengeHex) {
  // Dynamically import noble/secp256k1 (small, no bundler needed at runtime)
  const { secp256k1 } = await import('https://esm.sh/@noble/curves@1.2.0/secp256k1')
  const { keccak_256 } = await import('https://esm.sh/@noble/hashes@1.3.2/sha3')

  const privKeyBytes = hexToBytes(
    privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex
  )
  const challengeBytes = hexToBytes(challengeHex)

  // Ethereum personal_sign prefix: "\x19Ethereum Signed Message:\n32"
  const prefix = new TextEncoder().encode('\x19Ethereum Signed Message:\n32')
  const prefixed = new Uint8Array(prefix.length + challengeBytes.length)
  prefixed.set(prefix)
  prefixed.set(challengeBytes, prefix.length)

  const msgHash = keccak_256(prefixed)

  // Sign with secp256k1 (deterministic, returns {r, s, recovery})
  const sig = secp256k1.sign(msgHash, privKeyBytes)

  // Build 65-byte signature: r (32) + s (32) + v (1, where v = recovery + 27)
  const rBytes = sig.r.toString(16).padStart(64, '0')
  const sBytes = sig.s.toString(16).padStart(64, '0')
  const v = (sig.recovery + 27).toString(16).padStart(2, '0')

  return rBytes + sBytes + v
}

export default function LoginPage() {
  const navigate    = useNavigate()
  const loginStore  = useAuthStore(s => s.login)

  const [did,     setDid]     = useState('')
  const [pk,      setPk]      = useState('')
  const [totp,    setTotp]    = useState(['','','','','',''])
  const [showPk,  setShowPk]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const refs = useRef([])
  const totpStr = totp.join('')

  const handleDigit = (i, val) => {
    const v = val.replace(/\D/g, '').slice(-1)
    setTotp(prev => { const n = [...prev]; n[i] = v; return n })
    if (v && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !totp[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handlePaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    if (p.length === 6) { setTotp(p.split('')); refs.current[5]?.focus() }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (totpStr.length !== 6) { setError('Enter all 6 TOTP digits'); return }
    setError(''); setLoading(true)

    try {
      // 1. Generate a 32-byte random challenge
      const challenge    = crypto.getRandomValues(new Uint8Array(32))
      const challengeHex = bytesToHex(challenge)

      // 2. Sign the challenge with the private key (Ethereum personal_sign style)
      let signatureHex
      try {
        signatureHex = await signChallenge(pk, challengeHex)
      } catch (sigErr) {
        setError(`Signing error: ${sigErr.message}. Check your private key format (64 hex chars).`)
        setLoading(false)
        return
      }

      // 3. Submit to backend
      const { data } = await api.post('/auth/login', {
        did,
        challenge_hex: challengeHex,
        signature_hex: signatureHex,
        totp_code: totpStr,
      })

      loginStore(data.access_token, data.refresh_token, data.did, data.role)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  const digitStyle = (filled) => ({
    width: 44, height: 52,
    background:  filled ? 'rgba(14,165,233,0.12)' : 'rgba(255,255,255,0.05)',
    border:      `1px solid ${filled ? 'rgba(14,165,233,0.55)' : 'rgba(255,255,255,0.09)'}`,
    borderRadius: 11,
    color: '#38bdf8', fontSize: 20, fontWeight: 700,
    fontFamily: 'JetBrains Mono, monospace',
    textAlign: 'center', outline: 'none',
    transition: 'all 0.15s',
    boxShadow: filled ? '0 0 0 3px rgba(14,165,233,0.1)' : 'none',
  })

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: '#060a12', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <BubbleBackground count={16} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 13px',
            background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 25,
          }}>🛡</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 5 }}>
            Sign in to{' '}
            <span style={{ background: 'linear-gradient(90deg,#7dd3fc,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SecureVerse
            </span>
          </h1>
          <p style={{ fontSize: 12, color: '#334155' }}>DID-based decentralised authentication</p>
        </div>

        {/* Card */}
        <div className="card" style={{ borderRadius: 22, padding: 30 }}>
          <form onSubmit={handleSubmit}>

            {/* DID */}
            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Your DID</label>
              <input
                className="input-field mono"
                placeholder="did:ethr:0x..."
                value={did}
                onChange={e => setDid(e.target.value)}
                required
              />
            </div>

            {/* Private Key */}
            <div style={{ marginBottom: 20 }}>
              <label className="field-label">Private Key (hex, 64 chars)</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input-field mono"
                  type={showPk ? 'text' : 'password'}
                  placeholder="0x... or raw 64-char hex"
                  value={pk}
                  onChange={e => setPk(e.target.value)}
                  style={{ paddingRight: 42 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPk(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#334155', padding: 4,
                  }}
                >
                  {showPk ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p style={{ fontSize: 10, color: '#1e293b', marginTop: 5 }}>
                Used client-side only to sign the challenge — never sent to the server.
              </p>
            </div>

            {/* TOTP digits */}
            <div style={{ marginBottom: 22 }}>
              <label className="field-label">TOTP Code — from authenticator app</label>
              <div style={{ display: 'flex', gap: 7, justifyContent: 'center' }} onPaste={handlePaste}>
                {totp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => refs.current[i] = el}
                    type="text" inputMode="numeric" maxLength={1}
                    value={d}
                    onChange={e => handleDigit(i, e.target.value)}
                    onKeyDown={e => handleKey(i, e)}
                    style={digitStyle(!!d)}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 14 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: 13, fontSize: 15 }}
              disabled={loading}
            >
              {loading
                ? <><div className="spinner" /> Signing & authenticating…</>
                : <>Sign In <ArrowRight size={15} /></>}
            </button>
          </form>

          <div className="divider">or</div>

          <Link to="/register" style={{ textDecoration: 'none' }}>
            <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
              Create Account — Register DID
            </button>
          </Link>

          {/* Security strip */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 18 }}>
            {['RS256 JWT', 'TOTP 2FA', 'Rate Limited'].map(l => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#1e293b' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399' }} />
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}