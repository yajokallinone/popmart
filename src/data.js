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

/** each prize has its OWN chance (%) per box – they are independent, so they don't have to add up to 100 */
export function prizeOdds(prizes) {
  const out = {}
  prizes.forEach((p) => {
    out[p.id] = live(p) ? Math.min(100, p.chance) : 0
  })
  return out
}

/**
 * Roll one box – every prize in stock is judged by its OWN chance (%).
 *  • total ≤ 100 %  → each prize drops with exactly the % you typed, nobody steals from anybody.
 *  • total > 100 %  → each prize rolls independently; when several hit at once the rarer one
 *    (lower %) wins, so higher-% prizes drop a little less often than typed.
 * No hit = nothing in the box.
 */
export function drawPrize(prizes) {
  const pool = prizes.filter(live)
  const sum = pool.reduce((a, p) => a + p.chance, 0)
  if (sum <= 100) {
    let r = Math.random() * 100
    for (const p of pool) {
      r -= p.chance
      if (r < 0) return p
    }
    return null
  }
  const hits = pool.filter((p) => Math.random() * 100 < p.chance)
  if (!hits.length) return null
  return hits.reduce((a, b) => (b.chance < a.chance ? b : a))
}

// Camera / focus pose used while a box is being opened
export const FOCUS_BOX = [0, 3.25, 7.2]
export const FOCUS_CAM = [0, 3.9, 14.6]
export const FOCUS_TARGET = [0, 3.4, 0]
