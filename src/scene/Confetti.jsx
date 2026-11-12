import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FOCUS_BOX, FX_COLOR } from '../data'
import { useStore } from '../store'
import { gearShape } from './shapes'

const MAX = 150 // instances allocated per layer (the real count depends on the outcome)
const tmp = new THREE.Object3D()

const pal = (a) => a.map((c) => new THREE.Color(c))

/**
 * One entry per outcome – the rarer the prize, the bigger the show.
 *   count  = gears that burst out        nuts   = hex nuts that burst out
 *   power  = launch speed multiplier     life   = seconds a piece stays alive
 *   rain   = gears that fall from the top of the screen (secret only)
 *   rings  = shockwave rings             flash  = handled in Overlay
 */
export const FX = {
  empty: { count: 12, nuts: 0, power: 0.45, life: 1.0, rain: 0, rings: 0, colors: pal(['#6f7c8c', '#98a5b4']) },
  common: { count: 26, nuts: 10, power: 0.9, life: 1.5, rain: 0, rings: 0, colors: pal(['#c4cfdc', '#9fb3c8', '#ffffff', '#5fb0ff']) },
  rare: { count: 60, nuts: 30, power: 1.25, life: 2.0, rain: 0, rings: 1, colors: pal(['#3fd5ff', '#8fe6ff', '#ffffff', '#5fb0ff', '#c4cfdc']) },
  secret: { count: 110, nuts: 40, power: 1.6, life: 2.6, rain: 90, rings: 3, colors: pal(['#ffc21a', '#ffe27a', '#ffffff', '#ff9d2e', '#fff1b3']) },
}

/** mode 'burst' = explode from the opened box, 'rain' = fall from above (secret) */
function Layer({ shape, mode = 'burst', field }) {
  const mesh = useRef()
  const burst = useStore((s) => s.burstKey)
  const geo = useMemo(() => new THREE.ShapeGeometry(shape), [shape])
  const parts = useMemo(
    () => Array.from({ length: MAX }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Vector3(), s: new THREE.Vector3(), life: 0, max: 1, size: 0.2, delay: 0 })),
    [],
  )

  useEffect(() => {
    if (!burst || !mesh.current) return
    const fx = FX[useStore.getState().burstRarity] || FX.common
    const n = Math.min(MAX, fx[field])
    parts.forEach((q, i) => {
      if (i >= n) {
        q.life = 0
        return
      }
      if (mode === 'rain') {
        q.p.set((Math.random() - 0.5) * 9, 9 + Math.random() * 3, 1 + Math.random() * 5)
        q.v.set((Math.random() - 0.5) * 0.8, -(2 + Math.random() * 2.5), 0)
        q.delay = 0.15 + Math.random() * 1.1
        q.max = q.life = 3.2
      } else {
        q.p.set(FOCUS_BOX[0], FOCUS_BOX[1] + 0.9, FOCUS_BOX[2] + 0.2)
        const a = Math.random() * Math.PI * 2
        const sp = (2.2 + Math.random() * 3.4) * fx.power
        q.v.set(Math.cos(a) * sp, (2.5 + Math.random() * 3.2) * fx.power, Math.sin(a) * sp * 0.5 + 1)
        q.delay = 0
        q.max = q.life = fx.life * (0.7 + Math.random() * 0.6)
      }
      q.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6)
      q.s.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9)
      q.size = mode === 'rain' ? 0.14 + Math.random() * 0.2 : 0.12 + Math.random() * 0.16
      mesh.current.setColorAt(i, fx.colors[Math.floor(Math.random() * fx.colors.length)])
    })
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  }, [burst, parts, mode, field])

  useFrame((_, dt) => {
    const m = mesh.current
    if (!m) return
    const d = Math.min(dt, 0.05)
    parts.forEach((q, i) => {
      if (q.life > 0 && q.delay > 0) {
        q.delay -= d
        tmp.scale.setScalar(0.0001)
        tmp.position.set(0, -50, 0)
      } else if (q.life > 0) {
        q.life -= d
        if (mode === 'burst') {
          q.v.y -= 9 * d
          q.v.multiplyScalar(1 - d * 0.6)
        }
        q.p.addScaledVector(q.v, d)
        q.r.addScaledVector(q.s, d)
        const k = Math.min(1, q.life / 0.5)
        tmp.position.copy(q.p)
        tmp.rotation.set(q.r.x, q.r.y, q.r.z)
        tmp.scale.setScalar(q.size * Math.max(0.001, k))
      } else {
        tmp.scale.setScalar(0.0001)
        tmp.position.set(0, -50, 0)
      }
      tmp.updateMatrix()
      m.setMatrixAt(i, tmp.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[geo, undefined, MAX]} frustumCulled={false} raycast={() => null}>
      <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  )
}

/** Expanding rings of light – 1 for rare, 3 (staggered, gold) for secret */
function Shockwave() {
  const burst = useStore((s) => s.burstKey)
  const group = useRef()
  const t0 = useRef(-1)
  const state = useRef({ rings: 0, color: '#ffffff' })
  const RING_MAX = 3
  const DURATION = 1.1

  useEffect(() => {
    if (!burst) return
    const r = useStore.getState().burstRarity
    state.current = { rings: (FX[r] || FX.common).rings, color: FX_COLOR[r] }
    t0.current = performance.now() / 1000
    group.current?.children.forEach((c) => c.material.color.set(state.current.color))
  }, [burst])

  useFrame(() => {
    const g = group.current
    if (!g) return
    const t = performance.now() / 1000 - t0.current
    g.children.forEach((ring, i) => {
      const local = t - i * 0.22
      if (t0.current < 0 || i >= state.current.rings || local < 0 || local > DURATION) {
        ring.visible = false
        return
      }
      const k = local / DURATION
      ring.visible = true
      ring.scale.setScalar(0.5 + k * (i === 0 ? 7 : 9))
      ring.material.opacity = (1 - k) * 0.9
    })
  })

  return (
    <group ref={group} position={[FOCUS_BOX[0], FOCUS_BOX[1] + 0.5, FOCUS_BOX[2] + 0.4]}>
      {Array.from({ length: RING_MAX }).map((_, i) => (
        <mesh key={i} visible={false} raycast={() => null}>
          <ringGeometry args={[0.92, 1, 72]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

export default function Confetti() {
  const gear = useMemo(() => gearShape(1, 8, 0.3), [])
  const nut = useMemo(() => gearShape(0.7, 6, 0.4), [])
  return (
    <group>
      <Layer shape={gear} field="count" />
      <Layer shape={nut} field="nuts" />
      <Layer shape={gear} field="rain" mode="rain" />
      <Shockwave />
    </group>
  )
}
