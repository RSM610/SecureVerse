import React from 'react'
import Navbar from './Navbar'
import BubbleBackground from './BubbleBackground'

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: '#060a12' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <BubbleBackground count={18} />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <main className="page-container">{children}</main>
      </div>
    </div>
  )
}
