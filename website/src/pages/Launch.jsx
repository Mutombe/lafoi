import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight, DownloadSimple, FilePdf, MapPin, CalendarBlank, Clock,
  Scissors, Microphone, Star, ArrowUpRight,
} from '@phosphor-icons/react'
import AnimatedSection from '../components/ui/AnimatedSection'
import SectionDivider from '../components/ui/SectionDivider'
import { useSEO, breadcrumbsLd } from '../utils/seo'

/* ============================================================================
   La Foi Designs — Official Company Launch
   June 13, 2026 · 6 Chelmsford, Belgravia · Cecilia Business Center, Harare
   Content sourced from the official program booklet.
   ========================================================================= */

const BOOKLET_URL = '/brand/docs/program-booklet.pdf'
const LAUNCH_VIDEO = '/brand/videos/launch.mp4'

const EVENT = {
  date: 'Friday, 13 June 2026',
  arrival: 'Guests arrive 17:15',
  venue: 'Cecilia Business Center',
  address: '6 Chelmsford Road, Belgravia, Harare',
}

const PROGRAM = [
  { time: '17:15', title: 'Guest Arrival & Registration', detail: 'Welcome drinks & networking' },
  { time: '18:00 – 18:20', title: 'Welcome & Opening Remarks', detail: 'The MC acknowledges VIPs and introduces the evening’s theme' },
  { time: '18:20 – 18:30', title: 'CEO Address', detail: 'Takudzwa Mhembere' },
  { time: '18:30 – 18:35', title: 'COO Address', detail: 'Ashley Tafirenyika' },
  { time: '18:35 – 18:42', title: 'Keynote Speaker', detail: 'Dr. Tinashe Manzungu' },
  { time: '18:42 – 18:52', title: 'Keynote Speaker', detail: 'Hon. K. D. Mnangagwa' },
  { time: '18:52 – 19:12', title: 'Guest of Honour & Ribbon Cutting', detail: 'Hon. Tinoda Machakaire', highlight: true },
  { time: '19:12 – 19:17', title: 'Vote of Thanks', detail: 'Faith Mhembere — Managing Director' },
  { time: '19:17 – 20:00', title: 'Canapés & Refreshments', detail: '' },
  { time: '20:00 – 20:20', title: '“Live-Ceiling” Gallery', detail: 'An immersive walk-through of our work' },
  { time: '20:30', title: 'Departure', detail: '' },
]

