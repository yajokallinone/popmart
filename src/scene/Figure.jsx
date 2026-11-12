import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'

const MAROON = '#8c1d40'

function Plastic({ color, gloss = 0.5, emissive, ei = 0, metal = 0, rough = 0.42 }) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={rough}
      metalness={metal}
      clearcoat={gloss}
      clearcoatRoughness={0.25}
      emissive={emissive || '#000'}
      emissiveIntensity={ei}
    />
  )
}

function Ears({ type, color, inner }) {
  const m = <Plastic color={color} />
  const mi = <Plastic color={inner} />
  switch (type) {
    case 'bunny':
      return [-1, 1].map((s) => (
        <group key={s} position={[s * 0.14, 1.18, 0]} rotation={[0, 0, -s * 0.18]}>
          <mesh scale={[0.9, 2.1, 0.55]}>
            <sphereGeometry args={[0.12, 20, 20]} />
            {m}
          </mesh>
          <mesh position={[0, 0, 0.035]} scale={[0.5, 1.6, 0.3]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            {mi}
          </mesh>
        </group>
      ))
    case 'cat':
      return [-1, 1].map((s) => (
        <group key={s} position={[s * 0.25, 1.03, 0]} rotation={[0, 0, -s * 0.35]}>
          <mesh>
            <coneGeometry args={[0.14, 0.26, 4]} />
            {m}
          </mesh>
          <mesh position={[0, -0.01, 0.06]} scale={0.6}>
            <coneGeometry args={[0.12, 0.22, 4]} />
            {mi}
          </mesh>
        </group>
      ))
    case 'dog':
      return [-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.38, 0.78, 0]} rotation={[0, 0, s * 0.35]} scale={[0.5, 1.05, 0.7]}>
          <sphereGeometry args={[0.18, 20, 20]} />
          <Plastic color="#9b6b4c" />
        </mesh>
      ))
    case 'mouse':
      return [-1, 1].map((s) => (
        <group key={s} position={[s * 0.31, 1.0, 0]}>
          <mesh>
            <sphereGeometry args={[0.17, 20, 20]} />
            {m}
          </mesh>
          <mesh position={[0, 0, 0.08]} scale={[1, 1, 0.5]}>
            <sphereGeometry args={[0.11, 16, 16]} />
            {mi}
          </mesh>
        </group>
      ))
    default: // bear
      return [-1, 1].map((s) => (
        <group key={s} position={[s * 0.27, 1.02, 0]}>
          <mesh>
            <sphereGeometry args={[0.13, 20, 20]} />
            {m}
          </mesh>
          <mesh position={[0, 0, 0.07]} scale={[1, 1, 0.5]}>
            <sphereGeometry args={[0.085, 16, 16]} />
            {mi}
          </mesh>
        </group>
      ))
  }
}

function Gear({ r = 0.26, teeth = 9, color = '#ffd24a' }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <torusGeometry args={[r, 0.045, 12, 40]} />
        <Plastic color={color} metal={0.9} rough={0.25} emissive="#ffb300" ei={0.9} />
      </mesh>
      {Array.from({ length: teeth }).map((_, i) => {
        const a = (i / teeth) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * (r + 0.05), Math.sin(a) * (r + 0.05), 0]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.1, 0.07, 0.09]} />
            <Plastic color={color} metal={0.9} rough={0.25} emissive="#ffb300" ei={0.9} />
          </mesh>
        )
      })}
    </group>
  )
}

