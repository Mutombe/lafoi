# La Foi Designs - Project Structure

## Source Files
- `website/src/App.jsx` - Router with lazy-loaded pages
- `website/src/index.css` - Tailwind v4 @theme config + custom CSS
- `website/src/main.jsx` - Entry point

## Pages
- `website/src/pages/Home.jsx` - Hero, partners marquee, about preview, services showcase, stats, portfolio, process, testimonials, CTA
- `website/src/pages/About.jsx` - Hero, mission, timeline, values, partners, team, CTA
- `website/src/pages/Services.jsx` - Overview + ServiceDetail for individual services
- `website/src/pages/Portfolio.jsx` - Masonry gallery with filter + lightbox
- `website/src/pages/Contact.jsx` - Hero, form + contact info, map
- `website/src/pages/FAQ.jsx` - Category tabs, accordion items, CTA
- `website/src/pages/Careers.jsx` - Hero, perks, job cards, general CTA
- `website/src/pages/Blog.jsx` - Featured post + card grid

## Components
- `website/src/components/layout/Layout.jsx` - Shell with navbar, footer, cookie consent, WhatsApp button, policy modals
- `website/src/components/layout/Navbar.jsx` - Fixed header with dark/light hero awareness, search, mobile menu
- `website/src/components/layout/Footer.jsx` - Newsletter, links, contact info, socials
- `website/src/components/ui/AnimatedSection.jsx` - Scroll-triggered motion wrapper
- `website/src/components/ui/OptimizedImage.jsx` - Lazy image with placeholder
- `website/src/components/shared/ScrollToTop.jsx` - Route change scroll handler
- `website/src/components/shared/LoadingScreen.jsx` - Suspense fallback

## Utils
- `website/src/utils/seo.js` - useSEO hook for page titles/descriptions
