import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Info } from 'lucide-react'
import api from '../api/client'
import BubbleBackground from '../components/BubbleBackground'
import QRModal from '../components/QRModal'

const FIELDS = [
  { key: 'did',           label: 'DID',              placeholder: 'did:ethr:0x...', type: 'text',     mono: true },
  { key: 'walletAddress', label: 'Wallet Address',   placeholder: '0x...',          type: 'text',     mono: true },
  { key: 'publicKeyHex',  label: 'Public Key (hex)', placeholder: 'secp256k1 uncompressed public key', type: 'text', mono: true },
  { key: 'privateKeyHex', label: 'Private Key (hex)',placeholder: '0x...',          type: 'password', mono: true },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form,    setForm]    = useState({ did:'', walletAddress:'', publicKeyHex:'', privateKeyHex:'' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [qrData,  setQrData]  = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/register', {
        did: form.did, public_key_hex: form.publicKeyHex,
        wallet_address: form.walletAddress, private_key_hex: form.privateKeyHex,
      })
      setQrData({ qr: data.qr_base64, uri: data.totp_uri })
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', position:'relative', background:'#060a12', display:'flex', alignItems:'center', justifyContent:'center', padding:'28px 16px' }}>
      <div style={{ position:'fixed', inset:0, zIndex:0 }}><BubbleBackground count={16} /></div>
      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:26 }}>
          <div style={{ width:56, height:56, borderRadius:16, margin:'0 auto 13px', background:'linear-gradient(135deg,#0ea5e9,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:25 }}>🛡</div>
          <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:'-.025em', marginBottom:5 }}>
            Create{' '}
            <span style={{ background:'linear-gradient(90deg,#7dd3fc,#67e8f9)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Account</span>
          </h1>
          <p style={{ fontSize:12, color:'#334155' }}>Register your DID on Ethereum Sepolia</p>
        </div>
        <div className="card" style={{ borderRadius:22, padding:30 }}>
          <div className="alert alert-info" style={{ marginBottom:18, fontSize:11 }}>
            <Info size={13} style={{ flexShrink:0 }} />
            DID + public key go on-chain. Server stores only your TOTP secret.
          </div>
          <form onSubmit={handleSubmit}>
            {FIELDS.map(({ key, label, placeholder, type, mono }) => (
              <div key={key} style={{ marginBottom:13 }}>
                <label className="field-label">{label}</label>
                <input
                  className={`input-field${mono ? ' mono' : ''}`}
                  type={type} placeholder={placeholder}
                  value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  required
                />
              </div>
            ))}
            {error && <div className="alert alert-error" style={{ marginBottom:13 }}>{error}</div>}
            <button type="submit" className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:13, fontSize:15, marginTop:4 }} disabled={loading}>
              {loading
                ? <><div className="spinner" /> Registering on-chain…</>
                : <>Register DID <ArrowRight size={15} /></>}
            </button>
          </form>
          <div className="divider">already registered?</div>
          <Link to="/login" style={{ textDecoration:'none' }}>
            <button className="btn-ghost" style={{ width:'100%', justifyContent:'center' }}>Sign In</button>
          </Link>
        </div>
      </div>
      {qrData && <QRModal qrBase64={qrData.qr} totpUri={qrData.uri} onClose={() => { setQrData(null); navigate('/login') }} />}
    </div>
  )
}
