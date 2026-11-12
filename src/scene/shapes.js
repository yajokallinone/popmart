import * as THREE from 'three'

export function heartShape(s = 1) {
  const sh = new THREE.Shape()
  sh.moveTo(0, -0.9 * s)
  sh.bezierCurveTo(-1.6 * s, 0.1 * s, -0.9 * s, 1.2 * s, 0, 0.35 * s)
  sh.bezierCurveTo(0.9 * s, 1.2 * s, 1.6 * s, 0.1 * s, 0, -0.9 * s)
  return sh
}

/** Gear outline (trapezoid teeth + centre hole) in a unit of R = tip radius */
export function gearShape(R = 1, teeth = 8, hole = 0.3) {
  const root = R * 0.74
  const step = (Math.PI * 2) / teeth
  const sh = new THREE.Shape()
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    const pts = [
      [root, a - step * 0.3],
      [R, a - step * 0.17],
      [R, a + step * 0.17],
      [root, a + step * 0.3],
    ]
    pts.forEach(([rad, ang], k) => {
      const x = Math.cos(ang) * rad
      const y = Math.sin(ang) * rad
      i === 0 && k === 0 ? sh.moveTo(x, y) : sh.lineTo(x, y)
    })
  }
  sh.closePath()
  const h = new THREE.Path()
  h.absarc(0, 0, R * hole, 0, Math.PI * 2, true)
  sh.holes.push(h)
  return sh
}

export function puffy(shape, depth = 0.25, bevel = 0.08) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 20,
  })
  g.center()
  return g
}
