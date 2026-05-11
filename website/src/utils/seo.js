import { useEffect } from 'react'

/**
 * SEO helper - keeps `<title>`, meta description/keywords, OG/Twitter tags,
 * canonical link, and JSON-LD structured data in sync with each route.
 *
 *   useSEO({
 *     title: 'About La Foi Designs | Stretch Ceiling Experts',
 *     description: '…',
 *     path: '/about',
 *     image: '/brand/images/30.png',     // optional, defaults to /og-image.jpg
 *     jsonLd: [breadcrumbsLd, serviceLd] // optional, array OR single object
 *   })
 *
 * Two site-wide JSON-LD blocks (Organization + WebSite) are emitted on every
 * page automatically. Page-specific blocks layer on top.
 */
const BASE_URL = 'https://lafoidesigns.co.zw'
const COMPANY_NAME = 'La Foi Designs'
const COMPANY_DESC =
  "Zimbabwe's stretch ceiling and architectural lighting specialist. Premium PVC and fabric membranes, custom lighting integration, interior design, flooring, and epoxy systems. Founded January 2024, Belgravia, Harare."
const COMPANY_PHONE_PRIMARY = '+263782931472'
const COMPANY_EMAIL = 'admin@lafoidesigns.co.zw'

const defaultMeta = {
  title: `${COMPANY_NAME} | Stretch Ceilings & Architectural Lighting | Zimbabwe`,
  description: COMPANY_DESC,
  keywords:
    'stretch ceilings Zimbabwe, stretch ceilings Harare, architectural lighting, custom lighting, interior design, flooring, epoxy, La Foi Designs, ceiling lighting Zimbabwe',
  image: '/og-image.jpg',
}

// Site-wide structured data blocks emitted on every page.
const ORGANIZATION_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${BASE_URL}/#organization`,
  name: COMPANY_NAME,
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  description: COMPANY_DESC,
  email: COMPANY_EMAIL,
  telephone: [COMPANY_PHONE_PRIMARY],
  foundingDate: '2024-01',
  areaServed: { '@type': 'Country', name: 'Zimbabwe' },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Suite 26, 6 Chelmsford Road, Belgravia',
    addressLocality: 'Harare',
    addressRegion: 'Harare',
    addressCountry: 'ZW',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: COMPANY_PHONE_PRIMARY,
      contactType: 'customer service',
      email: COMPANY_EMAIL,
      areaServed: 'ZW',
      availableLanguage: ['en'],
    },
  ],
}

const WEBSITE_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${BASE_URL}/#website`,
  name: COMPANY_NAME,
  url: BASE_URL,
  inLanguage: 'en',
  publisher: { '@id': `${BASE_URL}/#organization` },
}

const LOCAL_BUSINESS_LD = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${BASE_URL}/#localbusiness`,
  name: COMPANY_NAME,
  url: BASE_URL,
  image: `${BASE_URL}/og-image.jpg`,
  telephone: COMPANY_PHONE_PRIMARY,
  email: COMPANY_EMAIL,
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Suite 26, 6 Chelmsford Road, Belgravia',
    addressLocality: 'Harare',
    addressRegion: 'Harare',
    addressCountry: 'ZW',
  },
  areaServed: 'Zimbabwe',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '17:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Saturday',
      opens: '09:00',
      closes: '13:00',
    },
  ],
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -17.7846,
    longitude: 31.0489,
  },
  sameAs: [],
}

export const SITE_BASE_URL = BASE_URL

// Element-id prefix so we can find + remove our managed JSON-LD on route change.
const LD_ID_PREFIX = 'lafoi-jsonld-'

function setMetaTag(name, content, isProperty = false) {
  const attr = isProperty ? 'property' : 'name'
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLinkTag(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function clearManagedJsonLd() {
  document.querySelectorAll(`script[id^="${LD_ID_PREFIX}"]`).forEach((el) => el.remove())
}

function injectJsonLd(blocks) {
  blocks.forEach((block, idx) => {
    if (!block) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = `${LD_ID_PREFIX}${idx}`
    script.text = JSON.stringify(block)
    document.head.appendChild(script)
  })
}

export function useSEO({ title, description, keywords, image, path = '', jsonLd } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${COMPANY_NAME}` : defaultMeta.title
    const fullDescription = description || defaultMeta.description
    const fullKeywords = keywords || defaultMeta.keywords
    const fullImage = image
      ? (image.startsWith('http') ? image : `${BASE_URL}${image.startsWith('/') ? image : '/' + image}`)
      : `${BASE_URL}${defaultMeta.image}`
    const fullUrl = `${BASE_URL}${path || ''}`

    document.title = fullTitle

    setMetaTag('description', fullDescription)
    setMetaTag('keywords', fullKeywords)
    setMetaTag('og:title', fullTitle, true)
    setMetaTag('og:description', fullDescription, true)
    setMetaTag('og:image', fullImage, true)
    setMetaTag('og:url', fullUrl, true)
    setMetaTag('og:type', 'website', true)
    setMetaTag('og:site_name', COMPANY_NAME, true)
    setMetaTag('og:locale', 'en_ZW', true)
    setMetaTag('twitter:card', 'summary_large_image')
    setMetaTag('twitter:title', fullTitle)
    setMetaTag('twitter:description', fullDescription)
    setMetaTag('twitter:image', fullImage)

    setLinkTag('canonical', fullUrl)

    // Replace JSON-LD: site-wide Organization + WebSite + LocalBusiness, then any
    // page-specific blocks (BreadcrumbList, Service, FAQPage, etc.).
    clearManagedJsonLd()
    const pageBlocks = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []
    // LocalBusiness is heavy, only emit on commercial / contact / service pages.
    const isCommercial = !path || path === '/' || path === '/contact' || path.startsWith('/services')
    injectJsonLd([
      ORGANIZATION_LD,
      WEBSITE_LD,
      ...(isCommercial ? [LOCAL_BUSINESS_LD] : []),
      ...pageBlocks,
    ])

    return () => {
      // Don't restore the default title on unmount; the next route's useSEO
      // call will set its own. Restoring causes a brief flicker.
    }
  }, [title, description, keywords, image, path, JSON.stringify(jsonLd)])
}

/* ============================================================================
   JSON-LD builders, call these from page components
   ========================================================================= */

export function breadcrumbsLd(items) {
  // items: [{ name, path }]
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${BASE_URL}${it.path}`,
    })),
  }
}

export function serviceLd({ name, slug, description, image }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    serviceType: name,
    url: `${BASE_URL}/services/${slug}`,
    image: image ? (image.startsWith('http') ? image : `${BASE_URL}${image}`) : undefined,
    provider: { '@id': `${BASE_URL}/#organization` },
    areaServed: { '@type': 'Country', name: 'Zimbabwe' },
  }
}

export function articleLd({ title, slug, description, datePublished, image, author = COMPANY_NAME }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    datePublished,
    image: image ? (image.startsWith('http') ? image : `${BASE_URL}${image}`) : undefined,
    author: { '@type': 'Organization', name: author },
    publisher: { '@id': `${BASE_URL}/#organization` },
    mainEntityOfPage: `${BASE_URL}/blog/${slug}`,
  }
}

export function faqLd(items) {
  // items: [{ q, a }]
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  }
}

/* Legacy helper, kept for callers that haven't migrated. */
export function generateStructuredData(type, data = {}) {
  if (type === 'organization') return { ...ORGANIZATION_LD, ...data }
  if (type === 'service') return { ...serviceLd({ name: 'Service', slug: '', description: '' }), ...data }
  return null
}
