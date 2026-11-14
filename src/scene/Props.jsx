import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { FX_COLOR } from '../data'
import { useStore } from '../store'
import Showcase from './Showcase'
import { gearShape, puffy } from './shapes'

const YELLOW = '#ffc21a'
const CYAN = '#3fd5ff'
const STEEL = '#46566b'
const DARK = '#1d2530'
const SILVER = '#c4cfdc'
const WHITE = '#e8eef5'

function Metal({ color, rough = 0.35, metal = 0.8 }) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={metal} />
}
function Glow({ color, ei = 1.6 }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={ei} toneMapped={false} />
}


// How long / how hard the machines celebrate when a box pops open (rarer prize = bigger party).
const PARTY = {
  empty: { dur: 1.6, power: 0, sad: true },
  common: { dur: 2.6, power: 1, sad: false },
  rare: { dur: 3.6, power: 1.6, sad: false },
  secret: { dur: 5, power: 2.3, sad: false },
}

/** Listens for "a box was just opened" and exposes the current celebration state each frame */
function useCelebration() {
  const st = useRef({ start: -999, rarity: 'common' })
  useEffect(
    () =>
      useStore.subscribe((s, p) => {
        if (s.burstKey !== p.burstKey) st.current = { start: performance.now() / 1000, rarity: s.burstRarity }
      }),
    [],
  )
  return () => {
    const { start, rarity } = st.current
    const cfg = PARTY[rarity] || PARTY.common
    const e = performance.now() / 1000 - start
    // quick fade-in, steady, then fade-out over the last half second
    const c = e < 0 || e > cfg.dur ? 0 : Math.min(1, e / 0.15) * Math.min(1, (cfg.dur - e) / 0.5)
    return { e, c, power: cfg.power, sad: cfg.sad, happy: cfg.sad ? 0 : c, rarity }
  }
}

