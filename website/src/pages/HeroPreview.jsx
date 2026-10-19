import React from 'react'
import SiteNav from '../components/layout/SiteNav'
import EditorialHero from '../components/home/EditorialHero'
import { useSEO } from '../utils/seo'

/* Standalone review route for the chosen landing hero. The hero body lives in
   components/home/EditorialHero; the nav is the shared SiteNav, same as the
   live site. Kept out of search results so it never competes with the real
   homepage. */
export default function HeroPreview() {
  useSEO({ title: 'Hero preview', path: '/hero-preview', robots: 'noindex, nofollow' })
  return (
    <>
      <SiteNav />
      <EditorialHero />
    </>
  )
}
