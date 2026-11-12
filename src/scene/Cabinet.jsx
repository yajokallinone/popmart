import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import {
  BASE_H, CEIL_Y, DEPTH, IW, OUTER_W, SHELF_T, SHELF_TOP, SLOTS, TOP_Y, WALL_T,
} from '../data'
import { useStore } from '../store'
import MysteryBox from './MysteryBox'
import { heartShape, puffy, starShape } from './shapes'
import {
  backWallTexture, plaqueTexture, shineTexture, signTexture, useFontsReady, washTexture,
} from './textures'

const PINK = '#ffc4da'
const PINK_DEEP = '#ff9ec7'
const LILAC = '#d9c6ff'
const MINT = '#c4f1e1'
const CREAM = '#fff4fa'

function Toy({ color, rough = 0.34, coat = 0.8 }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={rough}
      clearcoat={coat}
      clearcoatRoughness={0.22}
      envMapIntensity={0.7}
    />
  )
}

const ROW_TINT = ['#ffc4da', '#e0cffd', '#c8f2e3'] // shelf front colours per row
const ROW_LED = ['#ffd6e8', '#e6d9ff', '#d4fbea']

function Puffy({ geometry, color, position, rotation, scale = 1, emissive = 0 }) {
  return (
    <mesh geometry={geometry} position={position} rotation={rotation} scale={scale} castShadow>
      <meshPhysicalMaterial
        color={color}
        roughness={0.3}
        clearcoat={1}
        emissive={color}
        emissiveIntensity={emissive}
      />
    </mesh>
  )
}

function Decorations() {
  const heart = useMemo(() => puffy(heartShape(0.5), 0.12, 0.05), [])
  const heartBig = useMemo(() => puffy(heartShape(0.55), 0.14, 0.05), [])
  const star = useMemo(() => puffy(starShape(0.34, 0.16), 0.1, 0.045), [])
  const sx = OUTER_W / 2 + 0.25
  return (
    <group>
      {/* stars flanking the sign */}
      <Float speed={2} rotationIntensity={0.6} floatIntensity={0.5}>
        <Puffy geometry={star} color="#ffe27a" position={[-2.55, TOP_Y + 0.75, 0.2]} rotation={[0, 0.3, 0.2]} emissive={0.25} />
      </Float>
      <Float speed={2.4} rotationIntensity={0.6} floatIntensity={0.5}>
        <Puffy geometry={star} color="#ffe27a" position={[2.55, TOP_Y + 0.85, 0.2]} rotation={[0, -0.3, -0.2]} emissive={0.25} />
      </Float>
      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.6}>
        <Puffy geometry={star} color="#bfe9ff" position={[-3.5, TOP_Y + 0.2, 0.1]} scale={0.7} emissive={0.15} />
      </Float>
      <Float speed={2.2} rotationIntensity={0.4} floatIntensity={0.6}>
        <Puffy geometry={heart} color="#ff8fb8" position={[3.4, TOP_Y + 0.35, 0.1]} rotation={[0, -0.3, 0.15]} emissive={0.2} />
      </Float>
      {/* hearts + stars on the side walls */}
      <Puffy geometry={heartBig} color="#ff9ec7" position={[-sx + 0.1, 5.3, 0.1]} rotation={[0, -0.5, 0.15]} emissive={0.12} />
      <Puffy geometry={heart} color="#ffe27a" position={[sx - 0.1, 3.6, 0.1]} rotation={[0, 0.5, -0.15]} emissive={0.12} />
      <Puffy geometry={star} color="#bfe9ff" position={[-sx + 0.1, 2.2, 0.1]} rotation={[0, -0.5, 0.2]} emissive={0.12} />
      <Puffy geometry={heartBig} color="#c8b2ff" position={[sx - 0.1, 5.4, 0.1]} rotation={[0, 0.5, -0.1]} emissive={0.12} />
      {/* little bunny-ear bumps on the roof corners */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 2.7, TOP_Y + 0.22, -0.25]} scale={[0.6, 1.4, 0.55]} castShadow>
          <sphereGeometry args={[0.28, 20, 20]} />
          <Toy color={s < 0 ? PINK_DEEP : LILAC} />
        </mesh>
      ))}
    </group>
  )
}

function Sign() {
  const ready = useFontsReady()
  const map = useMemo(() => signTexture(), [ready])
  const glow = useRef()
  const mat = useRef()
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (mat.current) mat.current.color.setScalar(0.94 + 0.06 * Math.sin(t * 2.2))
    if (glow.current) glow.current.intensity = 5 + Math.sin(t * 2.2) * 1.2
  })
  return (
    <group position={[0, TOP_Y + 0.62, 0.05]}>
      {/* sign casing */}
      <RoundedBox args={[3.9, 1.1, 0.4]} radius={0.3} smoothness={5} position={[0, 0, -0.04]}>
        <meshPhysicalMaterial color="#ff9ec7" emissive="#ff7fb5" emissiveIntensity={0.55} roughness={0.35} clearcoat={0.8} />
      </RoundedBox>
      <mesh position={[0, 0, 0.17]} raycast={() => null}>
        <planeGeometry args={[3.7, 0.925]} />
        <meshBasicMaterial ref={mat} map={map} transparent toneMapped={false} />
      </mesh>
      {/* supports */}
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} position={[x, -0.62, -0.05]}>
          <cylinderGeometry args={[0.1, 0.12, 0.25, 16]} />
          <Toy color={LILAC} />
        </mesh>
      ))}
      <pointLight ref={glow} position={[0, 0.2, 1.2]} color="#ff9fcf" intensity={5} distance={6} decay={2} />
    </group>
  )
}

