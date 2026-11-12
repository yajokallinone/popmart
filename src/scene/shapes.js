import * as THREE from 'three'

export function heartShape(s = 1) {
  const sh = new THREE.Shape()
  sh.moveTo(0, -0.9 * s)
  sh.bezierCurveTo(-1.6 * s, 0.1 * s, -0.9 * s, 1.2 * s, 0, 0.35 * s)
  sh.bezierCurveTo(0.9 * s, 1.2 * s, 1.6 * s, 0.1 * s, 0, -0.9 * s)
  return sh
}

export function starShape(R = 1, r = 0.45, n = 5) {
  const sh = new THREE.Shape()
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 === 0 ? R : r
    const a = Math.PI / 2 + (i * Math.PI) / n
    const x = Math.cos(a) * rad
    const y = Math.sin(a) * rad
    i ? sh.lineTo(x, y) : sh.moveTo(x, y)
  }
  sh.closePath()
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
