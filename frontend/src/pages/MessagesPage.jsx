import React, { useEffect, useState } from 'react'
import { Send, Inbox, Lock, RefreshCw } from 'lucide-react'
import Layout from '../components/Layout'
import MessageCard from '../components/MessageCard'
import { useMessages } from '../hooks/useMessages'

export default function MessagesPage() {
  const { inbox, loading, error, fetchInbox, sendMessage } = useMessages()
  const [recipient, setRecipient] = useState('')
  const [text,      setText]      = useState('')
  const [sending,   setSending]   = useState(false)
  const [sendErr,   setSendErr]   = useState('')
  const [sent,      setSent]      = useState(false)

  useEffect(() => { fetchInbox() }, [])

  const handleSend = async (e) => {
    e.preventDefault(); setSendErr(''); setSending(true)
    try {
      await sendMessage(recipient, text)
      setSent(true); setRecipient(''); setText('')
      setTimeout(() => setSent(false), 3000)
      fetchInbox()
    } catch (err) {
      setSendErr(err.response?.data?.detail || 'Send failed')
    } finally { setSending(false) }
  }

  return (
    <Layout>
      <h1 className="page-title">Encrypted Messages</h1>
      <p className="page-sub">E2EE · X25519-XSalsa20-Poly1305 · Server holds ciphertext only</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>

        {/* Send */}
        <div className="card" style={{ borderRadius:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(14,165,233,0.13)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Send size={15} style={{ color:'#38bdf8' }} />
            </div>
            <h2 style={{ fontSize:15, fontWeight:800 }}>Send Encrypted Message</h2>
          </div>
          <div className="alert alert-info" style={{ marginBottom:14, fontSize:11, padding:'8px 12px' }}>
            <Lock size={12} style={{ flexShrink:0 }} />
            Client-side encryption. Server cannot read this message.
          </div>
          <form onSubmit={handleSend}>
            <div style={{ marginBottom:11 }}>
              <label className="field-label">Recipient DID</label>
              <input className="input-field mono" placeholder="did:ethr:0x..." value={recipient} onChange={e=>setRecipient(e.target.value)} required />
            </div>
            <div style={{ marginBottom:13 }}>
              <label className="field-label">Message</label>
              <textarea className="input-field" placeholder="Write your message…" rows={4} value={text} onChange={e=>setText(e.target.value)} required />
            </div>
            {sendErr && <div className="alert alert-error" style={{ marginBottom:11 }}>{sendErr}</div>}
            {sent    && <div className="alert alert-success" style={{ marginBottom:11 }}>Message delivered!</div>}
            <button type="submit" className="btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={sending}>
              {sending ? <><div className="spinner" /> Encrypting…</> : <><Send size={13} /> Send</>}
            </button>
          </form>
        </div>

        {/* Inbox */}
        <div className="card" style={{ borderRadius:18 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(16,185,129,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Inbox size={15} style={{ color:'#34d399' }} />
              </div>
              <h2 style={{ fontSize:15, fontWeight:800 }}>Inbox</h2>
            </div>
            <button onClick={fetchInbox} className="btn-ghost" style={{ padding:'6px 12px', fontSize:12 }}>
              <RefreshCw size={12} style={{ animation:loading?'spin 0.65s linear infinite':'none' }} /> Refresh
            </button>
          </div>
          {error && <div className="alert alert-error" style={{ marginBottom:11 }}>{error}</div>}
          {inbox.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 0', color:'#1e293b' }}>
              <Inbox size={38} style={{ margin:'0 auto 11px', opacity:0.3 }} />
              <p style={{ fontSize:13 }}>No messages yet</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:9, maxHeight:360, overflowY:'auto' }}>
              {inbox.map((msg,i) => <MessageCard key={i} msg={msg} />)}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