function Glass() {
  const shine = useMemo(() => shineTexture(), [])
  const glassMat = useRef()
  const shineMat = useRef()
  const group = useRef()
  const o = useRef(1)
  useFrame((_, dt) => {
    const sel = useStore.getState().selected != null
    o.current += ((sel ? 0 : 1) - o.current) * Math.min(1, dt * 5)
    if (glassMat.current) glassMat.current.opacity = 0.1 * o.current
    if (shineMat.current) shineMat.current.opacity = 0.22 * o.current
    if (group.current) group.current.visible = o.current > 0.02
  })
  const h = CEIL_Y - BASE_H
  return (
    <group ref={group} position={[0, BASE_H + h / 2, DEPTH / 2 - 0.02]}>
      <mesh raycast={() => null} renderOrder={5}>
        <planeGeometry args={[IW, h]} />
        <meshPhysicalMaterial
          ref={glassMat}
          color="#fff0f8"
          transparent
          opacity={0.1}
          roughness={0.04}
          metalness={0}
          clearcoat={1}
          depthWrite={false}
          envMapIntensity={1.4}
        />
      </mesh>
      <mesh position={[0, 0, 0.004]} raycast={() => null} renderOrder={6}>
        <planeGeometry args={[IW, h]} />
        <meshBasicMaterial
          ref={shineMat}
          map={shine}
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

export default function Cabinet() {
  const back = useMemo(() => {
    const t = backWallTexture()
    t.repeat.set(IW / 3.2, (CEIL_Y - BASE_H) / 3.2)
    return t
  }, [])
  const wash = useMemo(() => washTexture(), [])
  const ready = useFontsReady()
  const plaque = useMemo(() => plaqueTexture(), [ready])

  const shelfD = DEPTH - 0.06
  // under-roof / under-shelf LED strips: [y, rowIndexLit]
  const leds = [
    { y: CEIL_Y - 0.02, row: 0 },
    { y: SHELF_TOP[0] - SHELF_T - 0.02, row: 1 },
    { y: SHELF_TOP[1] - SHELF_T - 0.02, row: 2 },
  ]

  return (
    <group>
      {/* plinth */}
      <RoundedBox args={[OUTER_W + 0.3, BASE_H, DEPTH + 0.3]} radius={0.16} smoothness={5} position={[0, BASE_H / 2, 0.04]}>
        <Toy color={LILAC} />
      </RoundedBox>
      <mesh position={[0, BASE_H / 2, DEPTH / 2 + 0.2]} raycast={() => null}>
        <planeGeometry args={[4.2, 0.4]} />
        <meshBasicMaterial map={plaque} transparent toneMapped={false} />
      </mesh>

      {/* side walls */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[WALL_T, TOP_Y - BASE_H + 0.1, DEPTH]} radius={0.12} smoothness={5}
          position={[s * (IW / 2 + WALL_T / 2), BASE_H + (TOP_Y - BASE_H) / 2 - 0.05, 0]}>
          <Toy color={s < 0 ? PINK : LILAC} />
        </RoundedBox>
      ))}

      {/* roof */}
      <RoundedBox args={[OUTER_W + 0.3, WALL_T, DEPTH + 0.3]} radius={0.14} smoothness={5} position={[0, CEIL_Y + WALL_T / 2, 0.04]}>
        <Toy color={PINK} />
      </RoundedBox>

      {/* back wall */}
      <mesh position={[0, BASE_H + (CEIL_Y - BASE_H) / 2, -DEPTH / 2 + 0.06]} raycast={() => null}>
        <planeGeometry args={[IW, CEIL_Y - BASE_H]} />
        <meshStandardMaterial map={back} roughness={0.8} />
      </mesh>

      {/* the three shelves */}
      {SHELF_TOP.map((top, r) => (
        <group key={r}>
          <RoundedBox args={[IW + 0.02, SHELF_T, shelfD]} radius={0.06} smoothness={4} position={[0, top - SHELF_T / 2, -0.03]}>
            <Toy color={ROW_TINT[r]} rough={0.4} />
          </RoundedBox>
          {/* LED edge on the shelf top lip */}
          <mesh position={[0, top + 0.012, shelfD / 2 - 0.09]} raycast={() => null}>
            <boxGeometry args={[IW - 0.3, 0.02, 0.03]} />
            <meshBasicMaterial color={ROW_LED[r]} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* LED strips + wall wash + lights, one per row */}
      {leds.map(({ y, row }) => (
        <group key={row}>
          <mesh position={[0, y, 0.42]} raycast={() => null}>
            <boxGeometry args={[IW - 0.25, 0.04, 0.12]} />
            <meshBasicMaterial color="#fffafc" toneMapped={false} />
          </mesh>
          <mesh position={[0, y - 0.62, -DEPTH / 2 + 0.07]} raycast={() => null}>
            <planeGeometry args={[IW, 1.25]} />
            <meshBasicMaterial map={wash} color="#ffd0e6" transparent opacity={0.55} depthWrite={false}
              blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
          <pointLight position={[0, y - 0.2, 0.45]} color="#fff0f6" intensity={11} distance={6.5} decay={2} />
        </group>
      ))}

      <Glass />
      <Decorations />
      <Sign />

      {/* exactly 12 boxes in a fixed 3 × 4 grid */}
      {SLOTS.map((slot) => (
        <MysteryBox key={slot.id} slot={slot} />
      ))}
    </group>
  )
}
