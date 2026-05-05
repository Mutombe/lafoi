import React from 'react'

/**
 * <Logo />
 * Full-colour wordmark on light surfaces; solid white wordmark on dark surfaces.
 * No plates, no backdrops — the same approach Apple, Nike, Tesla use.
 *
 * Props
 *   tone     "light" → render white silhouette (use on dark BG)
 *            "dark"  → render full colour (use on light BG)
 *   variant  "wordmark" (default, /logo2.png) | "mark" (/logo.png)
 *   className extra wrapper classes
 *   imgClassName extra <img/> classes — usually for height
 *   alt       default "La Foi Designs"
 */
export default function Logo({
  tone = 'dark',
  variant = 'wordmark',
  className = '',
  imgClassName = 'h-9 sm:h-10 lg:h-11 w-auto',
  alt = 'La Foi Designs',
}) {
  const src = variant === 'mark' ? '/logo.png' : '/logo2.png'
  const isLight = tone === 'light'

  return (
    <span className={`inline-flex items-center ${className}`.trim()}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={`${imgClassName} block select-none ${isLight ? 'logo-on-dark' : ''}`.trim()}
      />
    </span>
  )
}
