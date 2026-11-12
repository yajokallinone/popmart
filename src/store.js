import { create } from 'zustand'
import { DEFAULT_PRIZES, drawPrize } from './data'

const KEY = 'cmu-open-house-prizes-v1'

function loadPrizes() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const a = JSON.parse(raw)
      if (Array.isArray(a) && a.length) return a
    }
  } catch {
    /* ignore */
  }
  return structuredClone(DEFAULT_PRIZES)
}

const int = (v) => Math.max(0, Math.floor(Number(v) || 0))

// phase: idle → flying → shaking → opening → revealed → returning → idle
export const useStore = create((set, get) => ({
  prizes: loadPrizes(),
  results: {}, // boxId → prizeId | 'empty'   (decided the first time a box is picked)
  opened: {}, // boxId → true                (set when the lid pops open)
  collection: {}, // prizeId → count
  hovered: null,
  selected: null,
  phase: 'idle',
  closeRequested: false,
  lastWasNew: false,
  burstKey: 0,
  flashKey: 0,
  adminOpen: false,

  setHovered: (id) => set({ hovered: id }),
  clearHovered: (id) => set((s) => (s.hovered === id ? { hovered: null } : s)),
  setPhase: (phase) => set({ phase }),
  setAdmin: (adminOpen) => set({ adminOpen }),

  // ── picking a box: the prize is drawn right now, using weights + remaining stock ──
  select: (id) => {
    const s = get()
    if (s.phase !== 'idle' || s.selected != null) return
    let { results, prizes } = s
    if (!results[id]) {
      const p = drawPrize(prizes)
      results = { ...results, [id]: p ? p.id : 'empty' }
      if (p) prizes = prizes.map((x) => (x.id === p.id ? { ...x, left: x.left - 1 } : x))
    }
    set({ selected: id, phase: 'flying', hovered: null, closeRequested: false, results, prizes })
  },

  // called by the Director at the moment the lid pops open
  reveal: () => {
    const s = get()
    const id = s.selected
    if (id == null) return
    const pid = s.results[id]
    const isNew = !s.opened[id]
    const has = pid && pid !== 'empty'
    set({
      opened: { ...s.opened, [id]: true },
      collection: isNew && has ? { ...s.collection, [pid]: (s.collection[pid] || 0) + 1 } : s.collection,
      lastWasNew: isNew,
      burstKey: s.burstKey + 1,
      flashKey: s.flashKey + 1,
    })
  },

  requestClose: () => {
    if (get().phase !== 'revealed') return
    set({ closeRequested: true, phase: 'returning' })
  },
  finishClose: () => set({ selected: null, phase: 'idle', closeRequested: false }),

  surprise: () => {
    const s = get()
    if (s.phase !== 'idle') return
    const pool = []
    for (let i = 1; i <= 12; i++) if (!s.opened[i]) pool.push(i)
    const list = pool.length ? pool : Array.from({ length: 12 }, (_, i) => i + 1)
    get().select(list[Math.floor(Math.random() * list.length)])
  },

  // ── prize pool editing ──
  addPrize: ({ name, image }) =>
    set((s) => ({
      prizes: [
        ...s.prizes,
        { id: `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, name: name || 'New prize',
          rarity: 'common', builtin: null, image: image || null, total: 1, left: 1, weight: 10 },
      ],
    })),
  updatePrize: (id, patch) =>
    set((s) => ({
      prizes: s.prizes.map((p) => {
        if (p.id !== id) return p
        const n = { ...p, ...patch }
        if ('total' in patch) {
          n.total = int(patch.total)
          n.left = Math.max(0, p.left + (n.total - p.total)) // keep "sold so far" constant
        }
        if ('left' in patch) n.left = int(patch.left)
        if ('weight' in patch) n.weight = int(patch.weight)
        return n
      }),
    })),
  removePrize: (id) => set((s) => ({ prizes: s.prizes.filter((p) => p.id !== id) })),
  resetStock: () => set((s) => ({ prizes: s.prizes.map((p) => ({ ...p, left: p.total })) })),
  restoreDefaults: () => set({ prizes: structuredClone(DEFAULT_PRIZES) }),

  // put every box back on the shelf, refill stock
  reset: () => {
    if (get().phase !== 'idle') return
    set((s) => ({
      results: {},
      opened: {},
      collection: {},
      hovered: null,
      prizes: s.prizes.map((p) => ({ ...p, left: p.total })),
    }))
  },
}))

// persist the prize pool (images included) whenever it changes
useStore.subscribe((s, p) => {
  if (s.prizes === p.prizes) return
  try {
    localStorage.setItem(KEY, JSON.stringify(s.prizes))
  } catch {
    console.warn('Prize pool could not be saved (storage full?). Try smaller images.')
  }
})

export const prizeOfBox = (s, id) => {
  const pid = id != null ? s.results[id] : null
  return pid && pid !== 'empty' ? s.prizes.find((p) => p.id === pid) || null : null
}
