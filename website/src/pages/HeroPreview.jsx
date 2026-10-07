import React from 'react'
import EditorialHero from '../components/home/EditorialHero'

/* Standalone review route for the chosen landing hero. The hero itself now
   lives in components/home/EditorialHero and is also the site's main hero. */
export default function HeroPreview() {
  return <EditorialHero />
}