const PEOPLE = [
  {
    name: 'Maimba Mapuranga',
    role: 'Master of Ceremony',
    org: 'Founder, Kutting Edge Media & Events',
    tag: 'Host',
    icon: Microphone,
    bio: 'An accomplished Zimbabwean media personality, communications specialist and entrepreneur, Maimba has hosted some of the country’s most prestigious corporate, government and diplomatic events. Known for his commanding stage presence and ability to connect with diverse audiences, he is one of Zimbabwe’s leading event hosts.',
  },
  {
    name: 'Takudzwa Mhembere',
    role: 'CEO’s Address',
    org: 'CEO & Co-Founder, La Foi Designs',
    tag: 'Leadership',
    icon: Star,
    bio: 'The visionary entrepreneur behind La Foi Designs — the pioneering force introducing stretch ceiling technology to Africa. Holding a BSc in Business Management & Marketing and an MSc in Supply Chain & Logistics Management, Takudzwa is engineering Africa’s interior revolution from the top down, bringing world-class European technology to Zimbabwe’s residential, commercial and hospitality sectors.',
  },
  {
    name: 'Ashley Tafirenyika',
    role: 'COO’s Address',
    org: 'Chief Operating Officer, La Foi Designs',
    tag: 'Leadership',
    icon: Star,
    bio: 'The engine behind La Foi Designs’ operational excellence. A BSc graduate in Business Management & Entrepreneurship from Chinhoyi University of Technology, Ashley blends strategic thinking with a boots-on-the-ground approach — ensuring every project is delivered with precision, speed and an uncompromising standard of quality. Where the CEO sets the vision, Ashley makes it happen.',
  },
  {
    name: 'Dr. Tinashe Manzungu',
    role: 'Keynote Speaker',
    org: 'CEO, Zimbuild Property Investments · Group Chairman, TM Group',
    tag: 'Keynote',
    icon: Microphone,
    bio: 'One of Zimbabwe’s most prominent entrepreneurs, with a diversified empire spanning construction, property development, financial services and health insurance. President of the Zimbabwe Building Contractors Association and a former President of the Zimbabwe National Chamber of Commerce, he has represented Africa at platforms including the UK House of Lords. He holds an honorary doctorate in Business Administration.',
  },
  {
    name: 'Hon. K. D. Mnangagwa',
    role: 'Keynote Speaker',
    org: 'Deputy Minister of Finance & Investment Promotion',
    tag: 'Keynote',
    icon: Microphone,
    bio: 'A politician, entrepreneur and legal professional — one of the youngest serving ministers in government. Executive Director of Flame Lily Venture Capital and a Non-Executive Director of the National Building Society. He holds an LLB (Hons) from the University of Zimbabwe and a BSc in Business Administration (Actuarial Science) from Drake University, USA — placing him at the intersection of law, finance and investment policy.',
  },
  {
    name: 'Hon. Tinoda Machakaire',
    role: 'Guest of Honour',
    org: 'Minister of Youth Empowerment, Development & Vocational Training',
    tag: 'Guest of Honour',
    icon: Scissors,
    bio: 'A dynamic Zimbabwean politician, entrepreneur and youth champion. A self-made entrepreneur who founded TinMac Investments, he is a regional award-winning entrepreneur and philanthropist recognised for championing youth empowerment and vocational training nationally. His presence as Guest of Honour reflects his commitment to supporting indigenous enterprise and innovation in Zimbabwe’s growing economy.',
    featured: true,
  },
  {
    name: 'Faith Aritura Mhembere',
    role: 'Vote of Thanks',
    org: 'Co-Founder & Managing Director, La Foi Designs',
    tag: 'Leadership',
    icon: Star,
    bio: 'A dynamic professional whose work bridges healthcare, entrepreneurship and women’s empowerment. Trained in Podiatry at the University of Huddersfield in the UK, Faith is the Co-Founder and Managing Director of La Foi Designs. A woman of resilience, vision and purpose, she embodies the excellence of African women making a global impact — building businesses, restoring health and inspiring communities.',
  },
]

