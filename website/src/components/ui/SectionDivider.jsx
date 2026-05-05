import React from 'react'

/* ============================================================================
   SectionDivider — the connective tissue of the site.
   ============================================================================
   Eight distinct shapes that flow between sections. Each shape is a closed
   SVG path drawn from (0,0) → top edge → curve/diagonal → (W,H) → back to (0,H).
   The fill colour is the colour of the OUTGOING (`to`) section so the divider
   "pours" the next section into the current one.

   shapes:
     • wave              — hero → cream, gentle organic hump @ 30%, dip @ 70%
     • arc               — calm hill profile, single steep arc
     • s-curve           — soft S, like calm water (used after projects bento)
     • organic-blob      — asymmetric blob entering from left
     • angular           — top-left → bottom-right diagonal cut
     • mirror-angular    — top-right → bottom-left diagonal cut
     • big-wave          — signature dramatic wave (used before final CTA)
     • subtle-wave       — companion to big-wave, smaller / mirrored
   ============================================================================ */

const COLOURS = {
  dark: '#111111',
  cream: '#FAFAF8',
  green: '#1A8A2E',
  'green-dark': '#15572E',
}

// Each path is drawn into a 1440 × H viewBox. preserveAspectRatio="none" makes
// the SVG stretch perfectly across any width.
const SHAPES = {
  wave: {
    height: 80,
    mobile: 40,
    viewBox: '0 0 1440 80',
    d:
      'M0,0 ' +
      'C 240,0 320,72 480,68 ' +     // first hump up at ~30%
      'C 640,64 800,8 1008,28 ' +    // dip and recover
      'C 1180,44 1280,72 1440,60 ' + // settle to right edge
      'L 1440,80 L 0,80 Z',
  },
  arc: {
    height: 120,
    mobile: 60,
    viewBox: '0 0 1440 120',
    d:
      'M0,0 ' +
      'C 360,0 540,120 720,120 ' +    // single steep arc
      'C 900,120 1080,0 1440,0 ' +
      'L 1440,120 L 0,120 Z',
  },
  's-curve': {
    height: 80,
    mobile: 40,
    viewBox: '0 0 1440 80',
    d:
      'M0,40 ' +
      'C 240,0 480,80 720,40 ' +     // first half of S
      'C 960,0 1200,80 1440,40 ' +   // mirrored second half
      'L 1440,80 L 0,80 Z',
  },
  'organic-blob': {
    height: 100,
    mobile: 50,
    viewBox: '0 0 1440 100',
    d:
      'M0,0 ' +
      'C 200,0 320,90 520,82 ' +     // big blob from left
      'C 720,74 880,18 1080,30 ' +
      'C 1240,40 1340,72 1440,55 ' +
      'L 1440,100 L 0,100 Z',
  },
  angular: {
    height: 120,
    mobile: 60,
    viewBox: '0 0 1440 120',
    // Sharp diagonal — top-left high, bottom-right low. Slight kink at 70%.
    d: 'M0,0 L 1440,96 L 1440,120 L 0,120 Z',
  },
  'mirror-angular': {
    height: 120,
    mobile: 60,
    viewBox: '0 0 1440 120',
    // Mirrored diagonal — top-right high, bottom-left low.
    d: 'M0,96 L 1440,0 L 1440,120 L 0,120 Z',
  },
  'big-wave': {
    height: 160,
    mobile: 80,
    viewBox: '0 0 1440 160',
    d:
      'M0,40 ' +
      'C 200,0 380,160 600,140 ' +
      'C 800,124 980,20 1180,40 ' +
      'C 1300,52 1380,100 1440,80 ' +
      'L 1440,160 L 0,160 Z',
  },
  'subtle-wave': {
    height: 60,
    mobile: 32,
    viewBox: '0 0 1440 60',
    d:
      'M0,30 ' +
      'C 360,0 720,60 1080,30 ' +
      'C 1260,15 1380,40 1440,25 ' +
      'L 1440,60 L 0,60 Z',
  },
}

/**
 * @param {Object} p
 * @param {keyof SHAPES} p.shape — which curve to render
 * @param {keyof COLOURS} p.from — colour of the incoming section (transparent)
 * @param {keyof COLOURS} p.to   — colour the divider pours into (filled)
 * @param {boolean} [p.flip]     — vertical flip (mirrors the curve)
 * @param {string} [p.className] — extra wrapper classes
 */
export default function SectionDivider({
  shape = 'wave',
  from = 'dark',
  to = 'cream',
  flip = false,
  className = '',
}) {
  const def = SHAPES[shape] || SHAPES.wave
  const fill = COLOURS[to] || COLOURS.cream
  const bg = COLOURS[from] || COLOURS.dark

  return (
    <div
      aria-hidden
      className={`relative w-full overflow-hidden pointer-events-none select-none ${className}`}
      style={{
        background: bg,
        // Use a CSS variable to swap heights at the breakpoint.
        height: 'var(--divider-h)',
        ['--divider-h']: `${def.mobile}px`,
      }}
    >
      <style>{`
        @media (min-width: 768px) {
          .__divider-${shape} { --divider-h: ${def.height}px !important; }
        }
      `}</style>
      <div className={`__divider-${shape} absolute inset-0`} style={{ ['--divider-h']: `${def.mobile}px`, height: '100%' }}>
        <svg
          viewBox={def.viewBox}
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full h-full"
          style={{ transform: flip ? 'scaleY(-1)' : undefined }}
        >
          <path d={def.d} fill={fill} />
        </svg>
      </div>
    </div>
  )
}
