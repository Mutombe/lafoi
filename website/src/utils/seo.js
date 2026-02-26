import React from 'react';
import { useEffect } from 'react'

const BASE_URL = 'https://lafoidesigns.co.zw'

const defaultMeta = {
  title: 'La Foi Designs | Luxury Stretch Ceilings & Custom Lighting | Zimbabwe',
  description: "Zimbabwe's premier stretch ceiling and custom lighting solutions provider. German & Estonian engineered products transforming interior spaces with elegance since 2024.",
  keywords: 'stretch ceilings, custom lighting, interior design, Zimbabwe, luxury ceilings, LED lighting, La Foi Designs, Harare',
  image: '/og-image.jpg',
}

export function useSEO({ title, description, keywords, image, path = '' }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | La Foi Designs` : defaultMeta.title
    const fullDescription = description || defaultMeta.description
    const fullKeywords = keywords || defaultMeta.keywords
    const fullImage = image || defaultMeta.image
    const fullUrl = `${BASE_URL}${path}`

    document.title = fullTitle

    const setMeta = (name, content, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('description', fullDescription)
    setMeta('keywords', fullKeywords)
    setMeta('og:title', fullTitle, true)
    setMeta('og:description', fullDescription, true)
    setMeta('og:image', fullImage, true)
    setMeta('og:url', fullUrl, true)
    setMeta('og:type', 'website', true)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', fullDescription)
    setMeta('twitter:image', fullImage)

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', fullUrl)

    return () => {
      document.title = defaultMeta.title
    }
  }, [title, description, keywords, image, path])
}

export function generateStructuredData(type, data) {
  const schemas = {
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'La Foi Designs',
      url: BASE_URL,
      logo: `${BASE_URL}/logo.png`,
      description: defaultMeta.description,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Suite 26, 6 Chelmsford Road, Belgravia',
        addressLocality: 'Harare',
        addressCountry: 'ZW',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+263712326951',
        contactType: 'customer service',
      },
      foundingDate: '2024-01',
      ...data,
    },
    service: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      provider: {
        '@type': 'Organization',
        name: 'La Foi Designs',
      },
      ...data,
    },
  }

  return schemas[type] || null
}
