/**
 * KineticTextStrip — slow editorial marquee of service words.
 *
 * Sits between content sections as a typographic palate cleanser. Pick the
 * variant that *contrasts* with the surrounding section — dark when the
 * neighbouring section is cream, cream when the neighbour is dark.
 *
 * Uses the existing `.animate-marquee` keyframe (defined in src/index.css).
 */
export default function KineticTextStrip({
  words = [
    'Stretch ceilings',
    'Architectural lighting',
    'Interior design',
    'Flooring',
    'Tiling',
    'Epoxy systems',
  ],
  variant = 'dark',
  speed = 60,
}) {
  const className =
    variant === 'dark' ? 'bg-lafoi-dark text-white/85' : 'bg-lafoi-cream text-lafoi-dark'
  const accent = variant === 'dark' ? 'text-lafoi-green-light' : 'text-lafoi-green'
  const repeated = [...words, ...words, ...words, ...words]

  return (
    <div
      className={`relative overflow-hidden border-y border-current/10 py-7 lg:py-9 ${className}`}
      aria-hidden
    >
      <div
        className="flex whitespace-nowrap animate-marquee"
        style={{ animationDuration: `${speed}s` }}
      >
        {repeated.map((w, i) => (
          <span
            key={i}
            className="font-display font-light text-3xl lg:text-5xl tracking-[-0.02em] mx-8 lg:mx-14 inline-flex items-center gap-8 lg:gap-14"
          >
            {w}
            <span className={`${accent} text-xl lg:text-3xl font-sora`}>✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
