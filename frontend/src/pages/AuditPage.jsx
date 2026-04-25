import React, { useState, useEffect } from 'react'
import { FileText, ShieldCheck, RefreshCw, Search } from 'lucide-react'
import Layout from '../components/Layout'
import AuditRow from '../components/AuditRow'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'

export default function AuditPage() {
  const { role }    = useAuthStore()
  const [logs,      setLogs]      = useState([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [chainOk,   setChainOk]   = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [search,    setSearch]    = useState('')

  const fetchLogs = async () => {
    setLoading(true); setError('')
    try { const { data } = await api.get('/audit/logs?limit=50'); setLogs(data) }
    catch (err) { setError(err.response?.data?.detail || 'Access denied — admin or moderator required') }
    finally { setLoading(false) }
  }

  const verifyChain = async () => {
    setVerifying(true)
    try { const { data } = await api.get('/audit/verify'); setChainOk(data.chain_valid) }
    catch { setChainOk(false) }
    finally { setVerifying(false) }
  }

  useEffect(() => { fetchLogs() }, [])

  const filtered = logs.filter(e =>
    !search || e.action.toLowerCase().includes(search.toLowerCase()) || e.user_did.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:11 }}>
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-sub" style={{ marginBottom:0 }}>HMAC-SHA256 chained · tamper-evident</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {role === 'admin' && (
            <button onClick={verifyChain} className="btn-ghost" style={{ fontSize:13 }} disabled={verifying}>
              {verifying ? <div className="spinner" /> : <ShieldCheck size={13} />} Verify Chain
            </button>
          )}
          <button onClick={fetchLogs} className="btn-ghost" style={{ fontSize:13 }} disabled={loading}>
            <RefreshCw size={13} style={{ animation:loading?'spin 0.65s linear infinite':'none' }} /> Refresh
          </button>
        </div>
      </div>

      {chainOk !== null && (
        <div className={`alert ${chainOk?'alert-success':'alert-error'}`} style={{ marginBottom:14 }}>
          <ShieldCheck size={13} style={{ flexShrink:0 }} />
          {chainOk ? 'Chain integrity verified — no tampering detected.' : 'CHAIN INTEGRITY FAILED — entries may have been tampered with.'}
        </div>
      )}

      <div style={{ position:'relative', marginBottom:14 }}>
        <Search size={13} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#1e293b' }} />
        <input className="input-field" placeholder="Filter by action or DID…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:36 }} />
      </div>

      {error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <div className="card" style={{ padding:0, overflow:'hidden', borderRadius:15 }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                  {['Action','DID','Timestamp','HMAC'].map(h => (
                    <th key={h} style={{ padding:'11px 15px', textAlign:'left', fontSize:10, fontWeight:700, color:'#1e293b', textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => <AuditRow key={e.id} entry={e} />)}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={4} style={{ padding:'44px', textAlign:'center', color:'#1e293b', fontSize:13 }}>
                    {search ? 'No matching entries' : 'No audit entries yet'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  )
}
