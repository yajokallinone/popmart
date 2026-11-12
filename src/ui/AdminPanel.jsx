import { useRef } from 'react'
import { RARITY, prizeOdds } from '../data'
import { useStore } from '../store'
import { fileToDataURL } from '../utils'
import { PrizeIcon } from './FigureIcon'

const input =
  'w-full rounded-xl border-2 border-pink-200 bg-white px-2.5 py-1.5 text-sm font-medium text-maroon outline-none focus:border-pink-400'

function NumberField({ value, onChange, min = 0, className = '' }) {
  return (
    <input
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(Math.max(min, Math.floor(Number(e.target.value) || 0)))}
      className={`${input} text-center ${className}`}
    />
  )
}

function Row({ p, odds }) {
  const update = useStore((s) => s.updatePrize)
  const remove = useStore((s) => s.removePrize)
  const file = useRef()

  const pick = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      update(p.id, { image: await fileToDataURL(f) })
    } catch {
      alert('อ่านไฟล์รูปไม่ได้')
    }
  }

  return (
    <div className="grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-2xl bg-white/70 p-2.5 sm:grid-cols-[64px_minmax(120px,1.6fr)_110px_84px_84px_84px_64px_36px]">
      {/* picture */}
      <div className="relative">
        <button
          onClick={() => file.current.click()}
          title="เปลี่ยนรูป"
          className="grid h-16 w-16 cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-pink-300 bg-pink-50 transition hover:border-pink-500"
        >
          <PrizeIcon prize={p} size={54} />
        </button>
        {p.image && p.builtin && (
          <button
            onClick={() => update(p.id, { image: null })}
            title="กลับไปใช้ตัวการ์ตูน 3D เดิม"
            className="absolute -right-1.5 -top-1.5 grid h-5 w-5 cursor-pointer place-items-center rounded-full bg-maroon text-[10px] font-bold text-white"
          >
            ↺
          </button>
        )}
        <input ref={file} type="file" accept="image/*" hidden onChange={pick} />
      </div>

      <input className={input} value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} placeholder="ชื่อรางวัล" />

      <select
        className={`${input} col-span-1`}
        value={p.rarity}
        onChange={(e) => update(p.id, { rarity: e.target.value })}
      >
        {Object.entries(RARITY).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>

      <label className="text-[11px] font-semibold text-pink-600 sm:contents">
        <span className="sm:hidden">จำนวนทั้งหมด</span>
        <NumberField value={p.total} onChange={(v) => update(p.id, { total: v })} />
      </label>
      <label className="text-[11px] font-semibold text-pink-600 sm:contents">
        <span className="sm:hidden">คงเหลือ</span>
        <NumberField value={p.left} onChange={(v) => update(p.id, { left: v })} />
      </label>
      <label className="text-[11px] font-semibold text-pink-600 sm:contents">
        <span className="sm:hidden">น้ำหนักโอกาส</span>
        <NumberField value={p.weight} onChange={(v) => update(p.id, { weight: v })} />
      </label>

      <div className="text-center text-sm font-bold text-maroon">
        {odds.toFixed(odds < 10 ? 1 : 0)}
        <span className="text-xs">%</span>
      </div>
      <button
        onClick={() => confirm(`ลบ "${p.name}" ?`) && remove(p.id)}
        title="ลบ"
        className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-lg text-pink-500 transition hover:bg-pink-100"
      >
        🗑
      </button>
    </div>
  )
}

