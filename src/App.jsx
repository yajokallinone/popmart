import { Loader } from '@react-three/drei'
import Scene from './scene/Scene'
import Overlay from './ui/Overlay'

function Bokeh() {
  const dots = [
    ['8%', '70%', 180, '#ffffff', 0.55, '0s'],
    ['78%', '12%', 240, '#3fd5ff', 0.5, '1.4s'],
    ['88%', '72%', 200, '#ffc21a', 0.5, '0.7s'],
    ['20%', '18%', 140, '#5fb0ff', 0.55, '2.1s'],
    ['50%', '88%', 220, '#3fd5ff', 0.6, '1s'],
  ]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map(([l, t, s, c, o, d], i) => (
        <div
          key={i}
          className="animate-float-y absolute rounded-full blur-2xl"
          style={{ left: l, top: t, width: s, height: s, background: c, opacity: o, animationDelay: d }}
        />
      ))}
    </div>
  )
}

export default function App() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Bokeh />
      <div className="absolute inset-0">
        <Scene />
      </div>
      <Overlay />
      <Loader containerStyles={{ background: 'rgba(13,27,42,0.95)' }} innerStyles={{ background: '#33465c' }} barStyles={{ background: '#ffc21a' }} dataStyles={{ color: '#ffc21a', fontFamily: 'Fredoka, sans-serif' }} />
    </div>
  )
}
