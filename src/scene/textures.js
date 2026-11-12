import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
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

function gear(ctx, cx, cy, R, teeth = 8, rot = 0, hole = 0.3) {
  const root = R * 0.74
  const step = (Math.PI * 2) / teeth
  ctx.beginPath()
  for (let i = 0; i < teeth; i++) {
    const a = rot + i * step
    const pts = [
      [root, a - step * 0.3],
      [R, a - step * 0.17],
      [R, a + step * 0.17],
      [root, a + step * 0.3],
    ]
    pts.forEach(([rad, ang], k) => {
      const x = cx + Math.cos(ang) * rad
      const y = cy + Math.sin(ang) * rad
      i === 0 && k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
  }
  ctx.closePath()
  ctx.moveTo(cx + R * hole, cy)
  ctx.arc(cx, cy, R * hole, 0, Math.PI * 2, true)
}

function hex(ctx, cx, cy, r, rot = 0) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = rot + (i * Math.PI) / 3
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  }
  ctx.closePath()
}

function bolt(ctx, cx, cy, r) {
  hex(ctx, cx, cy, r, Math.PI / 6)
  ctx.fillStyle = '#b9c7d6'
  ctx.fill()
  ctx.strokeStyle = '#4a5868'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2)
  ctx.fillStyle = '#5d6c7c'
  ctx.fill()
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

const YELLOW = '#ffc21a'
const CYAN = '#3fd5ff'

export function signTexture() {
  const [c, ctx] = make(1024, 256)
  // hazard-stripe frame
  ctx.save()
  rr(ctx, 0, 0, 1024, 256, 36)
  ctx.clip()
  ctx.fillStyle = '#10151c'
  ctx.fillRect(0, 0, 1024, 256)
  ctx.fillStyle = YELLOW
  for (let x = -300; x < 1400; x += 64) {
    ctx.beginPath()
    ctx.moveTo(x, 256)
    ctx.lineTo(x + 32, 256)
    ctx.lineTo(x + 32 + 256, 0)
    ctx.lineTo(x + 256, 0)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
  // dark steel panel
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, '#26364a')
  g.addColorStop(1, '#0f1822')
  ctx.fillStyle = g
  rr(ctx, 16, 16, 992, 224, 24)
  ctx.fill()
  ctx.strokeStyle = 'rgba(63,213,255,0.55)'
  ctx.lineWidth = 3
  rr(ctx, 30, 30, 964, 196, 14)
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let fs = 138
  ctx.font = `700 ${fs}px ${FONT}`
  while (ctx.measureText('ENG BOX').width > 700 && fs > 60) {
    fs -= 4
    ctx.font = `700 ${fs}px ${FONT}`
  }
  const tg = ctx.createLinearGradient(0, 70, 0, 190)
  tg.addColorStop(0, '#fff1b3')
  tg.addColorStop(1, YELLOW)
  ctx.shadowColor = 'rgba(255,194,26,0.6)'
  ctx.shadowBlur = 22
  ctx.fillStyle = tg
  ctx.fillText('ENG BOX', 512, 134)
  ctx.shadowBlur = 0
  // gears + rivets
  ctx.fillStyle = CYAN
  gear(ctx, 104, 118, 42, 8, 0.2)
  ctx.fill()
  gear(ctx, 160, 180, 22, 8, 0.1)
  ctx.fillStyle = YELLOW
  ctx.fill()
  ctx.fillStyle = CYAN
  gear(ctx, 920, 138, 42, 8, 0.6)
  ctx.fill()
  gear(ctx, 864, 76, 22, 8, 0.3)
  ctx.fillStyle = YELLOW
  ctx.fill()
  ;[[52, 52], [972, 52], [52, 204], [972, 204]].forEach(([x, y]) => bolt(ctx, x, y, 9))
  return toTexture(c)
}

