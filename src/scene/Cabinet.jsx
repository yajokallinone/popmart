import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import {
  BASE_H, CEIL_Y, DEPTH, IW, OUTER_W, SHELF_T, SHELF_TOP, SLOTS, TOP_Y, WALL_T,
} from '../data'
import { useStore } from '../store'
import EngBox from './EngBox'
import { puffy, gearShape } from './shapes'
import {
  backWallTexture, plaqueTexture, shineTexture, signTexture, useFontsReady, washTexture,
} from './textures'

const STEEL = '#46566b' // brushed steel panels
const STEEL_DARK = '#252f3c'
const GUNMETAL = '#1d2530'
const YELLOW = '#ffc21a'
const CYAN = '#3fd5ff'
const SILVER = '#c4cfdc'

function Toy({ color, rough = 0.38, coat = 0.35, metal = 0.75 }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={rough}
      metalness={metal}
      clearcoat={coat}
      clearcoatRoughness={0.3}
      envMapIntensity={1}
    />
  )
}

const ROW_TINT = ['#3a4859', '#34414f', '#3a4859'] // shelf front colours per row
const ROW_LED = [CYAN, YELLOW, CYAN]

function Puffy({ geometry, color, position, rotation, scale = 1, emissive = 0 }) {
  return (
    <mesh geometry={geometry} position={position} rotation={rotation} scale={scale} castShadow>
      <meshPhysicalMaterial
        color={color}
        roughness={0.3}
        metalness={0.7}
        clearcoat={0.6}
        emissive={color}
        emissiveIntensity={emissive}
      />
    </mesh>
  )
}

/** A gear that slowly turns about its own axis (group tilt is set by `rotation`) */
function SpinGear({ geometry, color, position, rotation = [0, 0, 0], scale = 1, speed = 0.4, emissive = 0.2 }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * speed
  })
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh ref={ref} geometry={geometry} castShadow>
        <meshPhysicalMaterial
          color={color}
          roughness={0.28}
          metalness={0.85}
          clearcoat={0.5}
          emissive={color}
          emissiveIntensity={emissive}
          envMapIntensity={1.2}
        />
      </mesh>
    </group>
  )
}

function Bolt({ position, r = 0.07 }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
      <cylinderGeometry args={[r, r, 0.05, 6]} />
      <meshStandardMaterial color="#b9c7d6" metalness={0.9} roughness={0.3} />
    </mesh>
  )
}

function Decorations() {
  const gear = useMemo(() => puffy(gearShape(0.36, 8, 0.28), 0.1, 0.04), [])
  const gear10 = useMemo(() => puffy(gearShape(0.36, 10, 0.3), 0.1, 0.04), [])
  const sx = OUTER_W / 2 + 0.25
  const wallX = IW / 2 + WALL_T / 2
  const wallY = [1.3, 2.3, 3.3, 4.3, 5.3, 6.1]
  const rx = (OUTER_W + 0.3) / 2 - 0.2
  return (
    <group>
      {/* gears turning around the sign */}
      <SpinGear geometry={gear} color={YELLOW} position={[-2.65, TOP_Y + 0.75, 0.2]} scale={1.25} speed={0.5} emissive={0.3} />
      <SpinGear geometry={gear10} color={SILVER} position={[-3.45, TOP_Y + 0.25, 0.1]} scale={0.7} speed={-0.8} emissive={0.1} />
      <SpinGear geometry={gear10} color={YELLOW} position={[2.65, TOP_Y + 0.8, 0.2]} scale={1.05} speed={-0.55} emissive={0.3} />
      <SpinGear geometry={gear} color={CYAN} position={[3.4, TOP_Y + 0.3, 0.1]} scale={0.75} speed={0.9} emissive={0.35} />
      {/* gears on the outer side walls */}
      <SpinGear geometry={gear10} color={SILVER} position={[-sx + 0.1, 5.3, 0.1]} rotation={[0, -0.5, 0]} scale={1.2} speed={0.35} emissive={0.08} />
      <SpinGear geometry={gear} color={YELLOW} position={[sx - 0.1, 3.6, 0.1]} rotation={[0, 0.5, 0]} scale={0.95} speed={-0.4} emissive={0.2} />
      <SpinGear geometry={gear} color={CYAN} position={[-sx + 0.1, 2.2, 0.1]} rotation={[0, -0.5, 0]} scale={0.8} speed={-0.6} emissive={0.25} />
      <SpinGear geometry={gear10} color={SILVER} position={[sx - 0.1, 5.4, 0.1]} rotation={[0, 0.5, 0]} scale={1.1} speed={0.3} emissive={0.08} />
      {/* antennas on the roof corners */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 2.7, TOP_Y + 0.02, -0.25]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.09, 0.6, 12]} />
            <Toy color={SILVER} rough={0.3} />
          </mesh>
          <mesh position={[0, 0.66, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color={s < 0 ? CYAN : YELLOW} emissive={s < 0 ? CYAN : YELLOW} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* rivets: side-wall fronts, roof and plinth */}
      {[-1, 1].flatMap((s) => wallY.map((y) => <Bolt key={`w${s}${y}`} position={[s * wallX, y, DEPTH / 2 + 0.03]} />))}
      {[-1, 1].flatMap((s) => [0.28, 0.76, 1.24].map((z) => <Bolt key={`r${s}${z}`} position={[s * rx, CEIL_Y + WALL_T / 2, 0.04 + z]} r={0.08} />))}
      {[-1, 1].map((s) => <Bolt key={`p${s}`} position={[s * rx, BASE_H / 2, DEPTH / 2 + 0.2]} r={0.09} />)}
    </group>
  )
}

