import { useEffect, useRef } from 'react'
import { RARITY, prizeOdds } from '../data'
import { prizeOfBox, useStore } from '../store'
import AdminPanel from './AdminPanel'
import { PrizeIcon } from './FigureIcon'

const pointer = { x: -999, y: -999 }
if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX
    pointer.y = e.clientY
  })
}

function Tooltip() {
  const hovered = useStore((s) => s.hovered)
  const opened = useStore((s) => (s.hovered ? !!s.opened[s.hovered] : false))
  const prize = useStore((s) => (s.hovered ? prizeOfBox(s, s.hovered) : null))
  const ref = useRef()

  useEffect(() => {
    const move = (e) => {
      if (!ref.current) return
      const x = Math.min(e.clientX + 18, window.innerWidth - 220)
      ref.current.style.transform = `translate(${x}px, ${e.clientY + 20}px)`
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  if (!hovered) return null
  const x = Math.min(pointer.x + 18, window.innerWidth - 220)
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 z-30"
      style={{ transform: `translate(${x}px, ${pointer.y + 20}px)` }}
    >
      <div className="animate-tip-in flex items-center gap-2.5 rounded-2xl border-2 border-white/80 bg-white/90 px-3.5 py-2 shadow-[0_8px_24px_rgba(180,60,120,0.25)] backdrop-blur">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-400 text-sm font-bold text-white">
          {String(hovered).padStart(2, '0')}
        </span>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold text-maroon">Mystery Box #{String(hovered).padStart(2, '0')}</div>
          <div className="text-xs font-medium text-pink-500">
            {opened ? `Opened · ${prize ? prize.name : 'empty'}` : 'Click to open ✨'}
          </div>
        </div>
      </div>
    </div>
  )
}

function Chip({ children, className = '' }) {
  return (
    <div className={`rounded-full border-2 border-white/80 bg-white/70 px-4 py-2 shadow-[0_6px_20px_rgba(190,80,140,0.18)] backdrop-blur ${className}`}>
      {children}
    </div>
  )
}

const panel =
  'pointer-events-auto rounded-3xl border-2 border-white/80 bg-white/70 p-3 shadow-[0_10px_30px_rgba(190,80,140,0.2)] backdrop-blur'

/** Remaining prizes + current drop chance, always visible on the left */
function PrizePool() {
  const prizes = useStore((s) => s.prizes)
  const setAdmin = useStore((s) => s.setAdmin)
  const idle = useStore((s) => s.phase === 'idle')
  const odds = prizeOdds(prizes)
  const left = prizes.reduce((a, p) => a + p.left, 0)
  const total = prizes.reduce((a, p) => a + p.total, 0)
  return (
    <div className={`${panel} w-[min(46vw,270px)]`}>
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-maroon">Prize Pool</span>
        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold text-pink-600">
          เหลือ {left}/{total}
        </span>
      </div>
      <div className="max-h-[34vh] space-y-1 overflow-y-auto pr-1">
        {prizes.map((p) => {
          const out = p.left <= 0
          return (
            <div key={p.id} className={`flex items-center gap-2 rounded-xl px-1.5 py-1 ${out ? 'opacity-45' : ''}`}
              style={{ background: `${RARITY[p.rarity]?.color || '#ff8fb8'}1f` }}>
              <div className="grid h-8 w-8 shrink-0 place-items-center"><PrizeIcon prize={p} size={30} /></div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold leading-tight text-maroon">{p.name}</div>
                <div className="text-[11px] leading-tight text-pink-600/80">
                  {out ? 'หมดแล้ว' : `โอกาส ${odds[p.id].toFixed(odds[p.id] < 10 ? 1 : 0)}%`}
                </div>
              </div>
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-maroon">
                {p.left}/{p.total}
              </span>
            </div>
          )
        })}
      </div>
      <button
        onClick={() => idle && setAdmin(true)}
        className="mt-2 w-full cursor-pointer rounded-full bg-white/80 py-1.5 text-xs font-bold text-maroon transition hover:bg-white"
      >
        ✎ เพิ่ม / แก้ไขรางวัล
      </button>
    </div>
  )
}

function Collection() {
  const prizes = useStore((s) => s.prizes)
  const collection = useStore((s) => s.collection)
  const opened = useStore((s) => Object.keys(s.opened).length)
  const owned = prizes.filter((p) => collection[p.id]).length
  return (
    <div className={`${panel} w-[min(92vw,300px)]`}>
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-maroon">My Collection</span>
        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold text-pink-600">
          {owned}/{prizes.length}
        </span>
      </div>
      <div className="grid max-h-[26vh] grid-cols-6 gap-1.5 overflow-y-auto">
        {prizes.map((p) => {
          const n = collection[p.id] || 0
          const c = RARITY[p.rarity]?.color || '#ff8fb8'
          return (
            <div
              key={p.id}
              title={n ? p.name : '???'}
              className="relative grid aspect-square place-items-center rounded-xl"
              style={{
                background: n ? `${c}33` : '#7a3a521a',
                outline: n ? `2px solid ${c}` : '2px dashed #c9a0b6',
                outlineOffset: -2,
              }}
            >
              <PrizeIcon prize={p} size={30} locked={!n} />
              {n > 1 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-maroon px-1 text-[10px] font-bold text-white">×{n}</span>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-2 px-1 text-xs font-medium text-pink-600/80">Boxes opened: {opened} / 12</div>
    </div>
  )
}

function Reveal() {
  const phase = useStore((s) => s.phase)
  const selected = useStore((s) => s.selected)
  const prize = useStore((s) => (s.selected ? prizeOfBox(s, s.selected) : null))
  const isNew = useStore((s) => s.lastWasNew)
  const count = useStore((s) => (prize ? s.collection[prize.id] || 0 : 0))
  const requestClose = useStore((s) => s.requestClose)

  const status = {
    flying: `Picking Box #${String(selected).padStart(2, '0')}…`,
    shaking: 'Shake shake…',
    opening: 'Pop!',
  }[phase]

  if (selected && status) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-10 grid place-items-center">
        <Chip className="animate-pop-in !px-6 !py-2.5 text-lg font-semibold text-maroon">{status}</Chip>
      </div>
    )
  }
  if (phase !== 'revealed' && phase !== 'returning') return null

  const r = prize ? RARITY[prize.rarity] || RARITY.common : null
  return (
    <div className={`absolute inset-x-0 bottom-5 flex justify-center px-4 transition-opacity duration-300 ${phase === 'returning' ? 'opacity-0' : 'opacity-100'}`}>
      <div className="animate-pop-in pointer-events-auto flex w-[min(94vw,460px)] items-center gap-4 rounded-[28px] border-[3px] border-white bg-white/85 p-4 shadow-[0_16px_50px_rgba(190,60,130,0.35)] backdrop-blur-md">
        <div
          className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl"
          style={{ background: `${r ? r.color : '#999'}30`, outline: `3px solid ${r ? r.color : '#bbb'}`, outlineOffset: -3 }}
        >
          {prize ? <PrizeIcon prize={prize} size={62} /> : <span className="text-4xl">📭</span>}
        </div>
        <div className="min-w-0 flex-1">
          {prize ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: r.color }}>
                  {'★'.repeat(r.stars)} {r.label}
                </span>
                {isNew ? (
                  <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-xs font-bold text-white">NEW!</span>
                ) : (
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">Already opened</span>
                )}
                {count > 1 && <span className="text-xs font-semibold text-maroon">×{count}</span>}
              </div>
              <div className="mt-1 truncate text-2xl font-bold leading-tight text-maroon">{prize.name}</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold leading-tight text-maroon">กล่องว่าง</div>
              <div className="text-[13px] text-pink-700/80">รางวัลหมดแล้ว — เพิ่มจำนวนได้ที่ ✎ แก้ไขรางวัล</div>
            </>
          )}
        </div>
        <button
          onClick={requestClose}
          className="shrink-0 cursor-pointer rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 px-5 py-3 text-base font-bold text-white shadow-[0_6px_16px_rgba(230,60,140,0.45)] transition hover:scale-105 active:scale-95"
        >
          Collect ✦
        </button>
      </div>
    </div>
  )
}

function Hint() {
  const idle = useStore((s) => s.phase === 'idle')
  if (!idle) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 grid place-items-center px-4">
      <Chip className="text-center text-[15px] font-medium text-maroon">
        Hover a box · Click to open · Drag to look around
      </Chip>
    </div>
  )
}

export default function Overlay() {
  const idle = useStore((s) => s.phase === 'idle')
  const surprise = useStore((s) => s.surprise)
  const reset = useStore((s) => s.reset)
  const setAdmin = useStore((s) => s.setAdmin)
  const flashKey = useStore((s) => s.flashKey)

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      {/* title + prize pool */}
      <div className="absolute left-4 top-4 flex flex-col gap-3 sm:left-6 sm:top-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-pink-500">ENG CMU · Mystery Box</div>
          <div className="shine-text text-3xl font-bold leading-tight sm:text-4xl">CMU OPEN HOUSE 2026</div>
        </div>
        <PrizePool />
      </div>

      {/* right column */}
      <div className="absolute right-4 top-4 flex flex-col items-end gap-3 sm:right-6 sm:top-5">
        <Collection />
        <div className={`pointer-events-auto flex flex-wrap justify-end gap-2 transition-opacity ${idle ? 'opacity-100' : 'pointer-events-none opacity-40'}`}>
          <button
            onClick={surprise}
            className="cursor-pointer rounded-full border-2 border-white/80 bg-gradient-to-br from-pink-400 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white shadow-[0_6px_16px_rgba(230,60,140,0.4)] transition hover:scale-105 active:scale-95"
          >
            🎲 Surprise me
          </button>
          <button
            onClick={() => setAdmin(true)}
            className="cursor-pointer rounded-full border-2 border-white/80 bg-white/80 px-4 py-2 text-sm font-bold text-maroon shadow-[0_6px_16px_rgba(190,80,140,0.2)] backdrop-blur transition hover:scale-105 active:scale-95"
          >
            ⚙ รางวัล
          </button>
          <button
            onClick={reset}
            className="cursor-pointer rounded-full border-2 border-white/80 bg-white/80 px-4 py-2 text-sm font-bold text-maroon shadow-[0_6px_16px_rgba(190,80,140,0.2)] backdrop-blur transition hover:scale-105 active:scale-95"
          >
            ↻ Restock
          </button>
        </div>
      </div>

      <Hint />
      <Reveal />
      <Tooltip />
      <AdminPanel />
      {flashKey > 0 && (
        <div key={flashKey} className="animate-flash pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,#fff,rgba(255,220,240,0.6)_45%,transparent_75%)]" />
      )}
    </div>
  )
}
