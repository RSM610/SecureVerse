import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

const BUBBLE_COLORS = [
  [14,  165, 233],   // sky-500
  [6,   182, 212],   // cyan-500
  [56,  189, 248],   // sky-400
  [103, 232, 249],   // cyan-300
  [125, 211, 252],   // sky-300
  [34,  211, 238],   // cyan-400
  [186, 230, 253],   // sky-200
  [165, 243, 252],   // cyan-200
]

export default function BubbleBackground({ count = 18 }) {
  const mountRef = useRef(null)
  const animRef  = useRef(null)

  useEffect(() => {
    const canvas = document.createElement('canvas')
    const ctx    = canvas.getContext('2d')
    const mount  = mountRef.current
    if (!mount) return

    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;'
    mount.appendChild(canvas)

    const resize = () => {
      canvas.width  = mount.offsetWidth  || window.innerWidth
      canvas.height = mount.offsetHeight || window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const bubbles = Array.from({ length: count }, () => {
      const r  = 22 + Math.random() * 58
      const ci = Math.floor(Math.random() * BUBBLE_COLORS.length)
      return {
        x:    r + Math.random() * (canvas.width  - r * 2),
        y:    r + Math.random() * (canvas.height - r * 2),
        r,
        dx:   (Math.random() - 0.5) * 0.32,
        dy:   (Math.random() - 0.5) * 0.32,
        col:  BUBBLE_COLORS[ci],
        col2: BUBBLE_COLORS[(ci + 4) % BUBBLE_COLORS.length],
        phase: Math.random() * Math.PI * 2,
        ps:    0.4 + Math.random() * 1.1,
      }
    })

    let frame = 0

    const draw = () => {
      animRef.current = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const t = frame++ / 90

      bubbles.forEach(b => {
        b.x += b.dx
        b.y += b.dy
        if (b.x < -b.r) b.x = canvas.width  + b.r
        if (b.x > canvas.width  + b.r) b.x = -b.r
        if (b.y < -b.r) b.y = canvas.height + b.r
        if (b.y > canvas.height + b.r) b.y = -b.r

        const pulse = 1 + 0.055 * Math.sin(t * b.ps + b.phase)
        const R  = b.r * pulse
        const [r1, g1, b1] = b.col
        const [r2, g2, b2] = b.col2

        // 1 — GLASS BODY
        const body = ctx.createRadialGradient(b.x, b.y, R * 0.05, b.x, b.y, R)
        body.addColorStop(0,    `rgba(${r1},${g1},${b1},0.20)`)
        body.addColorStop(0.50, `rgba(${r1},${g1},${b1},0.11)`)
        body.addColorStop(0.80, `rgba(${r2},${g2},${b2},0.17)`)
        body.addColorStop(1,    `rgba(${r2},${g2},${b2},0.44)`)
        ctx.beginPath()
        ctx.arc(b.x, b.y, R, 0, Math.PI * 2)
        ctx.fillStyle = body
        ctx.fill()

        // 2 — RIM HIGHLIGHT
        const hx = b.x - R * 0.30
        const hy = b.y - R * 0.30
        const rim = ctx.createRadialGradient(hx, hy, 0, hx, hy, R * 0.58)
        rim.addColorStop(0,   'rgba(255,255,255,0.58)')
        rim.addColorStop(0.35,'rgba(255,255,255,0.20)')
        rim.addColorStop(1,   'rgba(255,255,255,0)')
        ctx.beginPath()
        ctx.arc(b.x, b.y, R, 0, Math.PI * 2)
        ctx.fillStyle = rim
        ctx.fill()

        // 3 — SHARP CATCHLIGHT
        const sx = b.x - R * 0.40
        const sy = b.y - R * 0.40
        const spec = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 0.17)
        spec.addColorStop(0,   'rgba(255,255,255,0.96)')
        spec.addColorStop(0.45,'rgba(255,255,255,0.42)')
        spec.addColorStop(1,   'rgba(255,255,255,0)')
        ctx.beginPath()
        ctx.arc(sx, sy, R * 0.17, 0, Math.PI * 2)
        ctx.fillStyle = spec
        ctx.fill()

        // 4 — TRANSMISSION GLOW
        const tx2 = b.x + R * 0.22
        const ty2 = b.y + R * 0.28
        const tg = ctx.createRadialGradient(tx2, ty2, 0, tx2, ty2, R * 0.42)
        tg.addColorStop(0,  `rgba(${r1},${g1},${b1},0.26)`)
        tg.addColorStop(1,  `rgba(${r1},${g1},${b1},0)`)
        ctx.beginPath()
        ctx.arc(tx2, ty2, R * 0.42, 0, Math.PI * 2)
        ctx.fillStyle = tg
        ctx.fill()

        // 5 — BORDER RING
        ctx.beginPath()
        ctx.arc(b.x, b.y, R, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(${r1},${g1+20},${b1+30},0.38)`
        ctx.lineWidth   = 0.8
        ctx.stroke()
      })
    }

    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      if (mount.contains(canvas)) mount.removeChild(canvas)
    }
  }, [count])

  return (
    <div
      ref={mountRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    />
  )
}

BubbleBackground.propTypes = {
  count: PropTypes.number,
}

BubbleBackground.defaultProps = {
  count: 18,
}
