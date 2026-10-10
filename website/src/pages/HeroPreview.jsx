import React from 'react'
import EditorialHero from '../components/home/EditorialHero'
import { useSEO } from '../utils/seo'

/* Standalone review route for the chosen landing hero. The hero itself now
   lives in components/home/EditorialHero and is also the site's main hero.
   Kept out of search results so it never competes with the real homepage. */
export default function HeroPreview() {
  useSEO({ title: 'Hero preview', path: '/hero-preview', robots: 'noindex, nofollow' })
  return <EditorialHero />
}