/** Engine: four glass cylinders with pumping pistons, a spinning flywheel, exhaust stack and a gauge */
export function Engine(props) {
  const root = useRef()
  const pistons = useRef([])
  const fly = useRef()
  const needle = useRef()
  const flame = useRef()
  const light = useRef()
  const party = useCelebration()
  const pPhase = useRef(0)
  const fPhase = useRef(0)
  const gear = useMemo(() => puffy(gearShape(0.5, 12, 0.22), 0.14, 0.03), [])
  const xs = [-0.57, -0.19, 0.19, 0.57]

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime
    const { e, c, power, sad, happy, rarity } = party()
    // happy: the engine revs up, hops and spits flames
    pPhase.current += dt * (4 + 16 * happy)
    fPhase.current += dt * (1.6 + 9 * happy)
    pistons.current.forEach((g, i) => g && (g.position.y = Math.sin(pPhase.current + (i * Math.PI) / 2) * 0.2))
    if (fly.current) fly.current.rotation.z = -fPhase.current
    if (root.current) {
      const hop = happy ? Math.abs(Math.sin(e * Math.PI * 2.2)) * 0.12 * power * happy : 0
      root.current.position.y = Math.sin(t * 38) * (0.004 + 0.012 * happy) + hop
      root.current.position.x = sad ? Math.sin(e * 60) * 0.02 * c : 0 // sputters when the box is empty
    }
    if (needle.current) needle.current.rotation.z = -0.2 + Math.sin(t * 1.3) * 0.7 * (1 - happy) + happy * (0.9 + Math.sin(t * 40) * 0.1)
    if (flame.current) flame.current.scale.setScalar((0.8 + 0.4 * Math.abs(Math.sin(t * 8))) * (1 + 2.2 * happy))
    if (light.current) {
      light.current.intensity = 3 + 9 * happy
      light.current.color.set(happy > 0.02 ? FX_COLOR[rarity] : '#ffb454')
    }
  })

  return (
    <group {...props}>
      <group ref={root}>
        {/* base plate with hazard edge */}
        <RoundedBox args={[2.1, 0.16, 1.2]} radius={0.04} position={[0, 0.08, 0]}>
          <Metal color={DARK} />
        </RoundedBox>
        <mesh position={[0, 0.09, 0.605]}>
          <boxGeometry args={[2.0, 0.06, 0.02]} />
          <Glow color={YELLOW} ei={0.5} />
        </mesh>
        {/* engine block + cooling ribs */}
        <RoundedBox args={[1.7, 0.95, 0.95]} radius={0.05} position={[0, 0.64, 0]}>
          <Metal color={STEEL} />
        </RoundedBox>
        {[-0.7, -0.35, 0, 0.35, 0.7].map((x) => (
          <mesh key={x} position={[x, 0.64, 0.49]}>
            <boxGeometry args={[0.06, 0.8, 0.04]} />
            <Metal color={DARK} />
          </mesh>
        ))}
        {/* glass cylinders + pistons */}
        {xs.map((x, i) => (
          <group key={x} position={[x, 1.57, 0]}>
            <mesh>
              <cylinderGeometry args={[0.17, 0.17, 0.9, 20, 1, true]} />
              <meshPhysicalMaterial color={CYAN} transparent opacity={0.22} roughness={0.05} metalness={0.1} side={2} depthWrite={false} />
            </mesh>
            <group ref={(g) => (pistons.current[i] = g)}>
              <mesh>
                <cylinderGeometry args={[0.135, 0.135, 0.24, 18]} />
                <Metal color={SILVER} rough={0.25} metal={0.9} />
              </mesh>
              <mesh position={[0, -0.34, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
                <Metal color={SILVER} />
              </mesh>
            </group>
          </group>
        ))}
        {/* head plate + spark plugs */}
        <RoundedBox args={[1.85, 0.2, 1.0]} radius={0.04} position={[0, 2.12, 0]}>
          <Metal color={DARK} />
        </RoundedBox>
        {xs.map((x) => (
          <group key={x} position={[x, 2.22, 0]}>
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.05, 0.06, 0.28, 10]} />
              <Metal color={WHITE} rough={0.5} metal={0.2} />
            </mesh>
            <mesh position={[0, 0.32, 0]}>
              <sphereGeometry args={[0.06, 12, 12]} />
              <Glow color={CYAN} ei={1.8} />
            </mesh>
          </group>
        ))}
        {/* exhaust stack with a flickering glow */}
        <mesh position={[-1.02, 1.55, -0.2]}>
          <cylinderGeometry args={[0.1, 0.1, 2.1, 14]} />
          <Metal color={SILVER} rough={0.3} metal={0.9} />
        </mesh>
        <mesh position={[-0.93, 0.75, -0.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.2, 10]} />
          <Metal color={SILVER} />
        </mesh>
        <mesh ref={flame} position={[-1.02, 2.68, -0.2]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <Glow color="#ff9d2e" ei={2.2} />
        </mesh>
        {/* flywheel (a big spinning gear) on the front */}
        <group position={[0.55, 0.62, 0.56]}>
          <group ref={fly}>
            <mesh geometry={gear} castShadow>
              <meshStandardMaterial color={YELLOW} roughness={0.3} metalness={0.85} emissive={YELLOW} emissiveIntensity={0.15} />
            </mesh>
            <mesh position={[0, 0, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.1, 12]} />
              <Metal color={DARK} />
            </mesh>
          </group>
        </group>
        {/* pressure gauge */}
        <group position={[-0.42, 0.78, 0.5]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.19, 0.19, 0.05, 24]} />
            <Metal color={DARK} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <torusGeometry args={[0.15, 0.015, 8, 28]} />
            <Glow color={CYAN} ei={1.2} />
          </mesh>
          <group ref={needle} position={[0, 0, 0.04]}>
            <mesh position={[0, 0.07, 0]}>
              <boxGeometry args={[0.02, 0.14, 0.01]} />
              <Glow color={YELLOW} ei={1.5} />
            </mesh>
          </group>
        </group>
        <mesh position={[-0.2, 0.3, 0.49]}>
          <boxGeometry args={[0.9, 0.07, 0.02]} />
          <Glow color={CYAN} ei={0.9} />
        </mesh>
      </group>
      <pointLight ref={light} position={[0, 2.7, 0.9]} color="#ffb454" intensity={3} distance={5} decay={2} />
    </group>
  )
}

