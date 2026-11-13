import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'
import * as THREE from 'three'
import { FOCUS_BOX, FOCUS_CAM, FOCUS_TARGET } from '../data'
import { useStore } from '../store'
import { registry } from './registry'

const FOCUS_SCALE = 1.3


// How dramatic each outcome is. The longer / harder the anticipation, the rarer the prize.
//   shake  = number of wobbles    amp = wobble angle (rad)    dur = seconds per wobble
//   swell  = box grows by this factor while charging up       hold = suspense pause before the pop
//   punch  = camera dolly-in on the pop (world units)         camShake = camera tremble amplitude
const FX = {
  empty: { shake: 3, amp: 0.07, dur: 0.07, swell: 1, hold: 0, punch: 0, camShake: 0 },
  common: { shake: 5, amp: 0.16, dur: 0.055, swell: 1, hold: 0, punch: 0, camShake: 0 },
  rare: { shake: 9, amp: 0.2, dur: 0.05, swell: 1.08, hold: 0.1, punch: 0.9, camShake: 0 },
  secret: { shake: 15, amp: 0.27, dur: 0.045, swell: 1.16, hold: 0.35, punch: 1.8, camShake: 0.09 },
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
      const fx = FX[st().fxRarity] || FX.common

      saved = {
        cam: camera.position.clone(),
        target: controls ? controls.target.clone() : new THREE.Vector3(...FOCUS_TARGET),
      }

      const local = new THREE.Vector3(...FOCUS_BOX).sub(reg.home)
      const hasPrize = st().fxRarity !== 'empty'
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

      // 3 ─ anticipation: the rarer the prize, the longer and harder the box shakes
      const shakeTime = fx.dur * (fx.shake + 1)
      tl.call(() => st().setPhase('shaking'))
      tl.to(o.rotation, { z: fx.amp, duration: fx.dur, repeat: fx.shake, yoyo: true, ease: 'sine.inOut' })
      if (fx.swell > 1) {
        const k = FOCUS_SCALE * fx.swell
        tl.to(o.scale, { x: k, y: k, z: k, duration: shakeTime, ease: 'power1.in' }, '<')
      }
      tl.to(o.rotation, { z: 0, duration: 0.06, ease: 'power2.out' })
      if (fx.hold) tl.to({}, { duration: fx.hold }) // suspense…

      // 4 ─ pop! the lid flips open and the prize rises out in the centre
      tl.addLabel('pop')
        .call(() => {
          st().setPhase('opening')
          st().reveal()
        }, null, 'pop')
        .to(lid.rotation, { x: -2.15, duration: 0.3, ease: 'back.out(2)' }, 'pop')
        .to(o.scale, { x: FOCUS_SCALE, y: FOCUS_SCALE, z: FOCUS_SCALE, duration: 0.25, ease: 'back.out(3)' }, 'pop')
        .to(o.position, { y: local.y - 0.55, duration: 0.4, ease: 'power3.out' }, 'pop')
        .to(fig.scale, { x: 1, y: 1, z: 1, duration: 0.55, ease: 'elastic.out(1,0.6)' }, 'pop+=0.05')
        .to(fig.position, { x: 0, y: 0.62, z: 0, duration: 0.45, ease: 'back.out(1.6)' }, 'pop+=0.05')
      if (fx.punch) {
        tl.to(camera.position, { z: FOCUS_CAM[2] - fx.punch, duration: 0.1, ease: 'power2.out' }, 'pop')
          .to(camera.position, { z: FOCUS_CAM[2], duration: 0.6, ease: 'elastic.out(1,0.5)' }, 'pop+=0.1')
      }
      if (fx.camShake) {
        tl.to(camera.position, { x: FOCUS_CAM[0] + fx.camShake, duration: 0.04, repeat: 11, yoyo: true, ease: 'none' }, 'pop')
          .to(camera.position, { x: FOCUS_CAM[0], duration: 0.1 }, 'pop+=0.5')
      }

      // 5 ─ glide the opened box back to its shelf slot & pull camera back so it never blocks the 11-box peek reveal
      tl.addLabel('dock', 'pop+=1.05')
        .to(o.position, { x: 0, y: 0, z: hasPrize ? 0.24 : 0.05, duration: 0.65, ease: 'power3.inOut' }, 'dock')
        .to(o.rotation, { x: 0, y: 0, z: 0, duration: 0.65, ease: 'power3.inOut' }, 'dock')
        .to(o.scale, { x: 1, y: 1, z: 1, duration: 0.65, ease: 'power3.inOut' }, 'dock')
        .to(lid.rotation, { x: hasPrize ? -1.95 : -0.65, duration: 0.55, ease: 'power2.inOut' }, 'dock')
        .to(
          fig.scale,
          { x: hasPrize ? 0.72 : 0.001, y: hasPrize ? 0.72 : 0.001, z: hasPrize ? 0.72 : 0.001, duration: 0.55, ease: 'power2.inOut' },
          'dock'
        )
        .to(fig.position, { x: 0, y: hasPrize ? -0.22 : 0.35, z: hasPrize ? 0.45 : 0, duration: 0.55, ease: 'power2.inOut' }, 'dock')
        .call(() => st().setPhase('revealed'), null, 'dock+=0.3')
      if (saved) {
        tl.to(camera.position, { x: saved.cam.x, y: saved.cam.y, z: saved.cam.z, duration: 0.65, ease: 'power3.inOut' }, 'dock')
        if (controls) {
          tl.to(controls.target, { x: saved.target.x, y: saved.target.y, z: saved.target.z, duration: 0.65, ease: 'power3.inOut' }, 'dock')
        }
      }
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
          fig.scale.setScalar(0.001)
          fig.position.set(0, 0.35, 0)
          st().finishClose()
        },
      })
      tl.to(fig.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.25, ease: 'back.in(2)' }, 0)
        .to(fig.position, { x: 0, y: 0.35, z: 0, duration: 0.25, ease: 'power2.in' }, 0)
        .to(lid.rotation, { x: 0, duration: 0.3, ease: 'power2.inOut' }, 0.05)
        .to(o.rotation, { x: 0, y: 0, z: 0, duration: 0.35, ease: 'power3.inOut' }, 0.05)
        .to(o.scale, { x: 1, y: 1, z: 1, duration: 0.35, ease: 'power3.inOut' }, 0.05)
        .to(o.position, { x: 0, y: 0, z: 0, duration: 0.35, ease: 'power2.inOut' }, 0.05)
      if (saved) {
        tl.to(camera.position, { x: saved.cam.x, y: saved.cam.y, z: saved.cam.z, duration: 0.35, ease: 'power3.inOut' }, 0)
        if (controls) {
          tl.to(controls.target, { x: saved.target.x, y: saved.target.y, z: saved.target.z, duration: 0.35, ease: 'power3.inOut' }, 0)
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