export function plaqueTexture() {
  const [c, ctx] = make(1024, 128)
  const g = ctx.createLinearGradient(0, 0, 1024, 0)
  g.addColorStop(0, '#1a2432')
  g.addColorStop(1, '#2b3b50')
  ctx.fillStyle = g
  rr(ctx, 0, 0, 1024, 128, 22)
  ctx.fill()
  ctx.strokeStyle = YELLOW
  ctx.lineWidth = 5
  rr(ctx, 6, 6, 1012, 116, 17)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 62px ${FONT}`
  ctx.fillStyle = YELLOW
  ctx.fillText('ENG CMU', 270, 68)
  ctx.fillStyle = CYAN
  gear(ctx, 480, 64, 26, 8, 0)
  ctx.fill()
  ctx.font = `600 58px ${FONT}`
  ctx.fillStyle = '#dff3ff'
  ctx.fillText('OPEN HOUSE 2026', 745, 68)
  return toTexture(c)
}

export function plateTexture(n, opened) {
  const [c, ctx] = make(256, 72)
  ctx.fillStyle = opened ? '#0f3a33' : '#1c2735'
  rr(ctx, 2, 2, 252, 68, 14)
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = opened ? '#3ddc97' : YELLOW
  rr(ctx, 4, 4, 248, 64, 12)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 40px ${FONT}`
  ctx.fillStyle = opened ? '#7dffc4' : YELLOW
  ctx.fillText(`${opened ? '✓ ' : ''}${String(n).padStart(2, '0')}`, 128, 40)
  return toTexture(c)
}

/** blueprint paper: grid + faint outlined gears */
export function backWallTexture() {
  const [c, ctx] = make(1024, 1024)
  const g = ctx.createLinearGradient(0, 0, 0, 1024)
  g.addColorStop(0, '#14456f')
  g.addColorStop(1, '#0b2b49')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 1024, 1024)
  for (let p = 0; p <= 1024; p += 32) {
    const major = p % 128 === 0
    ctx.strokeStyle = major ? 'rgba(140,215,255,0.32)' : 'rgba(140,215,255,0.13)'
    ctx.lineWidth = major ? 2 : 1
    ctx.beginPath()
    ctx.moveTo(p, 0)
    ctx.lineTo(p, 1024)
    ctx.moveTo(0, p)
    ctx.lineTo(1024, p)
    ctx.stroke()
  }
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  ctx.lineWidth = 3
  for (let i = 0; i < 9; i++) {
    const x = 90 + rnd() * 840
    const y = 90 + rnd() * 840
    const R = 40 + rnd() * 60
    ctx.strokeStyle = `rgba(170,230,255,${0.35 + rnd() * 0.25})`
    gear(ctx, x, y, R, 10, rnd() * 3, 0.32)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y, R * 0.55, 0, Math.PI * 2)
    ctx.setLineDash([6, 8])
    ctx.stroke()
    ctx.setLineDash([])
  }
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
  g.addColorStop(0, 'rgba(5,15,30,0.55)')
  g.addColorStop(0.6, 'rgba(5,15,30,0.2)')
  g.addColorStop(1, 'rgba(5,15,30,0)')
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

// ─────────────────────────────────────────────────────────────
//  ENG BOX – the box artwork (drawn with canvas, shared by all 12 shelf boxes + the showcase box)
// ─────────────────────────────────────────────────────────────

function spaced(ctx, px) {
  try {
    ctx.letterSpacing = `${px}px`
  } catch {
    /* older browsers: no letter spacing */
  }
}

function fitText(ctx, text, maxW, size, weight = 700) {
  let fs = size
  ctx.font = `${weight} ${fs}px ${FONT}`
  while (ctx.measureText(text).width > maxW && fs > 20) {
    fs -= 4
    ctx.font = `${weight} ${fs}px ${FONT}`
  }
  return fs
}

const BOX_TEX = {
  front: '/textures/front.jpg',
  side: '/textures/side.jpg',
  sideLeft: '/textures/side_left.jpg',
  top: '/textures/top.jpg',
  back: '/textures/back.jpg',
}
let boxTexReady = false
/** the five original box artwork textures (public/textures), shared by every box and the showcase */
export function useBoxTextures() {
  const tex = useTexture(BOX_TEX)
  if (!boxTexReady) {
    Object.values(tex).forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      t.needsUpdate = true
    })
    boxTexReady = true
  }
  return tex
}

/** small "drag to rotate" sign for the showcase pedestal */
export function hintTexture() {
  const [c, ctx] = make(512, 96)
  ctx.fillStyle = '#10151c'
  rr(ctx, 0, 0, 512, 96, 18)
  ctx.fill()
  ctx.strokeStyle = YELLOW
  ctx.lineWidth = 6
  rr(ctx, 5, 5, 502, 86, 14)
  ctx.stroke()
  ctx.fillStyle = CYAN
  gear(ctx, 64, 48, 24, 8, 0)
  ctx.fill()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  spaced(ctx, 3)
  fitText(ctx, 'DRAG TO ROTATE', 360, 42, 600)
  ctx.fillStyle = YELLOW
  ctx.fillText('DRAG TO ROTATE', 296, 50)
  return toTexture(c)
}
