// ─────────────────────────────────────────────────────────────
//  Layout constants – the cabinet is a FIXED 3 rows × 4 columns grid
// ─────────────────────────────────────────────────────────────
export const ROWS = 3
export const COLS = 4

// Box proportions come from the reference artwork (ENG CMU × POP MART blind box)
export const BOX = { w: 0.95, h: 1.3, d: 0.72, lid: 0.05 }

export const PITCH_X = 1.45 // distance between box centres (x)
export const DEPTH = 1.5 // cabinet depth
export const WALL_T = 0.3 // side wall / roof thickness
export const SHELF_T = 0.2 // shelf board thickness
export const IW = COLS * PITCH_X // inner width (5.8)
export const OUTER_W = IW + WALL_T * 2
export const BASE_H = 0.7 // plinth height
export const SHELF_TOP = [4.5, 2.7, 0.9] // top surface of shelf for row 0 (top) … row 2 (bottom)
export const CEIL_Y = 6.3 // underside of roof
export const TOP_Y = CEIL_Y + WALL_T
export const BOX_Z = 0.02

export const SLOTS = Array.from({ length: ROWS * COLS }, (_, i) => ({
  id: i + 1, // Box 01 … Box 12
  row: Math.floor(i / COLS),
  col: i % COLS,
}))

export function slotPosition(row, col) {
  return [(col - (COLS - 1) / 2) * PITCH_X, SHELF_TOP[row] + BOX.h / 2 + 0.004, BOX_Z]
}

// ─────────────────────────────────────────────────────────────
//  Collectibles hiding inside the boxes (the silhouettes on the box side panel)
// ─────────────────────────────────────────────────────────────
export const RARITY = {
  common: { label: 'Common', color: '#9fb3c8', stars: 1 }, // steel
  rare: { label: 'Rare', color: '#3fd5ff', stars: 2 }, // electric cyan
  secret: { label: 'Secret', color: '#ffc21a', stars: 3 }, // gold
}

/** colour used for lights / flash / banners per outcome (an empty box is dull grey) */
export const FX_COLOR = {
  empty: '#8895a5',
  common: '#9fb3c8',
  rare: '#3fd5ff',
  secret: '#ffc21a',
}

export const FIGURES = [
  { id: 'bearie', name: 'Bearie', rarity: 'common', ear: 'bear', body: '#c98f66', belly: '#f3d9bd',
    blurb: 'Loves late-night circuit labs and warm cocoa.' },
  { id: 'bunnie', name: 'Bunnie Byte', rarity: 'common', ear: 'bunny', body: '#f7e8f1', belly: '#ffffff',
    blurb: 'Hops between code and coffee at lightning speed.' },
  { id: 'kitty', name: 'Kitty Cog', rarity: 'common', ear: 'cat', body: '#ffb98a', belly: '#fff0e0',
    blurb: 'Purrs when the gears finally mesh.' },
  { id: 'pupper', name: 'Pupper Pixel', rarity: 'common', ear: 'dog', body: '#e9d7bd', belly: '#fffaf2',
    blurb: 'Fetches bugs before they reach production.' },
  { id: 'mochi', name: 'Mochi Mouse', rarity: 'common', ear: 'mouse', body: '#d9d2f4', belly: '#f6f3ff',
    blurb: 'Tiny, soft, and surprisingly great at soldering.' },
  { id: 'varsity', name: 'Varsity Bear', rarity: 'rare', ear: 'bear', body: '#b8806a', belly: '#f3d9bd', jacket: true,
    blurb: 'Rocks the maroon varsity jacket at Open House.' },
  { id: 'gold', name: 'Gold Gear Bear', rarity: 'secret', ear: 'bear', body: '#ffd36a', belly: '#fff1b8', gold: true,
    blurb: 'The legendary secret — a glowing golden gear guardian!' },
]

export const figureById = Object.fromEntries(FIGURES.map((f) => [f.id, f]))

// ─────────────────────────────────────────────────────────────
//  Prize pool (starts empty, edited at runtime from the "Prizes" panel)
//   total  = how many pieces exist      left   = how many are still in stock
//   chance = % chance a box holds it    image  = custom uploaded picture (data URL) or null
//   builtin = id of a procedural 3D figure used when no image is uploaded
// ─────────────────────────────────────────────────────────────
// The pool starts EMPTY – prizes are added from the admin panel.
export const DEFAULT_PRIZES = []

