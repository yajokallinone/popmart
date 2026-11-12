import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'
import * as THREE from 'three'
import { FOCUS_BOX, FOCUS_CAM, FOCUS_TARGET } from '../data'
import { useStore } from '../store'
import { registry } from './registry'
import { LID_AJAR } from './MysteryBox'

const FOCUS_SCALE = 1.3


// drei only calls controls.update() while controls.enabled is true, and update() is what keeps the
// camera looking at controls.target – so we lock user input instead of disabling the controls.
function lock(controls, on) {
  if (!controls) return
  controls.enableRotate = !on
  controls.enableZoom = !on
}

/**
 * Orchestrates the whole "pick → fly → shake → open → reveal → return" sequence with GSAP.
 * It listens to the Zustand store, so the UI and the 3D scene stay decoupled.
 */
export default function Director() {
  const get = useThree((s) => s.get)

  useEffect(() => {
    let tl = null
    let saved = null
    const st = () => useStore.getState()

    const open = (id) => {
      const reg = registry.get(id)
      if (!reg) return st().finishClose()
      const { camera, controls } = get()
      const o = reg.outer.current
      const lid = reg.lid.current
      const fig = reg.figure.current
      const revisit = !!st().opened[id]

      saved = {
        cam: camera.position.clone(),
        target: controls ? controls.target.clone() : new THREE.Vector3(...FOCUS_TARGET),
      }
      lock(controls, true)

      const local = new THREE.Vector3(...FOCUS_BOX).sub(reg.home)
      fig.scale.setScalar(0.001)
      fig.position.set(0, 0.5 - 0.15, 0)

      tl?.kill()
      tl = gsap.timeline()

      // 1 ─ camera glides to the focus pose (fast!)
      tl.to(camera.position, { x: FOCUS_CAM[0], y: FOCUS_CAM[1], z: FOCUS_CAM[2], duration: 0.7, ease: 'power3.inOut' }, 0)
      if (controls) {
        tl.to(controls.target, { x: FOCUS_TARGET[0], y: FOCUS_TARGET[1], z: FOCUS_TARGET[2], duration: 0.7, ease: 'power3.inOut' }, 0)
      }

      // 2 ─ the box slides off the shelf, then arcs to the centre of the screen
      tl.to(o.position, { z: 1.25, y: 0.12, duration: 0.2, ease: 'power2.out' }, 0)
        .to(o.position, { x: local.x, y: local.y, z: local.z, duration: 0.55, ease: 'power3.inOut' }, 0.2)
        .to(o.rotation, { x: 0.1, y: -0.3, duration: 0.55, ease: 'power3.inOut' }, 0.2)
        .to(o.scale, { x: FOCUS_SCALE, y: FOCUS_SCALE, z: FOCUS_SCALE, duration: 0.55, ease: 'power3.inOut' }, 0.2)
        // keep a lid that was already ajar from poking into the camera
        .to(lid.rotation, { x: 0, duration: 0.3, ease: 'power2.out' }, 0.2)

      // 3 ─ short anticipation shake
      tl.call(() => st().setPhase('shaking'))
      if (!revisit) {
        tl.to(o.rotation, { z: 0.16, duration: 0.055, repeat: 5, yoyo: true, ease: 'sine.inOut' })
          .to(o.rotation, { z: 0, duration: 0.06, ease: 'power2.out' })
      }

      // 4 ─ pop! the lid flips open and the prize rises out
      tl.call(() => {
        st().setPhase('opening')
        st().reveal()
      })
        .to(lid.rotation, { x: -2.15, duration: 0.3, ease: 'back.out(2)' }, '<')
        .to(o.position, { y: local.y - 0.55, duration: 0.4, ease: 'power3.out' }, '<')
        .to(fig.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'elastic.out(1,0.6)' }, '<0.05')
        .to(fig.position, { y: 0.62, duration: 0.45, ease: 'back.out(1.6)' }, '<')
        .call(() => st().setPhase('revealed'), null, '<0.3')
    }

    const close = () => {
      const id = st().selected
      const reg = registry.get(id)
      if (!reg) return st().finishClose()
      const { camera, controls } = get()
      const o = reg.outer.current
      const lid = reg.lid.current
      const fig = reg.figure.current

      tl?.kill()
      tl = gsap.timeline({
        onComplete: () => {
          lock(controls, false)
          fig.scale.setScalar(0.001)
          st().finishClose()
        },
      })
      tl.to(fig.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.25, ease: 'back.in(2)' }, 0)
        .to(fig.position, { y: 0.3, duration: 0.25, ease: 'power2.in' }, 0)
        .to(lid.rotation, { x: LID_AJAR, duration: 0.3, ease: 'power2.inOut' }, 0.1)
        .to(o.rotation, { x: 0, y: 0, z: 0, duration: 0.55, ease: 'power3.inOut' }, 0.2)
        .to(o.scale, { x: 1, y: 1, z: 1, duration: 0.55, ease: 'power3.inOut' }, 0.2)
        .to(o.position, { x: 0, y: 0.12, z: 1.25, duration: 0.5, ease: 'power3.inOut' }, 0.2)
        .to(o.position, { x: 0, y: 0, z: 0, duration: 0.25, ease: 'power2.inOut' }, 0.7)
      if (saved) {
        tl.to(camera.position, { x: saved.cam.x, y: saved.cam.y, z: saved.cam.z, duration: 0.7, ease: 'power3.inOut' }, 0.2)
        if (controls) {
          tl.to(controls.target, { x: saved.target.x, y: saved.target.y, z: saved.target.z, duration: 0.7, ease: 'power3.inOut' }, 0.2)
        }
      }
    }

    const unsub = useStore.subscribe((s, p) => {
      if (s.selected != null && p.selected == null) open(s.selected)
      if (s.closeRequested && !p.closeRequested) close()
    })
    return () => {
      unsub()
      tl?.kill()
    }
  }, [get])

  return null
}
