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
  common: { label: 'Common', color: '#ff8fb8', stars: 1 },
  rare: { label: 'Rare', color: '#a98bff', stars: 2 },
  secret: { label: 'Secret', color: '#ffb92e', stars: 3 },
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
//  Default prize pool (editable at runtime from the "Prizes" panel)
//   total  = how many pieces exist      left   = how many are still in stock
//   weight = relative drop chance       image  = custom uploaded picture (data URL) or null
//   builtin = id of a procedural 3D figure used when no image is uploaded
// ─────────────────────────────────────────────────────────────
const DEFAULT_QTY = { bearie: 2, bunnie: 2, kitty: 2, pupper: 2, mochi: 2, varsity: 1, gold: 1 }
const DEFAULT_WEIGHT = { bearie: 18, bunnie: 18, kitty: 18, pupper: 18, mochi: 18, varsity: 8, gold: 2 }

export const DEFAULT_PRIZES = FIGURES.map((f) => ({
  id: f.id,
  name: f.name,
  rarity: f.rarity,
  builtin: f.id,
  image: null,
  total: DEFAULT_QTY[f.id],
  left: DEFAULT_QTY[f.id],
  weight: DEFAULT_WEIGHT[f.id],
}))

/** chance (%) of each prize among the ones still in stock */
export function prizeOdds(prizes) {
  const live = prizes.filter((p) => p.left > 0 && p.weight > 0)
  const sum = live.reduce((a, p) => a + p.weight, 0)
  const out = {}
  prizes.forEach((p) => {
    out[p.id] = sum && p.left > 0 && p.weight > 0 ? (p.weight / sum) * 100 : 0
  })
  return out
}

/** weighted random draw among prizes that are still in stock */
export function drawPrize(prizes) {
  const stock = prizes.filter((p) => p.left > 0)
  if (!stock.length) return null
  const weighted = stock.filter((p) => p.weight > 0)
  const list = weighted.length ? weighted : stock
  const sum = list.reduce((a, p) => a + (weighted.length ? p.weight : 1), 0)
  let r = Math.random() * sum
  for (const p of list) {
    r -= weighted.length ? p.weight : 1
    if (r <= 0) return p
  }
  return list[list.length - 1]
}

// Camera / focus pose used while a box is being opened
export const FOCUS_BOX = [0, 3.25, 7.2]
export const FOCUS_CAM = [0, 3.9, 14.6]
export const FOCUS_TARGET = [0, 3.4, 0]
