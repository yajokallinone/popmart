import { create } from 'zustand'
import { DEFAULT_PRIZES, drawPrize } from './data'

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

const int = (v) => Math.max(0, Math.floor(Number(v) || 0))

// phase: idle → flying → shaking → opening → revealed → returning → idle
export const useStore = create((set, get) => ({
  prizes: loadPrizes(),
  results: {}, // boxId → prizeId | 'empty'   (drawn when a box is picked, cleared after every round)
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

  // ── picking a box: the prize is drawn right now, by each prize's % chance (stock permitting) ──
  select: (id) => {
    const s = get()
    if (s.phase !== 'idle' || s.selected != null) return
    // roll by % chance: a prize drops (and its stock goes down by 1) or the box is empty
    const p = drawPrize(s.prizes)
    const prizes = p ? s.prizes.map((x) => (x.id === p.id ? { ...x, left: x.left - 1 } : x)) : s.prizes
    set({ selected: id, phase: 'flying', hovered: null, closeRequested: false, results: { [id]: p ? p.id : 'empty' }, prizes, fxRarity: outcomeOf(p) })
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
  // the box is back on the shelf → every box is closed & freshly shuffled again
  finishClose: () => set({ selected: null, phase: 'idle', closeRequested: false, results: {} }),

  surprise: () => {
    if (get().phase !== 'idle') return
    get().select(1 + Math.floor(Math.random() * 12))
  },

  // ── prize pool editing ──
  addPrize: ({ name, image }) =>
    set((s) => ({
      prizes: [
        ...s.prizes,
        { id: `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, name: name || 'New prize',
          rarity: 'common', builtin: null, image: image || null, total: 1, left: 1, chance: 10 },
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
        if ('chance' in patch) n.chance = Math.max(0, Math.min(100, Math.round((Number(patch.chance) || 0) * 100) / 100))
        return n
      }),
    })),
  removePrize: (id) => set((s) => ({ prizes: s.prizes.filter((p) => p.id !== id) })),
  resetStock: () => set((s) => ({ prizes: s.prizes.map((p) => ({ ...p, left: p.total })) })),
  clearPrizes: () => set({ prizes: structuredClone(DEFAULT_PRIZES) }),

  // refill the stock of every prize and start counting rounds again
  reset: () => {
    if (get().phase !== 'idle') return
    set((s) => ({
      results: {},
      rounds: 0,
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
