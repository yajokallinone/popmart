import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BOX, FX_COLOR, SHELF_T, DEPTH } from '../data'
import { prizeOfBox, useStore } from '../store'
import { registry } from './registry'
import PrizeModel from './PrizeModel'
import { glowTexture, plateTexture, shadowTexture, useBoxTextures, useFontsReady } from './textures'

let sharedGlow, sharedShadow
function useShared() {
  return useMemo(() => {
    sharedGlow ||= glowTexture()
    sharedShadow ||= shadowTexture()
    return { glow: sharedGlow, shadow: sharedShadow }
  }, [])
}

const TRIM = '#e0a400' // yellow trim on the lid edge
const BODY_DARK = '#1d2530'

export default function EngBox({ slot, shelfTop }) {
  const { id, pos } = slot
  const home = useMemo(() => new THREE.Vector3(...pos), [pos])
  const tex = useBoxTextures()
  const { glow, shadow } = useShared()
  const fontsReady = useFontsReady()

  const outer = useRef() // animated by GSAP (flight to the centre of the screen)
  const hoverG = useRef() // animated per-frame (hover wiggle / pop-out)
  const lid = useRef()
  const figure = useRef()
  const outline = useRef()
  const haloMat = useRef()
  const shadowMat = useRef()
  const mats = useRef([])
  const hv = useRef(0)
  const pk = useRef(0) // peek-reveal progress (0 → 1) for the unpicked boxes while phase === 'revealed'
  const seed = useMemo(() => Math.random() * 100, [])

  const isSelected = useStore((s) => s.selected === id)
  const isPeeking = useStore((s) => s.selected != null && s.selected !== id && (s.phase === 'revealed' || s.phase === 'returning'))
  const isRevealedSelected = useStore((s) => s.selected === id && (s.phase === 'revealed' || s.phase === 'returning'))
  const prize = useStore((s) => prizeOfBox(s, id))

  const plate = useMemo(() => plateTexture(id, isRevealedSelected), [id, isRevealedSelected, fontsReady])

  useLayoutEffect(() => {
    registry.set(id, { outer, lid, figure, home })
    return () => registry.delete(id)
  }, [id, home])

  useFrame((state, dt) => {
    const s = useStore.getState()
    const idle = s.phase === 'idle'
    const target = s.hovered === id && idle ? 1 : 0
    hv.current += (target - hv.current) * Math.min(1, dt * 9)
    const h = hv.current

    const peeking = s.selected != null && s.selected !== id && s.phase === 'revealed'
    pk.current += ((peeking ? 1 : 0) - pk.current) * Math.min(1, dt * 7)
    const p = pk.current
    const boxPrize = prizeOfBox(s, id)
    const boxRarity = boxPrize ? boxPrize.rarity || 'common' : 'empty'
    const t = state.clock.elapsedTime + seed

    const g = hoverG.current
    if (g) {
      // gently wiggles on hover, or slides slightly forward during peek-reveal if holding a prize
      g.position.z = h * 0.3 + p * (boxPrize ? 0.24 : 0.05)
      g.position.y = h * 0.035 + Math.sin(t * 1.4) * 0.004
      g.rotation.z = Math.sin(t * 15) * 0.05 * h
      g.rotation.y = Math.sin(t * 9.5) * 0.07 * h
      g.rotation.x = -0.03 * h
    }
    if (outline.current) {
      const selOutline = s.selected === id && s.phase === 'revealed' ? 0.95 : 0
      const peekOutline = boxPrize ? p * 0.92 : 0
      const activeColor = selOutline ? FX_COLOR[s.fxRarity] : peekOutline > h ? FX_COLOR[boxRarity] : '#ffc21a'
      outline.current.material.color.set(activeColor)
      outline.current.material.opacity = Math.max(h * 0.95, peekOutline, selOutline)
    }
    // halo behind the box: idle glow, rarity aura while opening, or peek-reveal aura on the shelf
    if (haloMat.current) {
      const fxOn = s.selected === id && (s.phase === 'shaking' || s.phase === 'opening' || s.phase === 'revealed')
      const power = { empty: 0, common: 0.35, rare: 0.7, secret: 1.0 }[s.fxRarity] ?? 0
      const pulse = s.phase === 'shaking' ? 0.7 + 0.3 * Math.sin(t * 24) : 1
      const peekPower = boxPrize ? ({ common: 0.4, rare: 0.75, secret: 1.0 }[boxRarity] ?? 0.35) * p : 0
      if (fxOn) {
        haloMat.current.color.set(FX_COLOR[s.fxRarity])
        haloMat.current.opacity = h * 0.7 + 0.05 + 0.04 * Math.sin(t * 2) + power * pulse
      } else if (peekPower > 0.02) {
        haloMat.current.color.set(FX_COLOR[boxRarity])
        haloMat.current.opacity = 0.05 + peekPower
      } else {
        haloMat.current.color.set('#3fd5ff')
        haloMat.current.opacity = h * 0.7 + 0.05 + 0.04 * Math.sin(t * 2)
      }
    }
    mats.current.forEach((m) => m && (m.emissiveIntensity = Math.max(h * 0.28, boxPrize ? p * 0.22 : 0)))

    // lid & prize for the unpicked shelf boxes: crack open to reveal what was hiding inside this round
    if (s.selected !== id) {
      if (lid.current) {
        const lidGoal = peeking ? (boxPrize ? -1.95 : -0.65) : 0
        lid.current.rotation.x += (lidGoal - lid.current.rotation.x) * Math.min(1, dt * 8)
      }
      if (figure.current) {
        const figGoal = peeking && boxPrize ? 0.72 : 0.001
        const yGoal = peeking && boxPrize ? -0.22 : BOX.h / 2 - 0.15
        const zGoal = peeking && boxPrize ? 0.45 : 0
        const sc = figure.current.scale.x + (figGoal - figure.current.scale.x) * Math.min(1, dt * 8)
        figure.current.scale.setScalar(sc)
        figure.current.position.y += (yGoal - figure.current.position.y) * Math.min(1, dt * 8)
        figure.current.position.z += (zGoal - figure.current.position.z) * Math.min(1, dt * 8)
      }
    }
    // shadow of the slot fades while the box is flying in the centre, returns once docked back on the shelf
    if (shadowMat.current) {
      const away = s.selected === id && s.phase !== 'revealed'
      shadowMat.current.opacity += ((away ? 0.12 : 0.75) - shadowMat.current.opacity) * Math.min(1, dt * 6)
    }
  })

  const onOver = (e) => {
    e.stopPropagation()
    const s = useStore.getState()
    if (s.phase !== 'idle') return
    s.setHovered(id)
    document.body.classList.add('cursor-hot')
  }
  const onOut = () => {
    useStore.getState().clearHovered(id)
    document.body.classList.remove('cursor-hot')
  }
  const onClick = (e) => {
    e.stopPropagation()
    document.body.classList.remove('cursor-hot')
    useStore.getState().select(id)
  }

  const { w, h: bh, d, lid: lt } = BOX
  const plateY = shelfTop - SHELF_T / 2 - home.y
  const plateZ = (DEPTH - 0.06) / 2 + 0.004 - home.z

  const face = (i, map, color = '#ffffff') => (
    <meshStandardMaterial
      key={i}
      attach={`material-${i}`}
      ref={(m) => (mats.current[i] = m)}
      map={map}
      color={color}
      emissive="#ffffff"
      emissiveMap={map}
      emissiveIntensity={0}
      roughness={0.55}
      metalness={0}
      envMapIntensity={0.55}
    />
  )

  return (
    <group position={home} name={`box-slot-${id}`}>
      {/* soft contact shadow on the shelf (stays when the box leaves) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -bh / 2 + 0.004, 0.02]} renderOrder={1} raycast={() => null}>
        <planeGeometry args={[w * 1.55, d * 1.9]} />
        <meshBasicMaterial ref={shadowMat} map={shadow} transparent opacity={0.75} depthWrite={false} />
      </mesh>

      {/* number plate on the shelf lip */}
      <mesh position={[0, plateY, plateZ]} raycast={() => null}>
        <planeGeometry args={[0.6, 0.168]} />
        <meshBasicMaterial map={plate} transparent toneMapped={false} />
      </mesh>

      {/* stable (non-wiggling) hit area so hover never flickers */}
      <mesh
        position={[0, 0.02, 0.1]}
        onPointerOver={onOver}
        onPointerOut={onOut}
        onClick={onClick}
      >
        <boxGeometry args={[w * 1.04, bh * 1.04, d + 0.55]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      <group ref={outer}>
        <group ref={hoverG}>
          {/* warm glow behind the box */}
          <mesh position={[0, 0.05, -d / 2 - 0.1]} raycast={() => null}>
            <planeGeometry args={[w * 2.4, bh * 1.75]} />
            <meshBasicMaterial
              ref={haloMat}
              map={glow}
              color="#3fd5ff"
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>

          {/* glowing outline (inverted hull) */}
          <mesh ref={outline} scale={[1.085, 1.06, 1.1]} raycast={() => null}>
            <boxGeometry args={[w, bh + lt, d]} />
            <meshBasicMaterial color="#ffc21a" side={THREE.BackSide} transparent opacity={0} depthWrite={false} toneMapped={false} />
          </mesh>

          {/* ── box body: textures cropped from the reference artwork ── */}
          <mesh castShadow>
            <boxGeometry args={[w, bh, d]} />
            {face(0, tex.side)}
            {face(1, tex.sideLeft)}
            {/* inside of the box (seen once the lid opens) */}
            <meshStandardMaterial attach="material-2" color="#3a4859" emissive="#3fd5ff" emissiveIntensity={0.35} roughness={0.9} />
            <meshStandardMaterial attach="material-3" color={BODY_DARK} roughness={0.7} />
            {face(4, tex.front)}
            {face(5, tex.back)}
          </mesh>

          {/* ── lid: hinged on the back-top edge ── */}
          <group ref={lid} position={[0, bh / 2, -d / 2]}>
            <mesh position={[0, lt / 2, d / 2]}>
              <boxGeometry args={[w, lt, d]} />
              <meshStandardMaterial attach="material-0" color={TRIM} roughness={0.5} metalness={0.4} />
              <meshStandardMaterial attach="material-1" color={TRIM} roughness={0.5} metalness={0.4} />
              {face(2, tex.top)}
              <meshStandardMaterial attach="material-3" color="#3a4859" roughness={0.8} />
              <meshStandardMaterial attach="material-4" color={TRIM} roughness={0.5} metalness={0.4} />
              <meshStandardMaterial attach="material-5" color={TRIM} roughness={0.5} metalness={0.4} />
            </mesh>
          </group>

          {/* ── collectible figure (revealed by the Director, or peek-revealed on the shelf) ── */}
          <group ref={figure} position={[0, bh / 2 - 0.15, 0]} scale={0.001}>
            {(isSelected || isPeeking) && prize && (
              <Suspense fallback={null}>
                <PrizeModel prize={prize} />
              </Suspense>
            )}
          </group>
        </group>
      </group>
    </group>
  )
}
