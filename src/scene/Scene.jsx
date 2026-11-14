import { Suspense, useLayoutEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls, Sparkles } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import { FOCUS_BOX, FX_COLOR } from '../data'
import { useStore } from '../store'
import Cabinet from './Cabinet'
import Confetti from './Confetti'
import Director from './Director'
import SideProps from './Props'

/** the point the front view looks at: middle of cabinet + sign (3.75 for the 3-row cabinet) */
const frontTarget = (L) => new THREE.Vector3(0, (L.TOP_Y + 1.35) / 2 - 0.22, 0)

/** half the width of everything in the scene: cabinet + machines + showcase (9.6 for the 4-wide cabinet) */
export const sceneHalfW = (L) => L.OUTER_W / 2 + 6.4

/** Where the camera sits for the straight-on front view: every box + the sign + both machines in frame */
function frontPose(camera, size, L) {
  const TARGET = frontTarget(L)
  const aspect = size.width / size.height
  const vfov = THREE.MathUtils.degToRad(camera.fov)
  const halfH = (L.TOP_Y + 1.35) / 2 + 1.0
  const halfW = sceneHalfW(L)
  const distH = halfH / Math.tan(vfov / 2)
  const distW = halfW / (Math.tan(vfov / 2) * aspect)
  const dist = Math.max(distH, distW)
  const el = THREE.MathUtils.degToRad(3)
  return TARGET.clone().add(new THREE.Vector3(0, Math.sin(el), Math.cos(el)).multiplyScalar(dist))
}

/**
 * Camera: starts on the locked front view. In 'locked' mode it always re-fits to the front;
 * switching 'free' → 'locked' glides the camera back to the front view.
 */
function CameraRig() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const controls = useThree((s) => s.controls)
  const camMode = useStore((s) => s.camMode)
  const L = useStore((s) => s.layout)
  const first = useRef(true)

  // initial placement + keeping the fit on resize (only while locked, so a free camera is never yanked)
  useLayoutEffect(() => {
    if (useStore.getState().selected != null) return
    if (!first.current && useStore.getState().camMode !== 'locked') return
    first.current = false
    const TARGET = frontTarget(L)
    camera.position.copy(frontPose(camera, size, L))
    camera.lookAt(TARGET)
    if (controls) {
      controls.target.copy(TARGET)
      controls.update()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, controls, size.width, size.height])

  // free → locked, or the cabinet changed size: smooth glide to the (new) front view
  useLayoutEffect(() => {
    if (camMode !== 'locked' || !controls || useStore.getState().selected != null) return
    const TARGET = frontTarget(L)
    const p = frontPose(camera, size, L)
    const tw = gsap.timeline()
    tw.to(camera.position, { x: p.x, y: p.y, z: p.z, duration: 0.8, ease: 'power3.inOut' }, 0)
      .to(controls.target, { x: TARGET.x, y: TARGET.y, z: TARGET.z, duration: 0.8, ease: 'power3.inOut' }, 0)
    return () => tw.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camMode, L])

  return null
}

/** locked: no rotate / zoom / pan · free: drag to orbit (never while a box is being opened) */
function Controls() {
  const free = useStore((s) => s.camMode === 'free')
  const busy = useStore((s) => s.selected != null)
  const on = free && !busy
  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableRotate={on}
      enableZoom={on}
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.6}
      minDistance={9}
      maxDistance={45}
      minPolarAngle={1.0}
      maxPolarAngle={1.62}
      minAzimuthAngle={-1.1}
      maxAzimuthAngle={1.1}
    />
  )
}

function Lights() {
  const amb = useRef()
  const key = useRef()
  const spot = useRef()
  const f = useRef(0)
  const dim = useRef(0) // extra blackout while a SECRET box is charging up
  useFrame((_, dt) => {
    const st = useStore.getState()
    const inCenter = st.phase === 'flying' || st.phase === 'shaking' || st.phase === 'opening'
    f.current += ((inCenter ? 1 : 0) - f.current) * Math.min(1, dt * 4)
    const dimGoal = st.fxRarity === 'secret' && (st.phase === 'shaking' || st.phase === 'opening') ? 1 : 0
    dim.current += (dimGoal - dim.current) * Math.min(1, dt * 3)
    const k = 1 - 0.45 * dim.current
    if (amb.current) amb.current.intensity = 1.25 * (1 - 0.55 * f.current) * k
    if (key.current) key.current.intensity = 1.1 * (1 - 0.5 * f.current) * k
    if (spot.current) {
      spot.current.color.set(FX_COLOR[st.fxRarity] || '#ffffff')
      spot.current.intensity = f.current * 60 * (1 + 0.8 * dim.current)
    }
  })
  return (
    <>
      <ambientLight ref={amb} color="#eaf4ff" intensity={1.25} />
      <directionalLight ref={key} position={[5, 9, 9]} color="#f2f8ff" intensity={1.1} />
      <pointLight ref={spot} position={[FOCUS_BOX[0] + 1.5, FOCUS_BOX[1] + 2.2, FOCUS_BOX[2] + 3]} color="#eef6ff" intensity={0} distance={14} decay={2} />
    </>
  )
}

function Studio() {
  // procedural environment – no network / HDR download needed
  return (
    <Environment resolution={256} environmentIntensity={0.55}>
      <Lightformer form="rect" intensity={3} color="#eaf6ff" position={[0, 6, 6]} scale={[10, 3, 1]} />
      <Lightformer form="rect" intensity={2} color="#7fd8ff" position={[-6, 2, 4]} rotation-y={Math.PI / 2.5} scale={[6, 5, 1]} />
      <Lightformer form="rect" intensity={2} color="#ffcf6a" position={[6, 2, 4]} rotation-y={-Math.PI / 2.5} scale={[6, 5, 1]} />
      <Lightformer form="ring" intensity={2.5} color="#ffffff" position={[0, 3, 10]} scale={4} />
    </Environment>
  )
}

function Floor() {
  const L = useStore((s) => s.layout)
  const k = Math.max(1, (sceneHalfW(L) + 0.3) / 9.9) // the round stage grows with a wide cabinet
  return (
    <group scale={[k, 1, k]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0.2]} receiveShadow>
        <circleGeometry args={[9.9, 96]} />
        <meshStandardMaterial color="#1b2531" roughness={0.55} metalness={0.5} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0.2]}>
        <ringGeometry args={[9.2, 9.55, 96]} />
        <meshStandardMaterial color="#ffc21a" roughness={0.5} metalness={0.4} emissive="#ffb000" emissiveIntensity={0.25} />
      </mesh>
      <ContactShadows position={[0, 0.01, 0.1]} opacity={0.4} scale={22} blur={2.6} far={3.2} color="#02070f" />
    </group>
  )
}

export default function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 36, near: 0.1, far: 80, position: [0, 4, 16] }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping, preserveDrawingBuffer: true }}
    >
      <Suspense fallback={null}>
        <Lights />
        <Studio />
        <Cabinet />
        <Floor />
        <SideProps />
        <Confetti />
        <Sparkles count={50} scale={[10, 8, 4]} position={[0, 4, 1.5]} size={3.2} speed={0.35} color="#9fe6ff" opacity={0.8} />
        <Director />
      </Suspense>
      <CameraRig />
      <Controls />
    </Canvas>
  )
}
