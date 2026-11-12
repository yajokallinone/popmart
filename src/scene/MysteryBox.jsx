import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { BOX, SHELF_TOP, SHELF_T, DEPTH, slotPosition } from '../data'
import { prizeOfBox, useStore } from '../store'
import { registry } from './registry'
import PrizeModel from './PrizeModel'
import { glowTexture, plateTexture, shadowTexture, useFontsReady } from './textures'

export const LID_AJAR = -0.85 // lid angle of a box that was already opened

const TEX = {
  front: '/textures/front.jpg',
  side: '/textures/side.jpg',
  sideLeft: '/textures/side_left.jpg',
  top: '/textures/top.jpg',
  back: '/textures/back.jpg',
}

let sharedGlow, sharedShadow
function useShared() {
  return useMemo(() => {
    sharedGlow ||= glowTexture()
    sharedShadow ||= shadowTexture()
    return { glow: sharedGlow, shadow: sharedShadow }
  }, [])
}

const MAROON = '#7d2540'

export default function MysteryBox({ slot }) {
  const { id, row, col } = slot
  const home = useMemo(() => new THREE.Vector3(...slotPosition(row, col)), [row, col])
  const tex = useTexture(TEX)
  const { glow, shadow } = useShared()
  const fontsReady = useFontsReady()

  // Fix colour-space + anisotropy once (textures are shared by all 12 boxes)
  useLayoutEffect(() => {
    Object.values(tex).forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      t.needsUpdate = true
    })
  }, [tex])

  const plates = useMemo(
    () => [plateTexture(id, false), plateTexture(id, true)],
    [id, fontsReady],
  )

  const outer = useRef() // animated by GSAP (flight to the centre of the screen)
  const hoverG = useRef() // animated per-frame (hover wiggle / pop-out)
  const lid = useRef()
  const figure = useRef()
  const outline = useRef()
  const haloMat = useRef()
  const shadowMat = useRef()
  const plateMat = useRef()
  const mats = useRef([])
  const hv = useRef(0)
  const seed = useMemo(() => Math.random() * 100, [])

  const isSelected = useStore((s) => s.selected === id)
  const prize = useStore((s) => prizeOfBox(s, id))
  const opened = useStore((s) => !!s.opened[id])

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
    const t = state.clock.elapsedTime + seed

    const g = hoverG.current
    if (g) {
      // gently wiggles + slides forward off the shelf
      g.position.z = h * 0.3
      g.position.y = h * 0.035 + Math.sin(t * 1.4) * 0.004
      g.rotation.z = Math.sin(t * 15) * 0.05 * h
      g.rotation.y = Math.sin(t * 9.5) * 0.07 * h
      g.rotation.x = -0.03 * h
    }
    if (outline.current) outline.current.material.opacity = h * 0.95
    if (haloMat.current) haloMat.current.opacity = h * 0.7 + (opened ? 0 : 0.05 + 0.04 * Math.sin(t * 2))
    mats.current.forEach((m) => m && (m.emissiveIntensity = h * 0.28))

    // lid: ajar when already opened; Director controls it while this box is selected
    if (lid.current && s.selected !== id) {
      const goal = s.opened[id] ? LID_AJAR : 0
      lid.current.rotation.x += (goal - lid.current.rotation.x) * Math.min(1, dt * 6)
    }
    // shadow of the slot fades when the box has left the shelf
    if (shadowMat.current) {
      const away = s.selected === id
      shadowMat.current.opacity += ((away ? 0.12 : 0.75) - shadowMat.current.opacity) * Math.min(1, dt * 6)
    }
    if (plateMat.current) plateMat.current.map = plates[s.opened[id] ? 1 : 0]
  })

  const onOver = (e) => {
    e.stopPropagation()
    const s = useStore.getState()
    if (s.phase !== 'idle') return
    s.setHovered(id)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    useStore.getState().clearHovered(id)
    document.body.style.cursor = ''
  }
  const onClick = (e) => {
    e.stopPropagation()
    document.body.style.cursor = ''
    useStore.getState().select(id)
  }

  const { w, h: bh, d, lid: lt } = BOX
  const plateY = SHELF_TOP[row] - SHELF_T / 2 - home.y
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
        <meshBasicMaterial ref={plateMat} map={plates[0]} transparent toneMapped={false} />
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
              color="#ff8cc0"
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
            <meshBasicMaterial color="#ff5fa8" side={THREE.BackSide} transparent opacity={0} depthWrite={false} toneMapped={false} />
          </mesh>

          {/* ── box body: textures cropped from the reference artwork ── */}
          <mesh castShadow>
            <boxGeometry args={[w, bh, d]} />
            {face(0, tex.side)}
            {face(1, tex.sideLeft)}
            {/* inside of the box (seen once the lid opens) */}
            <meshStandardMaterial attach="material-2" color="#ffd9e8" emissive="#ffb7d4" emissiveIntensity={0.35} roughness={0.9} />
            <meshStandardMaterial attach="material-3" color={MAROON} roughness={0.7} />
            {face(4, tex.front)}
            {face(5, tex.back)}
          </mesh>

          {/* ── lid: hinged on the back-top edge ── */}
          <group ref={lid} position={[0, bh / 2, -d / 2]}>
            <mesh position={[0, lt / 2, d / 2]}>
              <boxGeometry args={[w, lt, d]} />
              <meshStandardMaterial attach="material-0" color={MAROON} roughness={0.6} />
              <meshStandardMaterial attach="material-1" color={MAROON} roughness={0.6} />
              {face(2, tex.top)}
              <meshStandardMaterial attach="material-3" color="#ffd9e8" roughness={0.8} />
              <meshStandardMaterial attach="material-4" color={MAROON} roughness={0.6} />
              <meshStandardMaterial attach="material-5" color={MAROON} roughness={0.6} />
            </mesh>
          </group>

          {/* ── collectible figure (revealed by the Director) ── */}
          <group ref={figure} position={[0, bh / 2 - 0.15, 0]} scale={0.001}>
            {isSelected && prize && (
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
