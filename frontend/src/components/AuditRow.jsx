import React from 'react'
import { LogIn, Lock, Send, UserPlus, ShieldCheck } from 'lucide-react'

const ACTIONS = {
  USER_LOGIN:      { icon: LogIn,     cls: 'badge-green' },
  USER_REGISTERED: { icon: UserPlus,  cls: 'badge-cyan'  },
  ACCOUNT_LOCKED:  { icon: Lock,      cls: 'badge-red'   },
  MESSAGE_SENT:    { icon: Send,      cls: 'badge-amber' },
}

export default function AuditRow({ entry }) {
  const key  = Object.keys(ACTIONS).find(k => entry.action.startsWith(k))
  const { icon: Icon, cls } = ACTIONS[key] || { icon: ShieldCheck, cls: 'badge-cyan' }

  return (
    <tr
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.14s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.018)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <td style={{ padding: '10px 15px' }}>
        <span className={`badge ${cls}`} style={{ gap: 5 }}>
          <Icon size={10} />{entry.action}
        </span>
      </td>
      <td style={{ padding: '10px 15px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#334155', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.user_did}
      </td>
      <td style={{ padding: '10px 15px', fontSize: 11, color: '#334155' }}>
        {new Date(entry.timestamp).toLocaleString()}
      </td>
      <td style={{ padding: '10px 15px', fontFamily: 'monospace', fontSize: 10, color: '#1e293b' }}>
        {entry.hmac_chain === 'GENESIS'
          ? <span className="badge badge-cyan">GENESIS</span>
          : entry.hmac_chain.slice(0, 12) + '…'}
      </td>
    </tr>
  )
}
