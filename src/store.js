import { create } from 'zustand'
import { DEFAULT_BOXES, DEFAULT_PRIZES, dealRound, makeLayout } from './data'

/** outcome class of a prize: its rarity, or 'empty' when the box has nothing */
export const outcomeOf = (prize) => (prize ? prize.rarity || 'common' : 'empty')

const KEY = 'cmu-open-house-prizes-v2'

function loadPrizes() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const a = JSON.parse(raw)
      if (Array.isArray(a)) return a.map((p) => ({ ...p, chance: p.chance ?? Math.min(100, Number(p.weight) || 10) }))
    }
  } catch {
    /* ignore */
  }
  return structuredClone(DEFAULT_PRIZES)
}

// cabinet size (number of boxes + boxes per shelf) is saved separately from the prizes
const LAYOUT_KEY = 'cmu-open-house-layout-v1'
function loadLayout() {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (raw) {
      const { count, cols } = JSON.parse(raw)
      return makeLayout(count, cols)
    }
  } catch {
    /* ignore */
  }
  return makeLayout(DEFAULT_BOXES, 'auto')
}

const int = (v) => Math.max(0, Math.floor(Number(v) || 0))
const initialPrizes = loadPrizes()
const initialLayout = loadLayout()

// phase: idle → flying → shaking → opening → revealed → returning → idle
export const useStore = create((set, get) => ({
  prizes: initialPrizes,
  layout: initialLayout, // grid of boxes: { count, cols, rows, slots, … } – see makeLayout()
  results: dealRound(initialPrizes, initialLayout.slots), // boxId (1..count) → prizeId | 'empty' (pre-dealt before each round)
  rounds: 0, // how many boxes have been opened since the last Restock
  fxRarity: 'common', // outcome of the box being opened: drives lights / camera / confetti
  hovered: null,
  selected: null,
  phase: 'idle',
  closeRequested: false,
  burstKey: 0,
  burstRarity: 'common',
  flashKey: 0,
  adminOpen: false,
  camMode: 'locked', // 'locked' = straight-on front view · 'free' = drag to orbit around the cabinet

  setHovered: (id) => set({ hovered: id }),
  clearHovered: (id) => set((s) => (s.hovered === id ? { hovered: null } : s)),
  setPhase: (phase) => set({ phase }),
  setAdmin: (adminOpen) => set({ adminOpen }),
  setCamMode: (camMode) => set({ camMode }),

  // ── picking a box: every box already hold their pre-dealt contents for this round ──
  select: (id) => {
    const s = get()
    if (s.phase !== 'idle' || s.selected != null) return
    const results = Object.keys(s.results).length ? s.results : dealRound(s.prizes, s.layout.slots)
    const pid = results[id]
    const p = pid && pid !== 'empty' ? s.prizes.find((x) => x.id === pid && x.left > 0) || null : null
    // only the prize inside the box the player actually picked loses 1 stock
    const prizes = p ? s.prizes.map((x) => (x.id === p.id ? { ...x, left: x.left - 1 } : x)) : s.prizes
    set({
      selected: id,
      phase: 'flying',
      hovered: null,
      closeRequested: false,
      results,
      prizes,
      fxRarity: outcomeOf(p),
    })
  },

  // called by the Director at the moment the lid pops open
  reveal: () => {
    const s = get()
    if (s.selected == null) return
    set({
      rounds: s.rounds + 1,
      burstRarity: s.fxRarity,
      burstKey: s.burstKey + 1,
      flashKey: s.fxRarity === 'empty' ? s.flashKey : s.flashKey + 1,
    })
  },

  requestClose: () => {
    if (get().phase !== 'revealed') return
    set({ closeRequested: true, phase: 'returning' })
  },
  // the box is back on the shelf → every box closes & a brand-new round is shuffled
  finishClose: () =>
    set((s) => ({
      selected: null,
      phase: 'idle',
      closeRequested: false,
      results: dealRound(s.prizes, s.layout.slots),
    })),

  surprise: () => {
    if (get().phase !== 'idle') return
    get().select(1 + Math.floor(Math.random() * get().layout.count))
  },

  // ── prize pool editing (re-shuffles the current idle round whenever prizes change) ──
  addPrize: ({ name, image }) =>
    set((s) => {
      const prizes = [
        ...s.prizes,
        {
          id: `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
          name: name || 'New prize',
          rarity: 'common',
          builtin: null,
          image: image || null,
          total: 1,
          left: 1,
          chance: 10,
        },
      ]
      return { prizes, ...(s.phase === 'idle' ? { results: dealRound(prizes, s.layout.slots) } : {}) }
    }),
  updatePrize: (id, patch) =>
    set((s) => {
      const prizes = s.prizes.map((p) => {
        if (p.id !== id) return p
        const n = { ...p, ...patch }
        if ('total' in patch) {
          n.total = int(patch.total)
          n.left = Math.max(0, p.left + (n.total - p.total)) // keep "sold so far" constant
        }
        if ('left' in patch) n.left = int(patch.left)
        if ('chance' in patch) n.chance = Math.max(0, Math.min(100, Math.round((Number(patch.chance) || 0) * 100) / 100))
        return n
      })
      return { prizes, ...(s.phase === 'idle' ? { results: dealRound(prizes, s.layout.slots) } : {}) }
    }),
  removePrize: (id) =>
    set((s) => {
      const prizes = s.prizes.filter((p) => p.id !== id)
      return { prizes, ...(s.phase === 'idle' ? { results: dealRound(prizes, s.layout.slots) } : {}) }
    }),
  resetStock: () =>
    set((s) => {
      const prizes = s.prizes.map((p) => ({ ...p, left: p.total }))
      return { prizes, ...(s.phase === 'idle' ? { results: dealRound(prizes, s.layout.slots) } : {}) }
    }),
  clearPrizes: () =>
    set((s) => {
      const prizes = structuredClone(DEFAULT_PRIZES)
      return { prizes, ...(s.phase === 'idle' ? { results: dealRound(prizes, s.layout.slots) } : {}) }
    }),

  // change how many boxes are in the cabinet (only between rounds) → rebuild the grid & deal a fresh round
  setLayout: (count, cols = 'auto') => {
    const s = get()
    if (s.phase !== 'idle' || s.selected != null) return
    const layout = makeLayout(count, cols)
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify({ count: layout.count, cols: layout.auto ? 'auto' : layout.cols }))
    } catch {
      /* ignore */
    }
    set({ layout, hovered: null, results: dealRound(s.prizes, layout.slots) })
  },

  // refill the stock of every prize, reset round counter, and shuffle a fresh round
  reset: () => {
    if (get().phase !== 'idle') return
    set((s) => {
      const prizes = s.prizes.map((p) => ({ ...p, left: p.total }))
      return {
        results: dealRound(prizes, s.layout.slots),
        rounds: 0,
        hovered: null,
        prizes,
      }
    })
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
