import { Suspense, useLayoutEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { FOCUS_BOX, TOP_Y } from '../data'
import { useStore } from '../store'
import Cabinet from './Cabinet'
import Confetti from './Confetti'
import Director from './Director'

const TARGET = new THREE.Vector3(0, 3.75, 0)

/** Slightly elevated 3/4 view, auto-fitted so all 12 boxes + the sign are always in frame */
function CameraRig() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const controls = useThree((s) => s.controls)

  useLayoutEffect(() => {
    if (useStore.getState().selected != null) return
    const aspect = size.width / size.height
    const vfov = THREE.MathUtils.degToRad(camera.fov)
    const halfH = (TOP_Y + 1.35) / 2 + 1.0
    const halfW = 4.4
    const distH = halfH / Math.tan(vfov / 2)
    const distW = halfW / (Math.tan(vfov / 2) * aspect)
    const dist = Math.max(distH, distW)
    const az = THREE.MathUtils.degToRad(24)
    const el = THREE.MathUtils.degToRad(13)
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
    camera.position.copy(TARGET).addScaledVector(dir, dist)
    camera.lookAt(TARGET)
    if (controls) {
      controls.target.copy(TARGET)
      controls.update()
    }
  }, [camera, controls, size.width, size.height])

  return null
}

function Lights() {
  const amb = useRef()
  const key = useRef()
  const spot = useRef()
  const f = useRef(0)
  useFrame((_, dt) => {
    const sel = useStore.getState().selected != null
    f.current += ((sel ? 1 : 0) - f.current) * Math.min(1, dt * 4)
    if (amb.current) amb.current.intensity = 1.25 * (1 - 0.55 * f.current)
    if (key.current) key.current.intensity = 1.1 * (1 - 0.5 * f.current)
    if (spot.current) spot.current.intensity = f.current * 60
  })
  return (
    <>
      <ambientLight ref={amb} color="#fff1f8" intensity={1.25} />
      <directionalLight ref={key} position={[5, 9, 9]} color="#fff6fb" intensity={1.1} />
      <pointLight ref={spot} position={[FOCUS_BOX[0] + 1.5, FOCUS_BOX[1] + 2.2, FOCUS_BOX[2] + 3]} color="#fff3f8" intensity={0} distance={14} decay={2} />
    </>
  )
}

function Studio() {
  // procedural environment – no network / HDR download needed
  return (
    <Environment resolution={256} environmentIntensity={0.55}>
      <Lightformer form="rect" intensity={3} color="#fff0f8" position={[0, 6, 6]} scale={[10, 3, 1]} />
      <Lightformer form="rect" intensity={2} color="#ffd3e8" position={[-6, 2, 4]} rotation-y={Math.PI / 2.5} scale={[6, 5, 1]} />
      <Lightformer form="rect" intensity={2} color="#d6c8ff" position={[6, 2, 4]} rotation-y={-Math.PI / 2.5} scale={[6, 5, 1]} />
      <Lightformer form="ring" intensity={2.5} color="#ffffff" position={[0, 3, 10]} scale={4} />
    </Environment>
  )
}

function Floor() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0.2]} receiveShadow>
        <circleGeometry args={[7.2, 80]} />
        <meshStandardMaterial color="#ffe6f1" roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0.2]}>
        <ringGeometry args={[6.2, 6.5, 80]} />
        <meshStandardMaterial color="#d9c8ff" roughness={0.8} />
      </mesh>
      <ContactShadows position={[0, 0.01, 0.1]} opacity={0.4} scale={14} blur={2.6} far={3.2} color="#7a2a55" />
    </group>
  )
}

export default function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 36, near: 0.1, far: 80, position: [6, 5, 16] }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping, preserveDrawingBuffer: true }}
    >
      <Suspense fallback={null}>
        <Lights />
        <Studio />
        <Cabinet />
        <Floor />
        <Confetti />
        <Sparkles count={50} scale={[10, 8, 4]} position={[0, 4, 1.5]} size={3.2} speed={0.35} color="#ffffff" opacity={0.8} />
        <Director />
      </Suspense>
      <CameraRig />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.6}
        minDistance={9}
        maxDistance={28}
        minPolarAngle={1.0}
        maxPolarAngle={1.62}
        minAzimuthAngle={-0.55}
        maxAzimuthAngle={1.15}
      />
    </Canvas>
  )
}
