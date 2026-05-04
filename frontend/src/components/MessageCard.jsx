import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Lock, ChevronDown, ChevronUp, Shield } from 'lucide-react'

MessageCard.propTypes = {
  msg: PropTypes.shape({
    ciphertext_b64: PropTypes.string.isRequired,
    sender_did:     PropTypes.string.isRequired,
    nonce_b64:      PropTypes.string,
  }).isRequired,
}

export default function MessageCard({ msg }) {
  const [open, setOpen] = useState(false)

  const decoded = (() => {
    try { return atob(msg.ciphertext_b64) }
    catch { return '[encrypted — needs private key to decrypt]' }
  })()

  return (
    <div
      className="card card-hover"
      style={{ cursor: 'pointer', border: open ? '1px solid rgba(14,165,233,0.3)' : undefined }}
      onClick={() => setOpen(v => !v)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={13} style={{ color: '#34d399' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#475569', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              From: {msg.sender_did}
            </div>
            <div style={{ fontSize: 10, color: '#34d399', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={9} /> E2EE
            </div>
          </div>
        </div>
        {open ? <ChevronUp size={14} style={{ color: '#334155', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: '#334155', flexShrink: 0 }} />}
      </div>
      {open && (
        <div style={{ marginTop: 13, paddingTop: 13, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, wordBreak: 'break-word' }}>{decoded}</p>
          <p style={{ fontSize: 10, color: '#1e293b', marginTop: 9, fontFamily: 'monospace' }}>
            nonce: {msg.nonce_b64?.slice(0, 18)}…
          </p>
        </div>
      )}
    </div>
  )
}
