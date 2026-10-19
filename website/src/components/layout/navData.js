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

// Flat index behind the ⌘K / search field in the nav.
export const searchableContent = [
  { title: 'Stretch Ceiling Installation', path: '/services/stretch-ceiling-installation', section: 'Services', keywords: 'stretch ceiling pvc fabric membrane install' },
  { title: 'Lighting Solutions', path: '/services/lighting-solutions', section: 'Services', keywords: 'led lighting custom lights backlit fibre optic' },
  { title: 'Interior Design', path: '/services/interior-design', section: 'Services', keywords: 'interior design space planning palette furniture mood board styling' },
  { title: 'Design Consultation & Customisation', path: '/services/design-consultation', section: 'Services', keywords: 'design consultation custom site visit sampling' },
  { title: 'Maintenance & Support', path: '/services/maintenance-support', section: 'Services', keywords: 'maintenance support warranty cleaning repair' },
  { title: '3D Digital Twins', path: '/services/3d-digital-twins', section: 'Services', keywords: 'matterport 3d mapping digital twin virtual tour walkthrough scan spatial capture dollhouse floor plan measurement' },
  { title: 'About La Foi Designs', path: '/about', section: 'Company', keywords: 'about company history story team' },
  { title: 'Our Portfolio', path: '/portfolio', section: 'Projects', keywords: 'portfolio gallery projects work showcase' },
  { title: 'Contact Us', path: '/contact', section: 'Connect', keywords: 'contact reach phone email address' },
  { title: 'Career Opportunities', path: '/careers', section: 'Connect', keywords: 'careers jobs hiring work opportunities' },
  { title: 'Frequently Asked Questions', path: '/faq', section: 'Support', keywords: 'faq questions help support answers' },
  { title: 'Blog & Design Insights', path: '/blog', section: 'Content', keywords: 'blog articles news design trends' },
  { title: 'Why La Foi Designs', path: '/about', section: 'Company', keywords: 'why pioneer first stretch ceiling zimbabwe' },
  { title: 'Stretch Ceiling Technical Guide', path: '/brand/docs/stretch-ceilings-guide.pdf', section: 'Resources', keywords: 'pdf technical guide pvc fabric membrane fire rating' },
  { title: 'Residential Projects', path: '/portfolio', section: 'Projects', keywords: 'residential home house living room bedroom' },
  { title: 'Commercial Installations', path: '/portfolio', section: 'Projects', keywords: 'commercial office hotel restaurant retail' },
  { title: 'Free Consultation', path: '/contact', section: 'Connect', keywords: 'consultation free quote estimate' },
  { title: 'All Products & Materials', path: '/portfolio', section: 'Products', keywords: 'products catalog catalogue range materials membrane' },
  { title: 'Matte Stretch Ceiling', path: '/products/matte-stretch-membrane', section: 'Products', keywords: 'matte ceiling membrane pvc' },
  { title: 'Glossy Stretch Ceiling', path: '/products/gloss-lacquer-membrane', section: 'Products', keywords: 'gloss lacquer mirror reflective ceiling' },
  { title: 'Translucent Ceiling', path: '/products/translucent-backlit-membrane', section: 'Products', keywords: 'translucent backlit luminous ceiling' },
  { title: 'Printed Ceiling', path: '/products/printed-photographic-membrane', section: 'Products', keywords: 'printed photographic custom artwork ceiling' },
  { title: 'Star Ceiling', path: '/products/star-ceiling-membrane', section: 'Products', keywords: 'star ceiling fibre optic starfield night sky bedroom cinema spa' },
  { title: 'Fibre-Optic Starfield Kit', path: '/products/fiber-optic-starfield', section: 'Products', keywords: 'fibre fiber optic star starry sky ceiling lighting' },
  { title: 'Linear Lights', path: '/products/linear-led-cove', section: 'Products', keywords: 'linear lights led cove perimeter strip continuous stretch ceiling' },
  { title: 'Magnetic Track Lights', path: '/products/magnetic-track-system', section: 'Products', keywords: 'magnetic track lights 48v rail spot pendant linear reconfigurable' },
  { title: 'Back-Lighting', path: '/products/back-lighting', section: 'Products', keywords: 'back lighting hidden led concealed mirror vanity headboard wall feature reveal' },
  { title: 'Shadow Edge Lighting', path: '/products/shadow-edge-lighting', section: 'Products', keywords: 'shadow edge cove perimeter reveal floating ceiling halo wash' },
  { title: 'Project Case Studies', path: '/projects', section: 'Projects', keywords: 'projects case studies transformations archive' },
  { title: 'Shop, Companion Pieces', path: '/shop', section: 'Shop', keywords: 'shop store buy purchase order lamp humidifier accessories cart whatsapp' },
  { title: 'Lamps, Pendants, Sconces, Floor Lamps', path: '/shop', section: 'Shop', keywords: 'lamps pendant sconce floor table ceiling brass onyx light' },
  { title: 'Humidifiers', path: '/shop', section: 'Shop', keywords: 'humidifier mist ceramic tower smart compact dry climate' },
  { title: 'Lighting Accessories', path: '/shop', section: 'Shop', keywords: 'dimmer led module magnetic track adapter accessory' },
  { title: 'Care Kits, Membrane & LED Polish', path: '/shop', section: 'Shop', keywords: 'care kit cleaning microfibre polish membrane stretch ceiling maintenance' },
]