/** only prizes that are still in stock can drop */
const live = (p) => p.left > 0 && p.chance > 0

const RARITY_ORDER = { secret: 0, rare: 1, common: 2 }

/**
 * Chance (%) for each prize to appear in the cabinet in a given round:
 *  • Common (left > 0): 1 Common prize is guaranteed every round (100% if 1 Common type, or proportional share if multiple).
 *  • Rare / Secret (left > 0): spawns as the round's bonus prize according to its own `chance` (%).
 */
export function prizeOdds(prizes) {
  const out = {}
  const commons = prizes.filter((p) => p.left > 0 && p.rarity === 'common')

  prizes.forEach((p) => {
    if (p.left <= 0) {
      out[p.id] = 0
    } else if (p.rarity === 'common') {
      out[p.id] = commons.length > 0 ? 100 / commons.length : 100
    } else {
      out[p.id] = live(p) ? Math.min(100, p.chance) : 0
    }
  })
  return out
}

function pickWeighted(items) {
  const totalWeight = items.reduce((a, p) => a + Math.max(1, p.chance || 0), 0)
  let r = Math.random() * totalWeight
  for (const p of items) {
    r -= Math.max(1, p.chance || 0)
    if (r <= 0) return p
  }
  return items[0]
}

/**
 * Round dealer:
 *  1. Common is GUARANTEED in every round (1 Common box per round as long as any Common is in stock).
 *  2. Rare and Secret roll as a bonus according to their `%` (`chance`), but are MUTUALLY EXCLUSIVE —
 *     at most ONE bonus prize (either Rare OR Secret, never both) can appear alongside Common in the same round.
 *     So a round's cabinet will contain:
 *       • Common only (1 box)
 *       • Common + Rare (2 boxes)
 *       • Common + Secret (2 boxes)
 */
export function dealRound(prizes) {
  const commons = prizes.filter((p) => p.left > 0 && p.rarity === 'common')
  const specials = prizes
    .filter((p) => live(p) && (p.rarity === 'rare' || p.rarity === 'secret'))
    .sort((a, b) => (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9) || a.chance - b.chance)

  const hits = []

  // 1 ─ Always place 1 Common prize into the cabinet every round (while Common stock lasts)
  if (commons.length) {
    hits.push(commons[Math.floor(Math.random() * commons.length)])
  }

  // 2 ─ Roll at most ONE bonus prize (Rare OR Secret, never both in the same round)
  if (specials.length) {
    const sum = specials.reduce((a, p) => a + p.chance, 0)
    let bonus = null
    if (sum <= 100) {
      let r = Math.random() * 100
      for (const p of specials) {
        r -= p.chance
        if (r < 0) {
          bonus = p
          break
        }
      }
    } else {
      const rolled = specials.filter((p) => Math.random() * 100 < p.chance)
      if (rolled.length) bonus = rolled[0] // Secret / lowest-chance wins
    }
    // Fallback if all Commons are out of stock so the cabinet still has 1 prize while any stock remains
    if (!bonus && !hits.length) {
      bonus = pickWeighted(specials)
    }
    if (bonus) hits.push(bonus)
  }

  const ids = SLOTS.map((s) => s.id)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }

  const results = {}
  SLOTS.forEach((s) => {
    results[s.id] = 'empty'
  })
  hits.slice(0, SLOTS.length).forEach((p, idx) => {
    results[ids[idx]] = p.id
  })
  return results
}

/** Single-box fallback helper */
export function drawPrize(prizes) {
  const round = dealRound(prizes)
  const id = 1 + Math.floor(Math.random() * SLOTS.length)
  const pid = round[id]
  return pid && pid !== 'empty' ? prizes.find((p) => p.id === pid) || null : null
}

// Camera / focus pose used while a box is being opened
export const FOCUS_BOX = [0, 3.25, 7.2]
export const FOCUS_CAM = [0, 3.9, 14.6]
export const FOCUS_TARGET = [0, 3.4, 0]