export default function AdminPanel() {
  const open = useStore((s) => s.adminOpen)
  const setAdmin = useStore((s) => s.setAdmin)
  const prizes = useStore((s) => s.prizes)
  const opened = useStore((s) => Object.keys(s.opened).length)
  const add = useStore((s) => s.addPrize)
  const resetStock = useStore((s) => s.resetStock)
  const restoreDefaults = useStore((s) => s.restoreDefaults)
  const addFile = useRef()

  if (!open) return null
  const odds = prizeOdds(prizes)
  const left = prizes.reduce((a, p) => a + p.left, 0)
  const total = prizes.reduce((a, p) => a + p.total, 0)
  const wSum = prizes.filter((p) => p.left > 0).reduce((a, p) => a + p.weight, 0)
  const boxesLeft = 12 - opened

  const onAdd = async (e) => {
    const files = [...(e.target.files || [])]
    e.target.value = ''
    for (const f of files) {
      try {
        add({ name: f.name.replace(/\.[^.]+$/, ''), image: await fileToDataURL(f) })
      } catch {
        /* skip unreadable file */
      }
    }
  }

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 grid place-items-center bg-[#5b2342]/35 p-3 backdrop-blur-sm"
      onPointerDown={(e) => e.target === e.currentTarget && setAdmin(false)}
    >
      <div className="animate-pop-in flex max-h-[92vh] w-[min(96vw,960px)] flex-col rounded-[28px] border-[3px] border-white bg-[#fff4fa] shadow-[0_24px_80px_rgba(120,30,80,0.4)]">
        <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
          <div>
            <div className="text-xl font-bold text-maroon">ตั้งค่ารางวัล · Prize Pool</div>
            <div className="text-[13px] text-pink-700/80">
              อัปโหลดรูป กำหนดจำนวน และโอกาสเจอ — บันทึกอัตโนมัติในเบราว์เซอร์นี้
            </div>
          </div>
          <button
            onClick={() => setAdmin(false)}
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full bg-white text-lg font-bold text-maroon shadow transition hover:scale-105"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap gap-2 px-5 pb-3 text-xs font-bold">
          <span className="rounded-full bg-white px-3 py-1 text-maroon">รางวัลคงเหลือ {left}/{total} ชิ้น</span>
          <span className="rounded-full bg-white px-3 py-1 text-maroon">กล่องที่ยังไม่เปิด {boxesLeft}/12 ใบ</span>
          {left < boxesLeft && (
            <span className="rounded-full bg-amber-200 px-3 py-1 text-amber-800">⚠ รางวัลน้อยกว่ากล่อง — บางกล่องจะว่าง</span>
          )}
        </div>

        <div className="hidden grid-cols-[64px_minmax(120px,1.6fr)_110px_84px_84px_84px_64px_36px] gap-3 px-5 pb-1 text-[11px] font-bold uppercase tracking-wide text-pink-600 sm:grid">
          <span>รูป</span><span>ชื่อ</span><span>ระดับ</span>
          <span className="text-center">จำนวนทั้งหมด</span><span className="text-center">คงเหลือ</span>
          <span className="text-center">น้ำหนักโอกาส</span><span className="text-center">โอกาสเจอ</span><span />
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-5 pb-3">
          {prizes.map((p) => (
            <Row key={p.id} p={p} odds={odds[p.id]} />
          ))}
          {!prizes.length && <div className="py-8 text-center text-pink-600">ยังไม่มีรางวัล — กด “เพิ่มรางวัล”</div>}
          <div className="px-1 pt-1 text-[12px] leading-snug text-pink-700/80">
            โอกาสเจอ = น้ำหนักของรางวัล ÷ น้ำหนักรวมของรางวัลที่ยังเหลือ (รวม {wSum}) — ถ้าของหมดโอกาสจะถูกคำนวณใหม่อัตโนมัติ
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t-2 border-pink-100 px-5 py-3">
          <button
            onClick={() => addFile.current.click()}
            className="cursor-pointer rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(230,60,140,0.4)] transition hover:scale-105 active:scale-95"
          >
            ＋ เพิ่มรางวัล (อัปโหลดรูป)
          </button>
          <input ref={addFile} type="file" accept="image/*" multiple hidden onChange={onAdd} />
          <button
            onClick={() => add({ name: 'รางวัลใหม่', image: null })}
            className="cursor-pointer rounded-full bg-white px-4 py-2.5 text-sm font-bold text-maroon shadow transition hover:scale-105"
          >
            ＋ ไม่มีรูป
          </button>
          <div className="flex-1" />
          <button onClick={resetStock} className="cursor-pointer rounded-full bg-white px-4 py-2.5 text-sm font-bold text-maroon shadow transition hover:scale-105">
            เติมของให้เต็ม
          </button>
          <button
            onClick={() => confirm('คืนค่าเริ่มต้นของรางวัลทั้งหมด?') && restoreDefaults()}
            className="cursor-pointer rounded-full bg-white px-4 py-2.5 text-sm font-bold text-maroon shadow transition hover:scale-105"
          >
            คืนค่าเริ่มต้น
          </button>
          <button
            onClick={() => setAdmin(false)}
            className="cursor-pointer rounded-full bg-maroon px-5 py-2.5 text-sm font-bold text-white shadow transition hover:scale-105"
          >
            เสร็จ
          </button>
        </div>
      </div>
    </div>
  )
}