export default function Figure({ fig }) {
  const root = useRef()
  const gear = useRef()
  const phase = useRef(Math.random() * 6)
  const gold = !!fig.gold
  const body = fig.body
  const innerEar = gold ? '#fff3c4' : '#ffb7c9'

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime + phase.current
    if (root.current) {
      root.current.rotation.y = Math.sin(t * 1.4) * 0.55
      root.current.position.y = Math.sin(t * 2.2) * 0.035
    }
    if (gear.current) gear.current.rotation.y += dt * 1.6
  })

  return (
    <group ref={root}>
      {gold && (
        <>
          <pointLight position={[0, 0.8, 0.8]} color="#ffd36a" intensity={7} distance={5} />
          <Sparkles count={26} scale={[1.6, 1.8, 1.6]} position={[0, 0.7, 0]} size={5} speed={0.7} color="#ffe07a" />
        </>
      )}

      {/* feet */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.14, 0.075, 0.07]} scale={[1, 0.72, 1.35]}>
          <sphereGeometry args={[0.115, 20, 20]} />
          <Plastic color={body} />
        </mesh>
      ))}

      {/* body */}
      <mesh position={[0, 0.34, 0]} scale={[1, 1.12, 0.92]}>
        <sphereGeometry args={[0.27, 28, 28]} />
        {fig.jacket ? <Plastic color={MAROON} /> : <Plastic color={gold ? '#ffcf5a' : body} metal={gold ? 0.6 : 0} rough={gold ? 0.3 : 0.42} />}
      </mesh>
      {!fig.jacket && (
        <mesh position={[0, 0.31, 0.2]} scale={[0.75, 0.85, 0.35]}>
          <sphereGeometry args={[0.2, 20, 20]} />
          <Plastic color={fig.belly} />
        </mesh>
      )}
      {fig.jacket && (
        <mesh position={[0, 0.3, 0.215]} scale={[0.22, 0.9, 0.14]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <Plastic color="#fff" />
        </mesh>
      )}

      {/* arms (varsity sleeves are white) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.3, 0.36, 0.06]} rotation={[0, 0, s * 0.5]} scale={[0.8, 1.2, 0.8]}>
          <sphereGeometry args={[0.1, 18, 18]} />
          <Plastic color={fig.jacket ? '#ffffff' : body} />
        </mesh>
      ))}

      {/* CMU scarf */}
      <mesh position={[0, 0.58, 0.01]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.92, 1]}>
        <torusGeometry args={[0.2, 0.055, 12, 32]} />
        <Plastic color={MAROON} />
      </mesh>
      <mesh position={[0.1, 0.5, 0.19]} rotation={[0.15, 0, -0.25]} scale={[1, 1.6, 0.5]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <Plastic color={MAROON} />
      </mesh>

      {/* head */}
      <mesh position={[0, 0.8, 0]} scale={[1.12, 0.95, 1]}>
        <sphereGeometry args={[0.36, 32, 32]} />
        <Plastic color={gold ? '#ffd36a' : body} metal={gold ? 0.6 : 0} rough={gold ? 0.28 : 0.42} />
      </mesh>
      <Ears type={fig.ear} color={gold ? '#ffd36a' : fig.ear === 'dog' ? '#9b6b4c' : body} inner={innerEar} />

      {/* muzzle */}
      <mesh position={[0, 0.72, 0.3]} scale={[1.1, 0.78, 0.7]}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <Plastic color={fig.belly} />
      </mesh>
      {/* face */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.15, 0.82, 0.325]} scale={[1, 1.25, 0.6]}>
            <sphereGeometry args={[0.048, 16, 16]} />
            <meshStandardMaterial color="#2a1420" roughness={0.2} />
          </mesh>
          <mesh position={[s * 0.15 + 0.012, 0.842, 0.357]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshBasicMaterial color="#fff" />
          </mesh>
          <mesh position={[s * 0.255, 0.72, 0.28]} scale={[1, 0.62, 0.3]}>
            <sphereGeometry args={[0.06, 14, 14]} />
            <meshStandardMaterial color="#ff8fb0" roughness={0.8} transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.745, 0.395]} scale={[1.2, 0.85, 0.9]}>
        <sphereGeometry args={[0.032, 12, 12]} />
        <meshStandardMaterial color="#3a1c28" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.69, 0.39]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.045, 0.011, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#3a1c28" />
      </mesh>

      {/* little CMU badge on the chest */}
      <mesh position={[-0.12, 0.38, 0.255]} rotation={[0, -0.25, 0]}>
        <circleGeometry args={[0.05, 20]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[-0.12, 0.38, 0.258]} rotation={[0, -0.25, 0]}>
        <ringGeometry args={[0.022, 0.036, 8, 1]} />
        <meshBasicMaterial color={MAROON} />
      </mesh>

      {/* secret: floating golden gear halo */}
      {gold && (
        <group ref={gear} position={[0, 1.42, 0]}>
          <Gear />
        </group>
      )}
      {/* rare: tiny sparkles */}
      {fig.rarity === 'rare' && (
        <Sparkles count={14} scale={[1.4, 1.5, 1.4]} position={[0, 0.7, 0]} size={4} speed={0.5} color="#3fd5ff" />
      )}
    </group>
  )
}
