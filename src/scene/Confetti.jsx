import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FOCUS_BOX } from '../data'
import { useStore } from '../store'
import { heartShape, starShape } from './shapes'

const N = 44
const COLORS = ['#ff8fb8', '#ffd96b', '#b79bff', '#9ee7ff', '#ffffff', '#ffb38a', '#8be8c2'].map((c) => new THREE.Color(c))
const tmp = new THREE.Object3D()

function Layer({ shape, burst }) {
  const mesh = useRef()
  const geo = useMemo(() => new THREE.ShapeGeometry(shape), [shape])
  const parts = useMemo(
    () => Array.from({ length: N }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Vector3(), s: new THREE.Vector3(), life: 0, max: 1, size: 0.2 })),
    [],
  )

  useEffect(() => {
    if (!burst) return
    parts.forEach((q, i) => {
      q.p.set(FOCUS_BOX[0], FOCUS_BOX[1] + 0.9, FOCUS_BOX[2] + 0.2)
      const a = Math.random() * Math.PI * 2
      const sp = 2.2 + Math.random() * 3.4
      q.v.set(Math.cos(a) * sp, 2.5 + Math.random() * 3.2, Math.sin(a) * sp * 0.5 + 1)
      q.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6)
      q.s.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9)
      q.max = q.life = 1.6 + Math.random() * 1.4
      q.size = 0.12 + Math.random() * 0.16
      mesh.current.setColorAt(i, COLORS[Math.floor(Math.random() * COLORS.length)])
    })
    mesh.current.instanceColor.needsUpdate = true
  }, [burst, parts])

  useFrame((_, dt) => {
    const m = mesh.current
    if (!m) return
    const d = Math.min(dt, 0.05)
    parts.forEach((q, i) => {
      if (q.life > 0) {
        q.life -= d
        q.v.y -= 9 * d
        q.v.multiplyScalar(1 - d * 0.6)
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
    <instancedMesh ref={mesh} args={[geo, undefined, N]} frustumCulled={false} raycast={() => null}>
      <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  )
}

export default function Confetti() {
  const burst = useStore((s) => s.burstKey)
  const star = useMemo(() => starShape(1, 0.45), [])
  const heart = useMemo(() => heartShape(0.8), [])
  return (
    <group>
      <Layer shape={star} burst={burst} />
      <Layer shape={heart} burst={burst} />
    </group>
  )
}