const initialsOf = (name) =>
  name.replace(/^(Dr\.|Hon\.)\s+/i, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

export default function Launch() {
  useSEO({
    title: 'Official Company Launch | La Foi Designs',
    description:
      'La Foi Designs official company launch — Friday 13 June 2026 at Cecilia Business Center, 6 Chelmsford Road, Belgravia, Harare. The evening introducing stretch ceiling technology to Africa. View the programme and download the booklet.',
    path: '/launch',
    image: '/brand/images/50.png',
    jsonLd: [
      breadcrumbsLd([
        { name: 'Home', path: '/' },
        { name: 'Official Launch', path: '/launch' },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'La Foi Designs — Official Company Launch',
        startDate: '2026-06-13T17:15:00+02:00',
        endDate: '2026-06-13T20:30:00+02:00',
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: 'Cecilia Business Center',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '6 Chelmsford Road, Belgravia',
            addressLocality: 'Harare',
            addressCountry: 'ZW',
          },
        },
        organizer: { '@type': 'Organization', name: 'La Foi Designs', url: 'https://lafoidesigns.com' },
        description: 'The official launch of La Foi Designs, introducing European stretch ceiling technology to Africa.',
      },
    ],
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      <LaunchHero />
      <SectionDivider shape="angular" from="dark" to="cream" />
      <Programme />
      <SectionDivider shape="s-curve" from="cream" to="cream" />
      <Speakers />
      <SectionDivider shape="big-wave" from="cream" to="dark" />
      <BookletCTA />
    </motion.div>
  )
}

/* ---------------------------------------------------------------- Hero --- */
function LaunchHero() {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-lafoi-dark text-white">
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        autoPlay muted loop playsInline preload="metadata"
        poster="/brand/images/50.png"
      >
        <source src={LAUNCH_VIDEO} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-lafoi-dark/70 via-lafoi-dark/55 to-lafoi-dark/90" />

      <div className="relative max-w-6xl mx-auto px-6 sm:px-8 py-24 w-full">
        <AnimatedSection>
          <div className="flex items-center gap-3 mb-6">
            <span className="block w-12 h-px bg-lafoi-green-light" />
            <p className="font-sora text-[11px] font-semibold tracking-[0.34em] uppercase text-lafoi-green-light">
              Official Company Launch
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <h1
            className="font-display tracking-[-0.03em] leading-[0.98] text-5xl sm:text-6xl lg:text-[5.2rem]"
            style={{ fontVariationSettings: '"opsz" 144' }}
          >
            <span className="block font-light">A new ceiling for</span>
            <span className="block italic font-light text-lafoi-green-light">Africa rises.</span>
          </h1>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <p className="mt-7 max-w-xl text-base lg:text-lg text-white/75 font-body font-light leading-[1.7]">
            Join us for the evening La Foi Designs opens its doors to the world — bringing world-class European
            stretch ceiling technology to Zimbabwe for the very first time.
          </p>
        </AnimatedSection>

        {/* Event facts */}
        <AnimatedSection delay={0.3}>
          <div className="mt-10 grid sm:grid-cols-3 gap-px rounded-2xl overflow-hidden border border-white/12 bg-white/[0.04] backdrop-blur-sm max-w-3xl">
            {[
              { icon: CalendarBlank, k: 'Date', v: EVENT.date, s: EVENT.arrival },
              { icon: MapPin, k: 'Venue', v: EVENT.venue, s: EVENT.address },
              { icon: Clock, k: 'Programme', v: 'From 18:00', s: 'Carries through to 20:30' },
            ].map((f) => (
              <div key={f.k} className="px-5 py-5 bg-white/[0.03]">
                <f.icon size={18} className="text-lafoi-green-light mb-3" />
                <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-white/45">{f.k}</p>
                <p className="font-display text-lg mt-1 leading-tight">{f.v}</p>
                <p className="text-xs text-white/55 mt-1">{f.s}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.4}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href={BOOKLET_URL} target="_blank" rel="noreferrer"
              className="group inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-lafoi-green text-white font-sora text-sm font-medium hover:bg-lafoi-green-light transition-colors"
            >
              <DownloadSimple size={16} weight="bold" /> Download the programme booklet
            </a>
            <a href="#programme" className="inline-flex items-center gap-2 text-sm font-sora text-white/80 hover:text-white">
              See the evening’s programme <ArrowRight size={14} />
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------- Programme --- */
function Programme() {
  return (
    <section id="programme" className="bg-lafoi-cream py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <AnimatedSection>
          <div className="flex items-center gap-3 mb-4">
            <span className="block w-10 h-px bg-lafoi-green/60" />
            <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">Order of proceedings</p>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl text-lafoi-dark tracking-tight">The evening’s programme</h2>
          <p className="mt-3 text-lafoi-gray font-body font-light">{EVENT.date} · {EVENT.venue}, {EVENT.address}</p>
        </AnimatedSection>

        <div className="mt-12 space-y-px rounded-3xl overflow-hidden border border-lafoi-dark/10 bg-white">
          {PROGRAM.map((item, i) => (
            <ProgramRow key={i} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProgramRow({ item, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-start gap-4 sm:gap-6 px-5 sm:px-7 py-4 border-b border-lafoi-dark/[0.06] last:border-b-0 ${
        item.highlight ? 'bg-lafoi-green/[0.06]' : ''
      }`}
    >
      <div className="w-24 sm:w-32 shrink-0 pt-0.5">
        <p className="font-sora text-xs sm:text-sm font-medium text-lafoi-green-dark tabular-nums tracking-tight">{item.time}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-display text-lg text-lafoi-dark leading-tight ${item.highlight ? 'flex items-center gap-2' : ''}`}>
          {item.highlight && <Scissors size={15} className="text-lafoi-green" weight="bold" />}
          {item.title}
        </p>
        {item.detail && <p className="text-sm text-lafoi-gray mt-0.5 font-body">{item.detail}</p>}
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------ Speakers --- */
function Speakers() {
  return (
    <section className="bg-lafoi-cream py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <AnimatedSection>
          <div className="flex items-center gap-3 mb-4">
            <span className="block w-10 h-px bg-lafoi-green/60" />
            <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">Our distinguished guests</p>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl text-lafoi-dark tracking-tight max-w-2xl">
            The voices behind the evening
          </h2>
        </AnimatedSection>

        <div className="mt-12 grid md:grid-cols-2 gap-5">
          {PEOPLE.map((p, i) => <SpeakerCard key={p.name} person={p} index={i} />)}
        </div>
      </div>
    </section>
  )
}

function SpeakerCard({ person, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const Icon = person.icon
  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: Math.min(index * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-3xl border p-6 sm:p-7 ${
        person.featured
          ? 'md:col-span-2 bg-lafoi-dark text-white border-lafoi-dark'
          : 'bg-white border-lafoi-dark/10'
      }`}
    >
      <div className="flex items-start gap-5">
        {/* Monogram */}
        <div className={`shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-display text-xl ${
          person.featured
            ? 'bg-lafoi-green-light/20 text-lafoi-green-light border border-lafoi-green-light/30'
            : 'bg-lafoi-green/10 text-lafoi-green-dark border border-lafoi-green/25'
        }`}>
          {initialsOf(person.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon size={13} className={person.featured ? 'text-lafoi-green-light' : 'text-lafoi-green'} weight="bold" />
            <span className={`font-sora text-[9px] tracking-[0.28em] uppercase ${person.featured ? 'text-lafoi-green-light' : 'text-lafoi-green'}`}>
              {person.tag}
            </span>
          </div>
          <h3 className={`font-display text-2xl leading-tight ${person.featured ? 'text-white' : 'text-lafoi-dark'}`}>{person.name}</h3>
          <p className={`text-sm font-sora mt-0.5 ${person.featured ? 'text-white/70' : 'text-lafoi-gray'}`}>{person.role}</p>
          <p className={`text-xs mt-0.5 ${person.featured ? 'text-white/50' : 'text-lafoi-gray-medium'}`}>{person.org}</p>
        </div>
      </div>
      <p className={`mt-5 text-sm font-body font-light leading-[1.75] ${person.featured ? 'text-white/80' : 'text-lafoi-gray'}`}>
        {person.bio}
      </p>
    </motion.article>
  )
}

/* ------------------------------------------------------------ Booklet --- */
function BookletCTA() {
  return (
    <section className="bg-lafoi-dark text-white py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
        <AnimatedSection>
          <span className="inline-flex w-14 h-14 rounded-2xl bg-lafoi-green/20 text-lafoi-green-light items-center justify-center mb-6">
            <FilePdf size={26} />
          </span>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight">Take the evening with you</h2>
          <p className="mt-4 max-w-xl mx-auto text-white/70 font-body font-light leading-[1.7]">
            The full programme, the order of proceedings, and the profiles of every speaker and dignitary —
            collected in one keepsake booklet.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a
              href={BOOKLET_URL} target="_blank" rel="noreferrer"
              className="group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-lafoi-green text-white font-sora text-sm font-medium hover:bg-lafoi-green-light transition-colors"
            >
              <DownloadSimple size={16} weight="bold" /> Download programme booklet
              <span className="text-white/60 text-xs">PDF</span>
            </a>
            <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-sora text-white/80 hover:text-white">
              Get in touch <ArrowUpRight size={14} />
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
