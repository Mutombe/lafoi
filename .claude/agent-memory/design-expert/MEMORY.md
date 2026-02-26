# La Foi Designs - Design Memory

## Project Overview
- React + Tailwind CSS v4 + Framer Motion website
- Zimbabwe's first stretch ceiling and custom lighting company (Harare)
- Brand colors: green #1A8A2E, dark #111111, cream #FAFAF8
- Fonts: Sora (headings), DM Sans (body), Outfit (display)
- See [project-structure.md](./project-structure.md) for file details

## Design System
- Tailwind v4 with @theme directives in index.css (no tailwind.config.js)
- Custom color tokens: lafoi-green, lafoi-green-light, lafoi-green-dark, lafoi-dark, lafoi-cream, lafoi-gray
- Border radius: rounded-2xl for cards, rounded-3xl for hero elements, rounded-full for buttons/pills
- Max width: max-w-[1440px] for content containers
- Custom CSS classes: .glass, .glass-dark, .mesh-gradient-1, .mesh-gradient-hero, .text-gradient, .grid-pattern, .dot-pattern

## Navbar Behavior
- Dark hero pages: /, /portfolio, /services, /faq, /careers (and /services/* subpages)
- Light hero pages: /about, /contact, /blog
- Uses isLightText prop to toggle white/dark text on nav items
- Scrolled state applies .glass class (white glassmorphism)

## Key Components
- OptimizedImage: lazy loading with IntersectionObserver, placeholder shimmer
- AnimatedSection: Framer Motion scroll-triggered animations (up/down/left/right)
- StaggerContainer + StaggerItem: Staggered reveal animations
- Layout: includes scroll progress bar, cookie consent, WhatsApp button, policy modals

## WhatsApp Button
- Fixed bottom-right, z-[140], links to wa.me/263712326951
- Green #25D366, animated entrance, pulse ring, hover scale

## Image Sources
- All images from Unsplash API (Client-ID in instructions)
- Key verified photos: 1638284457192, 1767203330128, 1758194090785, 1639663742190, 1742440710226, 1758691736975, 1648858308067, 1634146601607, 1595513279524, 1768270181430, 1730367019975, 1765434670017, 1618259715220
