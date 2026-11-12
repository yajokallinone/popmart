import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { BOX } from '../data'
import { hintTexture, useBoxTextures, useFontsReady } from './textures'

const YELLOW = '#ffc21a'
const CYAN = '#3fd5ff'
const DARK = '#1d2530'
const AUTO = 0.55 // idle spin speed (rad/s)
const TILT = 0.03 // resting tilt so the lid artwork is visible too
const SCALE = 1.9
const STAND_Y = 1.5 + (BOX.h * SCALE) / 2 // height of the box centre above the floor

/**
 * A big ENG BOX on a pedestal: it turns by itself so everybody can see the artwork on every side,
 * and visitors can grab it with the mouse / finger to spin it (and tilt it) themselves.
 */
export default function Showcase(props) {
  const tex = useBoxTextures()
  const fontsReady = useFontsReady()
  const hint = useMemo(() => hintTexture(), [fontsReady])
  const controls = useThree((s) => s.controls)
  const spin = useRef()
  const bob = useRef()
  const st = useRef({ y: 0.0, vy: 0, tilt: TILT, dragging: false, lx: 0, ly: 0, lt: 0 })

  useFrame((s, dt) => {
    const r = st.current
    if (!r.dragging) {
      r.y += (AUTO * (0.25 + 0.75 * Math.abs(Math.sin(r.y))) + r.vy) * dt // lingers on the front / back faces // keeps turning, plus whatever speed the last flick gave it
      r.vy *= Math.exp(-dt * 2.2)
      r.tilt += (TILT - r.tilt) * Math.min(1, dt * 3)
    }
    if (spin.current) {
      spin.current.rotation.y = r.y
      spin.current.rotation.x = r.tilt
    }
    if (bob.current) bob.current.position.y = STAND_Y + Math.sin(s.clock.elapsedTime * 1.3) * 0.14
  })

  const release = () => {
    const r = st.current
    if (!r.dragging) return
    r.dragging = false
    if (controls) controls.enabled = true // give the camera back its mouse
  }
  const down = (e) => {
    e.stopPropagation()
    try {
      e.target.setPointerCapture(e.pointerId)
    } catch {
      /* not capturable – fine */
    }
    const r = st.current
    r.dragging = true
    r.lx = e.clientX
    r.ly = e.clientY
    r.lt = performance.now()
    r.vy = 0
    if (controls) controls.enabled = false // don't orbit the camera while spinning the box
  }
  const move = (e) => {
    const r = st.current
    if (!r.dragging) return
    const now = performance.now()
    const dx = e.clientX - r.lx
    const dy = e.clientY - r.ly
    const secs = Math.max(8, now - r.lt) / 1000
    r.y += dx * 0.012
    r.tilt = THREE.MathUtils.clamp(r.tilt + dy * 0.008, -0.7, 0.9)
    r.vy = THREE.MathUtils.clamp((dx * 0.012) / secs, -12, 12)
    r.lx = e.clientX
    r.ly = e.clientY
    r.lt = now
  }

  const { w, h, d, lid } = BOX
  const face = (i, map) => <meshStandardMaterial key={i} attach={`material-${i}`} map={map} roughness={0.5} metalness={0.05} />
  const standY = STAND_Y

  return (
    <group {...props}>
      {/* floating: just a soft glowing ring on the floor and a hint sign under the box */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[0.9, 1.0, 48]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <circleGeometry args={[0.9, 40]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.1} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, 1.0, 0.2]} raycast={() => null}>
        <planeGeometry args={[1.5, 0.28]} />
        <meshBasicMaterial map={hint} transparent toneMapped={false} />
      </mesh>

      {/* the box itself – a drag on it spins it */}
      <group ref={bob} position={[0, standY, 0]}>
        <group
          ref={spin}
          scale={SCALE}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={release}
          onLostPointerCapture={release}
          onPointerCancel={release}
          onPointerOver={() => document.body.classList.add('cursor-hot')}
          onPointerOut={() => document.body.classList.remove('cursor-hot')}
        >
          <mesh castShadow>
            <boxGeometry args={[w, h, d]} />
            {face(0, tex.side)}
            {face(1, tex.sideLeft)}
            <meshStandardMaterial attach="material-2" color="#3a4859" roughness={0.9} />
            <meshStandardMaterial attach="material-3" color={DARK} roughness={0.7} />
            {face(4, tex.front)}
            {face(5, tex.back)}
          </mesh>
          <group position={[0, h / 2, -d / 2]}>
            <mesh position={[0, lid / 2, d / 2]}>
              <boxGeometry args={[w, lid, d]} />
              <meshStandardMaterial attach="material-0" color="#e0a400" roughness={0.5} metalness={0.4} />
              <meshStandardMaterial attach="material-1" color="#e0a400" roughness={0.5} metalness={0.4} />
              {face(2, tex.top)}
              <meshStandardMaterial attach="material-3" color="#3a4859" roughness={0.8} />
              <meshStandardMaterial attach="material-4" color="#e0a400" roughness={0.5} metalness={0.4} />
              <meshStandardMaterial attach="material-5" color="#e0a400" roughness={0.5} metalness={0.4} />
            </mesh>
          </group>
        </group>
      </group>
      <pointLight position={[0, 4.4, 2.8]} color="#eaf6ff" intensity={9} distance={9} decay={2} />
    </group>
  )
}