/** Robot engineer: yellow hard hat, glowing visor, waving arm, spinning gear on its chest */
export function Robot(props) {
  const body = useRef()
  const head = useRef()
  const wave = useRef()
  const eyes = useRef()
  const lamp = useRef()
  const chest = useRef()
  const armL = useRef()
  const light = useRef()
  const gPhase = useRef(0)
  const party = useCelebration()
  const gear = useMemo(() => puffy(gearShape(0.26, 8, 0.3), 0.08, 0.025), [])

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime
    const { e, c, power, sad, happy, rarity } = party()
    if (body.current) {
      // happy: hops with both arms up (a full spin for a SECRET); sad: slumps and shakes its head
      const hop = happy ? Math.abs(Math.sin(e * Math.PI * 2.2)) * 0.32 * power * happy : 0
      body.current.position.y = Math.sin(t * 2) * 0.035 + hop - (sad ? 0.05 * c : 0)
      const spin = happy && rarity === 'secret' ? (1 - Math.pow(1 - Math.min(1, e / 1.3), 3)) * Math.PI * 2 : 0
      body.current.rotation.y = spin + (happy && rarity === 'rare' ? Math.sin(e * 7) * 0.25 : 0)
    }
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.8) * 0.3 * (1 - happy) + (sad ? Math.sin(e * 14) * 0.5 * c : 0)
      head.current.rotation.x = -0.25 * happy + (sad ? 0.2 * c : 0)
      head.current.rotation.z = Math.sin(t * 1.1) * 0.04
    }
    if (wave.current) wave.current.rotation.z = 2.5 + Math.sin(t * (5 + 10 * happy)) * (0.3 + 0.2 * happy)
    if (armL.current) armL.current.rotation.z = -0.1 - (2.4 + Math.sin(t * 11) * 0.35) * happy
    if (eyes.current) {
      const blink = Math.sin(t * 1.7) > 0.96 ? 0.1 : 1
      eyes.current.scale.set(1 + 0.2 * happy, sad ? 1 - 0.5 * c : blink * (1 + 0.3 * happy), 1)
    }
    if (lamp.current) lamp.current.scale.setScalar(1 + 0.25 * Math.sin(t * 6) + 0.5 * happy * Math.sin(t * 22))
    gPhase.current += dt * (1.2 + 6 * happy)
    if (chest.current) chest.current.rotation.z = gPhase.current
    if (light.current) {
      light.current.intensity = 2.5 + 9 * happy
      light.current.color.set(happy > 0.02 ? FX_COLOR[rarity] : '#3fd5ff')
    }
  })

  const Arm = ({ side }) => (
    <group position={[side * 0.72, 1.75, 0]}>
      <mesh>
        <sphereGeometry args={[0.17, 16, 16]} />
        <Metal color={DARK} />
      </mesh>
      <group ref={side > 0 ? wave : armL}>
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.72, 14]} />
          <Metal color={WHITE} rough={0.4} metal={0.5} />
        </mesh>
        <mesh position={[0, -0.82, 0]}>
          <sphereGeometry args={[0.14, 14, 14]} />
          <Metal color={YELLOW} />
        </mesh>
        {side < 0 && (
          // a little wrench in the left hand
          <group position={[0, -0.9, 0.1]} rotation={[0.3, 0, 0]}>
            <mesh position={[0, -0.18, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.5, 8]} />
              <Metal color={SILVER} rough={0.25} metal={0.95} />
            </mesh>
            <mesh position={[0, -0.46, 0]}>
              <torusGeometry args={[0.09, 0.035, 8, 16, Math.PI * 1.5]} />
              <Metal color={SILVER} rough={0.25} metal={0.95} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  )

  return (
    <group {...props}>
      <group ref={body}>
        {/* feet + legs + hips */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <RoundedBox args={[0.5, 0.22, 0.7]} radius={0.07} position={[s * 0.36, 0.11, 0.05]}>
              <Metal color={YELLOW} rough={0.4} metal={0.6} />
            </RoundedBox>
            <mesh position={[s * 0.36, 0.47, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.5, 12]} />
              <Metal color={STEEL} />
            </mesh>
          </group>
        ))}
        <RoundedBox args={[1.1, 0.2, 0.6]} radius={0.06} position={[0, 0.82, 0]}>
          <Metal color={DARK} />
        </RoundedBox>
        {/* torso */}
        <RoundedBox args={[1.15, 1.0, 0.8]} radius={0.14} smoothness={4} position={[0, 1.4, 0]}>
          <Metal color={WHITE} rough={0.4} metal={0.5} />
        </RoundedBox>
        <mesh position={[0, 0.98, 0]}>
          <boxGeometry args={[1.17, 0.1, 0.82]} />
          <Metal color={YELLOW} rough={0.45} metal={0.5} />
        </mesh>
        <RoundedBox args={[0.7, 0.55, 0.05]} radius={0.04} position={[0, 1.5, 0.41]}>
          <Metal color={DARK} />
        </RoundedBox>
        <group ref={chest} position={[0, 1.5, 0.46]}>
          <mesh geometry={gear}>
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.1} toneMapped={false} />
          </mesh>
        </group>
        {/* arms */}
        <Arm side={-1} />
        <Arm side={1} />
        {/* neck + head */}
        <mesh position={[0, 1.98, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.16, 12]} />
          <Metal color={DARK} />
        </mesh>
        <group ref={head} position={[0, 2.4, 0]}>
          <RoundedBox args={[1.0, 0.8, 0.8]} radius={0.16} smoothness={4}>
            <Metal color={WHITE} rough={0.4} metal={0.5} />
          </RoundedBox>
          <RoundedBox args={[0.82, 0.36, 0.06]} radius={0.06} position={[0, -0.02, 0.4]}>
            <Metal color={DARK} rough={0.2} metal={0.6} />
          </RoundedBox>
          <group ref={eyes} position={[0, -0.02, 0.44]}>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.2, 0, 0]}>
                <boxGeometry args={[0.18, 0.16, 0.04]} />
                <Glow color={CYAN} ei={2} />
              </mesh>
            ))}
          </group>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.56, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.13, 0.13, 0.12, 14]} />
              <Metal color={YELLOW} />
            </mesh>
          ))}
          {/* engineer's hard hat */}
          <mesh position={[0, 0.38, 0]}>
            <sphereGeometry args={[0.56, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Metal color={YELLOW} rough={0.35} metal={0.55} />
          </mesh>
          <mesh position={[0, 0.38, 0.06]} scale={[1, 1, 1.12]}>
            <cylinderGeometry args={[0.62, 0.62, 0.05, 28]} />
            <Metal color={YELLOW} rough={0.35} metal={0.55} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[0.12, 0.06, 0.9]} />
            <Metal color="#e0a400" rough={0.4} metal={0.5} />
          </mesh>
          <mesh ref={lamp} position={[0, 0.56, 0.5]}>
            <sphereGeometry args={[0.075, 14, 14]} />
            <Glow color={CYAN} ei={2.2} />
          </mesh>
        </group>
      </group>
      <pointLight ref={light} position={[0, 2.2, 1.2]} color={CYAN} intensity={2.5} distance={4.5} decay={2} />
    </group>
  )
}

/** machines on both sides of the cabinet, turned slightly towards it; a big rotating display box on the right */
export default function SideProps() {
  const half = useStore((s) => s.layout.OUTER_W / 2) // 3.2 for the 4-wide cabinet
  return (
    <group>
      <Engine position={[-(half + 1.9), 0, 0.9]} rotation={[0, 0.35, 0]} scale={1.15} />
      <Robot position={[half + 1.4, 0, 0.9]} rotation={[0, -0.35, 0]} scale={0.95} />
      <Showcase position={[half + 4.0, 0, 1.0]} />
    </group>
  )
}
