import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Sparkles, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { figureById } from '../data'
import Figure from './Figure'

/** A custom prize uploaded by the admin: shown as a floating framed picture card */
function ImagePrize({ prize }) {
  const tex = useTexture(prize.image)
  const root = useRef()
  const seed = useRef(Math.random() * 6)
  useLayoutEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    tex.needsUpdate = true
  }, [tex])

  const aspect = tex.image ? tex.image.width / tex.image.height : 1
  let w = 0.95
  let h = w / aspect
  if (h > 1.05) {
    h = 1.05
    w = h * aspect
  }
  const special = prize.rarity !== 'common'
  const glow = prize.rarity === 'secret' ? '#ffd36a' : '#c9b2ff'

  useFrame((s) => {
    const t = s.clock.elapsedTime + seed.current
    if (!root.current) return
    root.current.rotation.y = Math.sin(t * 1.4) * 0.5
    root.current.position.y = 0.62 + Math.sin(t * 2.2) * 0.035
  })

  return (
    <group ref={root} position={[0, 0.62, 0]}>
      <RoundedBox args={[w + 0.12, h + 0.12, 0.06]} radius={0.04} smoothness={4}>
        <meshPhysicalMaterial color="#ffffff" roughness={0.35} clearcoat={0.8} />
      </RoundedBox>
      <mesh position={[0, 0, 0.036]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.036]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
      {special && (
        <>
          <pointLight position={[0, 0.2, 0.9]} color={glow} intensity={prize.rarity === 'secret' ? 7 : 3} distance={5} />
          <Sparkles count={24} scale={[1.7, 1.8, 1.4]} size={5} speed={0.7} color={glow} />
        </>
      )}
    </group>
  )
}

export default function PrizeModel({ prize }) {
  const fig = prize.builtin && !prize.image ? figureById[prize.builtin] : null
  if (fig) return <Figure fig={{ ...fig, rarity: prize.rarity }} />
  if (prize.image) return <ImagePrize prize={prize} />
  return null
}
