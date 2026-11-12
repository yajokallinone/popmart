import * as THREE from 'three'
import { useEffect, useState } from 'react'

const FONT = '"Fredoka", "Baloo 2", ui-rounded, system-ui, sans-serif'

function make(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}

function toTexture(c) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  t.needsUpdate = true
  return t
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function star(ctx, cx, cy, R, r, n = 5, rot = -Math.PI / 2) {
  ctx.beginPath()
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 === 0 ? R : r
    const a = rot + (i * Math.PI) / n
    const x = cx + Math.cos(a) * rad
    const y = cy + Math.sin(a) * rad
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  }
  ctx.closePath()
}

function heart(ctx, cx, cy, s) {
  ctx.beginPath()
  ctx.moveTo(cx, cy + s * 0.9)
  ctx.bezierCurveTo(cx - s * 1.6, cy - s * 0.1, cx - s * 0.9, cy - s * 1.2, cx, cy - s * 0.35)
  ctx.bezierCurveTo(cx + s * 0.9, cy - s * 1.2, cx + s * 1.6, cy - s * 0.1, cx, cy + s * 0.9)
  ctx.closePath()
}

/** Re-render canvas textures once the web font is ready */
export function useFontsReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    const done = () => alive && setReady(true)
    if (document.fonts?.load) {
      Promise.all([document.fonts.load(`700 120px ${FONT}`), document.fonts.load(`600 60px ${FONT}`)])
        .then(done)
        .catch(done)
      setTimeout(done, 2500)
    } else done()
    return () => {
      alive = false
    }
  }, [])
  return ready
}

export function signTexture() {
  const [c, ctx] = make(1024, 256)
  const g = ctx.createLinearGradient(0, 0, 1024, 256)
  g.addColorStop(0, '#ff8fbd')
  g.addColorStop(1, '#b99bff')
  ctx.fillStyle = g
  rr(ctx, 0, 0, 1024, 256, 120)
  ctx.fill()
  ctx.fillStyle = '#fff6fb'
  rr(ctx, 16, 16, 992, 224, 108)
  ctx.fill()
  // soft inner border
  ctx.strokeStyle = 'rgba(255,143,189,0.45)'
  ctx.lineWidth = 4
  ctx.setLineDash([2, 14])
  ctx.lineCap = 'round'
  rr(ctx, 34, 34, 956, 188, 94)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let fs = 142
  ctx.font = `700 ${fs}px ${FONT}`
  while (ctx.measureText('MYSTERY BOX').width > 740 && fs > 60) {
    fs -= 4
    ctx.font = `700 ${fs}px ${FONT}`
  }
  const tg = ctx.createLinearGradient(180, 0, 850, 0)
  tg.addColorStop(0, '#ff4f9a')
  tg.addColorStop(1, '#8f63ff')
  ctx.shadowColor = 'rgba(255,120,180,0.55)'
  ctx.shadowBlur = 18
  ctx.fillStyle = tg
  ctx.fillText('MYSTERY BOX', 512, 138)
  ctx.shadowBlur = 0
  // sparkles
  ctx.fillStyle = '#ffd34d'
  star(ctx, 92, 128, 26, 10, 4)
  ctx.fill()
  star(ctx, 932, 128, 26, 10, 4)
  ctx.fill()
  ctx.fillStyle = '#ff9ccc'
  heart(ctx, 150, 64, 11)
  ctx.fill()
  heart(ctx, 874, 192, 11)
  ctx.fill()
  return toTexture(c)
}

export function plaqueTexture() {
  const [c, ctx] = make(1024, 128)
  const g = ctx.createLinearGradient(0, 0, 1024, 0)
  g.addColorStop(0, '#fff3f8')
  g.addColorStop(1, '#f2e8ff')
  ctx.fillStyle = g
  rr(ctx, 0, 0, 1024, 128, 64)
  ctx.fill()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 62px ${FONT}`
  ctx.fillStyle = '#8c1d40'
  ctx.fillText('ENG CMU', 270, 68)
  ctx.fillStyle = '#c9a0d8'
  star(ctx, 480, 64, 16, 6, 4)
  ctx.fill()
  ctx.font = `600 58px ${FONT}`
  ctx.fillStyle = '#b25a86'
  ctx.fillText('OPEN HOUSE 2026', 745, 68)
  return toTexture(c)
}

export function plateTexture(n, opened) {
  const [c, ctx] = make(256, 72)
  const g = ctx.createLinearGradient(0, 0, 256, 0)
  if (opened) {
    g.addColorStop(0, '#d7ffe9')
    g.addColorStop(1, '#bff2dc')
  } else {
    g.addColorStop(0, '#ffffff')
    g.addColorStop(1, '#ffe9f3')
  }
  ctx.fillStyle = g
  rr(ctx, 2, 2, 252, 68, 34)
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = opened ? '#6fd4a8' : '#ff9ec7'
  rr(ctx, 4, 4, 248, 64, 32)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 40px ${FONT}`
  ctx.fillStyle = opened ? '#2f9a6f' : '#c4306f'
  ctx.fillText(`${opened ? '✓ ' : ''}${String(n).padStart(2, '0')}`, 128, 40)
  return toTexture(c)
}

export function backWallTexture() {
  const [c, ctx] = make(1024, 1024)
  const g = ctx.createLinearGradient(0, 0, 0, 1024)
  g.addColorStop(0, '#f3e6ff')
  g.addColorStop(1, '#e4d3ff')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 1024, 1024)
  // polka stars + hearts
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 70; i++) {
    const x = rnd() * 1024
    const y = rnd() * 1024
    ctx.globalAlpha = 0.5 + rnd() * 0.4
    ctx.fillStyle = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ffd0e6' : '#cfe8ff'
    if (i % 4 === 0) {
      heart(ctx, x, y, 9 + rnd() * 8)
    } else {
      star(ctx, x, y, 10 + rnd() * 12, 4 + rnd() * 4, 4, rnd() * 3)
    }
    ctx.fill()
  }
  ctx.globalAlpha = 1
  const t = toTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

export function glowTexture() {
  const [c, ctx] = make(256, 256)
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function shadowTexture() {
  const [c, ctx] = make(128, 128)
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(80,20,60,0.55)')
  g.addColorStop(0.6, 'rgba(80,20,60,0.2)')
  g.addColorStop(1, 'rgba(80,20,60,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

/** vertical wash of LED light on the back wall: bright at the top, fading downward */
export function washTexture() {
  const [c, ctx] = make(8, 256)
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 8, 256)
  return new THREE.CanvasTexture(c)
}

/** diagonal glass reflection streaks */
export function shineTexture() {
  const [c, ctx] = make(512, 512)
  ctx.clearRect(0, 0, 512, 512)
  const streak = (x, w, a) => {
    const g = ctx.createLinearGradient(x, 0, x + w, 0)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(0.5, `rgba(255,255,255,${a})`)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.save()
    ctx.translate(256, 256)
    ctx.rotate(0.38)
    ctx.translate(-256, -256)
    ctx.fillRect(x, -200, w, 900)
    ctx.restore()
  }
  streak(120, 70, 0.9)
  streak(215, 22, 0.7)
  streak(330, 110, 0.5)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
