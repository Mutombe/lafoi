import {
  Star, Sparkle, Camera, Newspaper,
  SquaresFour, Lightbulb, PaintBrush, Cube, Palette, Package,
  Phone, Briefcase, Question,
} from '@phosphor-icons/react'

/* ===========================================================================
   Single source of truth for the primary site navigation.

   Both the global Navbar (shown on every page except the homepage) and the
   homepage editorial hero header render from this list, so the two can never
   drift out of sync. Add or change a link here and it updates everywhere.
   =========================================================================== */

export const navGroups = [
  {
    label: 'Discover',
    items: [
      { name: 'Official Launch', path: '/launch', icon: Star, desc: 'Our company launch — 13 June 2026' },
      { name: 'Our Story', path: '/about', icon: Sparkle, desc: 'The journey behind La Foi' },
      { name: 'Portfolio', path: '/portfolio', icon: Camera, desc: 'Stunning transformations' },
      { name: 'Projects', path: '/projects', icon: Camera, desc: 'Case studies & transformations' },
      { name: 'Blog & Insights', path: '/blog', icon: Newspaper, desc: 'Design trends & tips' },
    ],
  },
  {
    label: 'Services',
    items: [
      { name: 'Stretch Ceilings',  path: '/services/stretch-ceiling-installation', icon: SquaresFour, desc: 'Premium membrane systems' },
      { name: 'Lighting Solutions', path: '/services/lighting-solutions',          icon: Lightbulb,   desc: 'Architectural illumination' },
      { name: 'Interior Design',    path: '/services/interior-design',             icon: PaintBrush,  desc: 'Concept to completion' },
      { name: '3D Digital Twins',   path: '/services/3d-digital-twins',            icon: Cube,        desc: 'Matterport spatial capture' },
      { name: 'All Services',       path: '/services',                             icon: Palette,     desc: 'Full service catalog' },
      { name: 'Finishes & Products', path: '/portfolio',                            icon: Package,     desc: 'Membranes, lighting & accessories' },
    ],
  },
  {
    label: 'Connect',
    items: [
      { name: 'Contact Us', path: '/contact', icon: Phone, desc: 'Start your project' },
      { name: 'Careers', path: '/careers', icon: Briefcase, desc: 'Join our team' },
      { name: 'FAQs', path: '/faq', icon: Question, desc: 'Common questions' },
    ],
  },
]
