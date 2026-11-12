import { figureById } from '../data'

/** Tiny flat SVG portrait of a collectible – used in the collection panel & reveal card */
export default function FigureIcon({ id, size = 44, locked = false }) {
  const f = figureById[id]
  const body = locked ? '#7a3a52' : f.body
  const inner = locked ? '#9a566e' : f.gold ? '#fff3c4' : '#ffb7c9'
  const belly = locked ? '#7a3a52' : f.belly
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      {f.ear === 'bear' && (
        <>
          <circle cx="16" cy="17" r="8" fill={body} />
          <circle cx="48" cy="17" r="8" fill={body} />
          <circle cx="16" cy="17" r="4" fill={inner} />
          <circle cx="48" cy="17" r="4" fill={inner} />
        </>
      )}
      {f.ear === 'bunny' && (
        <>
          <ellipse cx="22" cy="12" rx="6" ry="13" fill={body} />
          <ellipse cx="42" cy="12" rx="6" ry="13" fill={body} />
          <ellipse cx="22" cy="13" rx="3" ry="9" fill={inner} />
          <ellipse cx="42" cy="13" rx="3" ry="9" fill={inner} />
        </>
      )}
      {f.ear === 'cat' && (
        <>
          <path d="M10 26 L14 6 L28 17 Z" fill={body} />
          <path d="M54 26 L50 6 L36 17 Z" fill={body} />
          <path d="M15 21 L16 11 L23 17 Z" fill={inner} />
          <path d="M49 21 L48 11 L41 17 Z" fill={inner} />
        </>
      )}
      {f.ear === 'mouse' && (
        <>
          <circle cx="14" cy="19" r="10" fill={body} />
          <circle cx="50" cy="19" r="10" fill={body} />
          <circle cx="14" cy="19" r="6" fill={inner} />
          <circle cx="50" cy="19" r="6" fill={inner} />
        </>
      )}
      {f.ear === 'dog' && (
        <>
          <ellipse cx="11" cy="32" rx="6" ry="13" fill={locked ? '#5e2a40' : '#9b6b4c'} transform="rotate(14 11 32)" />
          <ellipse cx="53" cy="32" rx="6" ry="13" fill={locked ? '#5e2a40' : '#9b6b4c'} transform="rotate(-14 53 32)" />
        </>
      )}
      <ellipse cx="32" cy="36" rx="22" ry="20" fill={body} />
      <ellipse cx="32" cy="43" rx="10" ry="7.5" fill={belly} />
      {locked ? (
        <text x="32" y="44" textAnchor="middle" fontSize="26" fontWeight="700" fill="#ffd0e2" fontFamily="Fredoka, sans-serif">?</text>
      ) : (
        <>
          <ellipse cx="23" cy="34" rx="2.6" ry="3.4" fill="#2a1420" />
          <ellipse cx="41" cy="34" rx="2.6" ry="3.4" fill="#2a1420" />
          <circle cx="23.8" cy="32.8" r="0.9" fill="#fff" />
          <circle cx="41.8" cy="32.8" r="0.9" fill="#fff" />
          <ellipse cx="17" cy="41" rx="4" ry="2.6" fill="#ff8fb0" opacity=".8" />
          <ellipse cx="47" cy="41" rx="4" ry="2.6" fill="#ff8fb0" opacity=".8" />
          <ellipse cx="32" cy="40" rx="2.4" ry="1.8" fill="#3a1c28" />
          <path d="M28 44 Q32 48 36 44" stroke="#3a1c28" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M18 54 Q32 60 46 54 L44 58 Q32 62 20 58 Z" fill="#8c1d40" />
        </>
      )}
      {f.gold && !locked && <circle cx="32" cy="6" r="4.5" fill="none" stroke="#ffb300" strokeWidth="3" strokeDasharray="3 2" />}
    </svg>
  )
}

/** Icon for any prize: uploaded picture, built-in figure, or a generic gift */
export function PrizeIcon({ prize, size = 44, locked = false }) {
  if (prize.image) {
    return (
      <img
        src={prize.image}
        alt={prize.name}
        width={size}
        height={size}
        draggable={false}
        style={{ width: size, height: size, objectFit: 'contain', filter: locked ? 'grayscale(1) brightness(0.45) contrast(0.8)' : 'none' }}
      />
    )
  }
  if (prize.builtin) return <FigureIcon id={prize.builtin} size={size} locked={locked} />
  return (
    <span style={{ fontSize: size * 0.7 }} className="leading-none">
      {locked ? '❔' : '🎁'}
    </span>
  )
}
