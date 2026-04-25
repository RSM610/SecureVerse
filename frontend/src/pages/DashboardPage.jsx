import React, { useState, useEffect } from 'react'
import { Shield, Lock, CheckCircle, Activity, Globe, Clock } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Layout from '../components/Layout'
import api from '../api/client'

const STATS = [
  { label:'Identity',   value:'DID',      sub:'Sepolia Testnet',       icon:Globe,    color:'#38bdf8', bg:'rgba(14,165,233,0.12)'  },
  { label:'JWT Algo',   value:'RS256',     sub:'4096-bit RSA',          icon:Shield,   color:'#34d399', bg:'rgba(16,185,129,0.12)'  },
  { label:'Messaging',  value:'E2EE',      sub:'X25519-XSalsa20',       icon:Lock,     color:'#fbbf24', bg:'rgba(245,158,11,0.12)'  },
  { label:'Audit',      value:'HMAC',      sub:'SHA-256 chained',       icon:Activity, color:'#f87171', bg:'rgba(239,68,68,0.12)'   },
]

const REQS = [
  { title:'Authentication', color:'#0ea5e9', items:[
    ['DID challenge-response',true],['TOTP mandatory 2FA',true],
    ['RS256 JWT (authlib)',true],['Redis token revocation',true],
    ['5-attempt lockout',true],['DID ownership verify',true],
  ]},
  { title:'Authorization', color:'#10b981', items:[
    ['RBAC on all routes',true],['RBACManager contract',true],
    ['Admin/Mod/User roles',true],['Redis 60s role cache',true],
    ['Deny-by-default',true],
  ]},
  { title:'E2EE Messaging', color:'#f59e0b', items:[
    ['NaCl Box X25519',true],['Server: ciphertext only',true],
    ['Poly1305 MAC auth',true],['DID key discovery',true],
  ]},
  { title:'Audit Log', color:'#ef4444', items:[
    ['HMAC-SHA256 chain',true],['All events logged',true],
    ['Sepolia anchoring',true],['Admin query endpoint',false],
  ]},
]

export default function DashboardPage() {
  const { did, role } = useAuthStore()
  const [me, setMe]   = useState(null)

  useEffect(() => {
    api.get('/auth/me').then(r => setMe(r.data)).catch(() => {})
  }, [])

  return (
    <Layout>
      {/* Banner */}
      <div className="card" style={{
        marginBottom:22, padding:22,
        background:'linear-gradient(135deg,rgba(14,165,233,0.09),rgba(6,182,212,0.04))',
        border:'1px solid rgba(14,165,233,0.18)',
      }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:13 }}>
          <div style={{ width:46, height:46, borderRadius:13, flexShrink:0, background:'linear-gradient(135deg,#0ea5e9,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:21 }}>🛡</div>
          <div style={{ flex:1, minWidth:0 }}>
            <h1 className="page-title" style={{ marginBottom:3 }}>Welcome back</h1>
            <p style={{ fontSize:12, color:'#334155', fontFamily:'JetBrains Mono,monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{did}</p>
            {me && (
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5, fontSize:11, color:'#1e293b' }}>
                <Clock size={10} /> Registered {new Date(me.created_at).toLocaleDateString()}
                <span className={`badge badge-${role==='admin'?'red':'cyan'}`} style={{ marginLeft:4 }}>{role}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <p className="section-label">Security Profile</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
        {STATS.map(({ label, value, sub, icon:Icon, color, bg }) => (
          <div key={label} className="card" style={{ padding:14, display:'flex', alignItems:'center', gap:11, borderRadius:13 }}>
            <div style={{ width:38, height:38, borderRadius:11, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={17} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize:10, color:'#334155', marginBottom:2 }}>{label}</div>
              <div style={{ fontSize:15, fontWeight:800, color, fontFamily:'JetBrains Mono,monospace' }}>{value}</div>
              <div style={{ fontSize:9, color:'#1e293b', marginTop:1 }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Requirements */}
      <p className="section-label">Requirements Coverage</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        {REQS.map(({ title, color, items }) => (
          <div key={title} className="card" style={{ padding:14, borderRadius:13 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:13 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:color, flexShrink:0 }} />
              <span style={{ fontSize:12, fontWeight:800, color:'#cbd5e1' }}>{title}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {items.map(([text, done]) => (
                <div key={text} style={{ display:'flex', alignItems:'center', gap:7, fontSize:11, color:done?'#94a3b8':'#1e293b' }}>
                  {done
                    ? <CheckCircle size={11} style={{ color:'#34d399', flexShrink:0 }} />
                    : <div style={{ width:11, height:11, borderRadius:'50%', border:'1px solid #1e293b', flexShrink:0 }} />
                  }
                  {text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
