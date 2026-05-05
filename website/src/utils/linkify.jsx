import React from 'react'
import { Link } from 'react-router-dom'

/**
 * linkifyProse — Wikipedia-style first-occurrence-per-paragraph term linker.
 *
 * Given a long string of body prose (paragraphs separated by `\n\n`),
 * returns a React fragment where the FIRST occurrence in each paragraph
 * of any term in the dictionary is wrapped in a <Link> (or <a> for download).
 *
 * Rules:
 *  - First occurrence per paragraph only, per-term
 *  - Earliest-position match wins when multiple terms could fit
 *  - Original casing preserved in the visible link text
 *  - Word-boundary aware (won't match inside another word)
 *  - PDF/download links use <a download> rather than <Link>
 *  - Returns the input unchanged if it's not a non-empty string
 *
 * Variant 'dark' uses .prose-link-dark for dark-surface usage.
 */

// Term dictionary — order MATTERS for ties: longer / more specific terms first.
// Each entry: { pattern: RegExp (case-insensitive, no /g), to: route, download?: bool }
// Patterns are intentionally narrow — singular & plural inflections handled by alternation.
const TERMS = [
  // === Stretch ceiling general ===
  { pattern: /\bstretch\s+ceilings?\b/i, to: '/services/stretch-ceiling-installation' },
  { pattern: /\bstretch\s+membranes?\b/i, to: '/services/stretch-ceiling-installation' },
  { pattern: /\bstretch\s+ceiling\s+installation\b/i, to: '/services/stretch-ceiling-installation' },

  // === Lighting service ===
  { pattern: /\blighting\s+solutions\b/i, to: '/services/lighting-solutions' },
  { pattern: /\barchitectural\s+lighting\b/i, to: '/services/lighting-solutions' },
  { pattern: /\bLED\s+architecture\b/i, to: '/services/lighting-solutions' },
  { pattern: /\blighting\s+design\b/i, to: '/services/lighting-solutions' },

  // === Consultation ===
  { pattern: /\bdesign\s+consultation\b/i, to: '/services/design-consultation' },
  { pattern: /\bconsultation\b/i, to: '/services/design-consultation' },

  // === Maintenance ===
  { pattern: /\bmaintenance\s+and\s+support\b/i, to: '/services/maintenance-support' },
  { pattern: /\bafter[-\s]sales\b/i, to: '/services/maintenance-support' },
  { pattern: /\bmaintenance\b/i, to: '/services/maintenance-support' },

  // === Finishes / products (longer first) ===
  { pattern: /\bprinted\s+photographic\s+membranes?\b/i, to: '/products/printed-photographic-membrane' },
  { pattern: /\bphotographic\s+membranes?\b/i, to: '/products/printed-photographic-membrane' },
  { pattern: /\btranslucent\s+backlit\s+membranes?\b/i, to: '/products/translucent-backlit-membrane' },
  { pattern: /\bbacklit\s+membranes?\b/i, to: '/products/translucent-backlit-membrane' },
  { pattern: /\b3D\s+sculptural\s+membranes?\b/i, to: '/products/3d-sculptural-membrane' },
  { pattern: /\bsculptural\s+membranes?\b/i, to: '/products/3d-sculptural-membrane' },
  { pattern: /\bacoustic\s+micro[-\s]?perforated\s+membranes?\b/i, to: '/products/acoustic-microperforated-membrane' },
  { pattern: /\bgloss\s+lacquer\s+membranes?\b/i, to: '/products/gloss-lacquer-membrane' },
  { pattern: /\bmatte\s+stretch\s+membranes?\b/i, to: '/products/matte-stretch-membrane' },
  { pattern: /\bsatin\s+stretch\s+membranes?\b/i, to: '/products/satin-stretch-membrane' },
  { pattern: /\bsuede\s+(?:velvet\s+)?membranes?\b/i, to: '/products/suede-velvet-membrane' },
  { pattern: /\bmirror\s+(?:finish\s+)?membranes?\b/i, to: '/products/mirror-finish-membrane' },

  // Single-finish terms (used when ABOUT a finish, not when "matte" is incidental.
  // Patterns require the word to be near "finish" or "membrane" to reduce noise.)
  { pattern: /\bmatte\s+(?:finish|ceiling|membrane)\b/i, to: '/products/matte-stretch-membrane' },
  { pattern: /\bsatin\s+(?:finish|ceiling|membrane)\b/i, to: '/products/satin-stretch-membrane' },
  { pattern: /\bgloss\s+(?:finish|ceiling|membrane|lacquer)\b/i, to: '/products/gloss-lacquer-membrane' },
  { pattern: /\btranslucent\s+(?:finish|ceiling|membrane)\b/i, to: '/products/translucent-backlit-membrane' },
  { pattern: /\bprinted\s+(?:finish|ceiling|membrane)\b/i, to: '/products/printed-photographic-membrane' },
  { pattern: /\bsculptural\s+(?:finish|ceiling)\b/i, to: '/products/3d-sculptural-membrane' },
  { pattern: /\bacoustic\s+(?:finish|ceiling|membrane)\b/i, to: '/products/acoustic-microperforated-membrane' },
  { pattern: /\bmirror\s+(?:finish|ceiling)\b/i, to: '/products/mirror-finish-membrane' },
  { pattern: /\bsuede\s+(?:finish|ceiling)\b/i, to: '/products/suede-velvet-membrane' },
  { pattern: /\bbacklit\b/i, to: '/products/translucent-backlit-membrane' },

  // === Studio / location ===
  { pattern: /\bBelgravia,\s*Harare\b/i, to: '/contact' },
  { pattern: /\bour\s+studio\b/i, to: '/contact' },

  // === Brand identity / about ===
  { pattern: /\bZimbabwe['’]s\s+first\b/i, to: '/about' },
  { pattern: /\bSouthern\s+Africa\b/i, to: '/about' },
  { pattern: /\bregional\s+first\b/i, to: '/about' },

  // === Portfolio / projects ===
  { pattern: /\bour\s+work\b/i, to: '/portfolio' },
  { pattern: /\bportfolio\b/i, to: '/portfolio' },
  { pattern: /\bcase\s+stud(?:y|ies)\b/i, to: '/projects' },
  { pattern: /\bprojects\b/i, to: '/projects' },

  // === FAQ ===
  { pattern: /\bcommon\s+questions\b/i, to: '/faq' },
  { pattern: /\bFAQ\b/i, to: '/faq' },

  // === Document downloads ===
  { pattern: /\bcompany\s+profile\b/i, to: '/brand/docs/company-profile.pdf', download: true },
  { pattern: /\bstretch\s+ceilings\s+guide\b/i, to: '/brand/docs/stretch-ceilings-guide.pdf', download: true },
  { pattern: /\btechnical\s+guide\b/i, to: '/brand/docs/stretch-ceilings-guide.pdf', download: true },
]

export const TERM_COUNT = TERMS.length

/**
 * Find the earliest first-occurrence match in a paragraph.
 * Returns { index, length, term } or null.
 */
function findFirstMatch(paragraph) {
  let best = null
  for (const term of TERMS) {
    // Build a fresh non-global RegExp from each term to test against the paragraph.
    const m = paragraph.match(term.pattern)
    if (m && m.index !== undefined) {
      if (!best || m.index < best.index || (m.index === best.index && m[0].length > best.length)) {
        best = { index: m.index, length: m[0].length, term, matched: m[0] }
      }
    }
  }
  return best
}

/**
 * Recursively process a paragraph, applying ONE link per term per paragraph.
 * On each pass we pick the earliest match across ALL remaining terms, wrap it,
 * then recurse on the substring AFTER the match using a reduced term set.
 *
 * `availableTerms` lets us avoid linking the SAME term twice in one paragraph
 * while still allowing a different term to link later in the same paragraph.
 */
function linkifyParagraph(paragraph, variant, keyPrefix) {
  const out = []
  let remaining = paragraph
  let usedTerms = new Set()
  let i = 0
  // Hard cap to prevent infinite loops on pathological input.
  while (i < 12) {
    let best = null
    for (const term of TERMS) {
      if (usedTerms.has(term)) continue
      const m = remaining.match(term.pattern)
      if (m && m.index !== undefined) {
        if (!best || m.index < best.index || (m.index === best.index && m[0].length > best.length)) {
          best = { index: m.index, length: m[0].length, term, matched: m[0] }
        }
      }
    }
    if (!best) break
    // Push everything before the match as plain text.
    if (best.index > 0) out.push(remaining.slice(0, best.index))
    // Push the link.
    const linkClass = variant === 'dark' ? 'prose-link-dark' : 'prose-link'
    if (best.term.download) {
      out.push(
        <a
          key={`${keyPrefix}-l${i}`}
          href={best.term.to}
          download
          className={linkClass}
        >
          {best.matched}
        </a>
      )
    } else {
      out.push(
        <Link
          key={`${keyPrefix}-l${i}`}
          to={best.term.to}
          className={linkClass}
        >
          {best.matched}
        </Link>
      )
    }
    // Advance.
    remaining = remaining.slice(best.index + best.length)
    usedTerms.add(best.term)
    i += 1
  }
  if (remaining) out.push(remaining)
  return out
}

/**
 * linkifyProse(text, options?) → React fragment
 *
 * options.variant: 'light' (default) | 'dark'
 * options.shortMin: minimum char count to bother linking (default 60)
 *   — anything shorter is treated as a label/caption and returned as plain text
 */
export function linkifyProse(text, options = {}) {
  const { variant = 'light', shortMin = 60 } = options

  if (typeof text !== 'string' || text.length === 0) return text
  // Skip very short strings — captions, labels, short tags.
  if (text.length < shortMin) return text

  // Split on double-newline paragraph boundaries.
  const paragraphs = text.split(/\n\n+/)

  return (
    <>
      {paragraphs.map((p, pi) => {
        const linked = linkifyParagraph(p, variant, `p${pi}`)
        return (
          <React.Fragment key={`para-${pi}`}>
            {linked}
            {pi < paragraphs.length - 1 ? '\n\n' : null}
          </React.Fragment>
        )
      })}
    </>
  )
}

/**
 * Convenience: render a string that may have \n\n paragraph breaks as
 * separate <p> tags, with prose-linking applied per paragraph.
 */
export function ProseParagraphs({ text, className = '', variant = 'light' }) {
  if (typeof text !== 'string' || !text.trim()) return null
  const paragraphs = text.split(/\n\n+/)
  return (
    <>
      {paragraphs.map((p, pi) => (
        <p key={`pp-${pi}`} className={className}>
          {p.length < 60 ? p : linkifyParagraph(p, variant, `pp${pi}`)}
        </p>
      ))}
    </>
  )
}

export default linkifyProse
