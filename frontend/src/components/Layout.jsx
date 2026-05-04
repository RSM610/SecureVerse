import React from 'react'
import PropTypes from 'prop-types'
import Navbar from './Navbar'
import BubbleBackground from './BubbleBackground'

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

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
