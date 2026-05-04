import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Shield, MessageSquare, FileText, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: Shield },
  { to: '/messages',  label: 'Messages',  icon: MessageSquare },
  { to: '/audit',     label: 'Audit Log', icon: FileText },
]

export default function Navbar() {
  const { did, role, isAuthenticated, logout, token } = useAuthStore()
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  const handleLogout = async () => {
    try { await api.post('/auth/logout', { token }) } catch { /* ignore logout errors */ }
    logout()
    navigate('/login')
  }

  const shortDid = did
    ? did.slice(0, 12) + '…' + did.slice(-4)
    : ''

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100, height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      background: 'rgba(6,10,18,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>

      {/* Logo */}
      <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>🛡</div>
        <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.022em' }}>
          <span style={{ color: '#e2e8f0' }}>Secure</span>
          <span style={{
            background: 'linear-gradient(90deg,#7dd3fc,#67e8f9)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Verse</span>
        </span>
      </Link>

      {/* Nav links */}
      {isAuthenticated && (
        <div style={{ display: 'flex', gap: 3 }}>
          {LINKS.map(({ to, label, icon: Icon }) => {
            const active = pathname === to
            return (
              <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 13px', borderRadius: 10,
                  fontSize: 13, fontWeight: 500,
                  color:       active ? '#38bdf8' : '#475569',
                  background:  active ? 'rgba(14,165,233,0.12)' : 'transparent',
                  border:      `1px solid ${active ? 'rgba(14,165,233,0.28)' : 'transparent'}`,
                  transition: 'all 0.18s',
                }}>
                  <Icon size={14} />{label}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Right side */}
      {isAuthenticated ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
            }}>
              {did?.slice(-2).toUpperCase() || 'SV'}
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                {shortDid}
              </div>
              <span className={`badge badge-${role === 'admin' ? 'red' : 'cyan'}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                {role}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/login"><button className="btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }}>Sign In</button></Link>
          <Link to="/register"><button className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>Register</button></Link>
        </div>
      )}
    </nav>
  )
}