/** round logo badge on the plinth */
function LogoBadge({ x }) {
  const map = useTexture('/logo.png')
  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 8
    map.needsUpdate = true
  }, [map])
  const z = DEPTH / 2 + 0.2 + 0.012
  return (
    <group position={[x, BASE_H / 2, z]}>
      <mesh raycast={() => null}>
        <circleGeometry args={[0.27, 48]} />
        <meshBasicMaterial map={map} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.002]} raycast={() => null}>
        <ringGeometry args={[0.27, 0.31, 48]} />
        <meshBasicMaterial color={YELLOW} toneMapped={false} />
      </mesh>
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
      <RoundedBox args={[3.9, 1.1, 0.4]} radius={0.1} smoothness={4} position={[0, 0, -0.04]}>
        <meshPhysicalMaterial color="#10151c" emissive={CYAN} emissiveIntensity={0.35} metalness={0.6} roughness={0.35} clearcoat={0.6} />
      </RoundedBox>
      <mesh position={[0, 0, 0.17]} raycast={() => null}>
        <planeGeometry args={[3.7, 0.925]} />
        <meshBasicMaterial ref={mat} map={map} transparent toneMapped={false} />
      </mesh>
      {/* supports */}
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} position={[x, -0.62, -0.05]}>
          <cylinderGeometry args={[0.1, 0.12, 0.25, 16]} />
          <Toy color={STEEL} />
        </mesh>
      ))}
      <pointLight ref={glow} position={[0, 0.2, 1.2]} color="#ffd67a" intensity={5} distance={6} decay={2} />
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
          color="#e6f4ff"
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
      <RoundedBox args={[OUTER_W + 0.3, BASE_H, DEPTH + 0.3]} radius={0.06} smoothness={4} position={[0, BASE_H / 2, 0.04]}>
        <Toy color={GUNMETAL} />
      </RoundedBox>
      <mesh position={[0, BASE_H / 2, DEPTH / 2 + 0.2]} raycast={() => null}>
        <planeGeometry args={[4.2, 0.4]} />
        <meshBasicMaterial map={plaque} transparent toneMapped={false} />
      </mesh>

      {/* side walls */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[WALL_T, TOP_Y - BASE_H + 0.1, DEPTH]} radius={0.05} smoothness={4}
          position={[s * (IW / 2 + WALL_T / 2), BASE_H + (TOP_Y - BASE_H) / 2 - 0.05, 0]}>
          <Toy color={STEEL} />
        </RoundedBox>
      ))}

      {/* roof */}
      <RoundedBox args={[OUTER_W + 0.3, WALL_T, DEPTH + 0.3]} radius={0.06} smoothness={4} position={[0, CEIL_Y + WALL_T / 2, 0.04]}>
        <Toy color={STEEL_DARK} />
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
            <meshBasicMaterial color="#eaffff" toneMapped={false} />
          </mesh>
          <mesh position={[0, y - 0.62, -DEPTH / 2 + 0.07]} raycast={() => null}>
            <planeGeometry args={[IW, 1.25]} />
            <meshBasicMaterial map={wash} color="#7fd8ff" transparent opacity={0.55} depthWrite={false}
              blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
          <pointLight position={[0, y - 0.2, 0.45]} color="#e8f6ff" intensity={11} distance={6.5} decay={2} />
        </group>
      ))}

      <LogoBadge x={-2.75} />
      <LogoBadge x={2.75} />
      <Glass />
      <Decorations />
      <Sign />

      {/* exactly 12 boxes in a fixed 3 × 4 grid */}
      {SLOTS.map((slot) => (
        <EngBox key={slot.id} slot={slot} />
      ))}
    </group>
  )
}
