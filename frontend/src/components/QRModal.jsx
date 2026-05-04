import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { X, Copy, Check, Smartphone } from 'lucide-react'

QRModal.propTypes = {
  qrBase64: PropTypes.string,
  totpUri:  PropTypes.string.isRequired,
  onClose:  PropTypes.func.isRequired,
}

QRModal.defaultProps = {
  qrBase64: null,
}

export default function QRModal({ qrBase64, totpUri, onClose }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(totpUri)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, borderRadius: 22, padding: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 3 }}>Set Up Authenticator</h2>
            <p style={{ fontSize: 12, color: '#334155' }}>Scan with Google Authenticator or Authy</p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 7, borderRadius: 8 }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ background: 'white', borderRadius: 14, padding: 18, display: 'flex', justifyContent: 'center', marginBottom: 15 }}>
          {qrBase64
            ? <img src={`data:image/png;base64,${qrBase64}`} alt="TOTP QR" style={{ width: 176, height: 176 }} />
            : <div style={{ width: 176, height: 176, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>QR Code</div>
          }
        </div>
        <div className="alert alert-info" style={{ marginBottom: 14, fontSize: 11 }}>
          <Smartphone size={14} style={{ flexShrink: 0 }} />
          <div>
            <strong>Step 1:</strong> Open your authenticator app<br />
            <strong>Step 2:</strong> Tap + → Scan QR Code<br />
            <strong>Step 3:</strong> Point at the QR above
          </div>
        </div>
        <button onClick={copy} className="btn-ghost" style={{ width: '100%', marginBottom: 9, justifyContent: 'center' }}>
          {copied ? <Check size={13} style={{ color: '#34d399' }} /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy setup URI'}
        </button>
        <button onClick={onClose} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Done &mdash; I&apos;ve scanned it
        </button>
      </div>
    </div>
  )
}
