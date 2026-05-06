import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Clock,
  Briefcase,
  Heart,
  Lightning,
  Globe,
  Users,
  Sparkle,
} from '@phosphor-icons/react'
import AnimatedSection from '../components/ui/AnimatedSection'
import { linkifyProse } from '../utils/linkify.jsx'
import OptimizedImage from '../components/ui/OptimizedImage'
import HeroSlideshow from '../components/ui/HeroSlideshow'
import { useSEO, breadcrumbsLd } from '../utils/seo'

const CAREERS_HERO_SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1758691736975-9f7f643d178e?w=2200&q=85',
    alt: 'La Foi Designs Team',
    vision: 'Team in motion',
  },
  {
    src: 'https://images.unsplash.com/photo-1595513279524-fa90ad188c98?w=2200&q=85',
    alt: 'Open-plan office with acoustic ceiling',
    vision: 'Workspace where craft happens',
  },
  {
    src: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=2200&q=85',
    alt: 'Minimalist gallery space',
    vision: 'Studio environment',
  },
]

const openings = [
  {
    title: 'Senior Ceiling Installer',
    department: 'Installation',
    type: 'Full-time',
    location: 'Harare',
    desc: 'Lead stretch ceiling installations across residential and commercial projects. 3+ years experience in construction or interior finishing preferred.',
  },
  {
    title: 'Interior Design Consultant',
    department: 'Design',
    type: 'Full-time',
    location: 'Harare',
    desc: 'Guide clients through design consultations, material selection, and project visualization. Interior design qualification preferred.',
  },
  {
    title: 'Marketing Coordinator',
    department: 'Marketing',
    type: 'Full-time',
    location: 'Harare',
    desc: 'Drive brand awareness through social media, content creation, and event marketing. Creative mindset with digital marketing experience.',
  },
  {
    title: 'Apprentice Installer',
    department: 'Installation',
    type: 'Internship',
    location: 'Harare',
    desc: 'Learn the art of stretch ceiling installation under the guidance of our experienced team. No prior experience needed — just passion and dedication.',
  },
]

const perks = [
  {
    icon: Globe,
    title: 'International training',
    desc: 'Trained on the membrane and lighting systems first introduced to Zimbabwe by our studio. Hands-on workshops and a craft taught nowhere else in the country.',
    feature: true,
    image: 'https://images.unsplash.com/photo-1595513279524-fa90ad188c98?w=1200&q=80',
    vision: 'Open-plan office where the craft is taught',
  },
  {
    icon: Lightning,
    title: 'Room to grow',
    desc: 'A studio still small enough that good work is visible — and rewarded quickly. Apprentices have become installers in under a year.',
  },
  {
    icon: Heart,
    title: 'Quiet team culture',
    desc: 'Collaborative, low-ego, generous with attention. Lunch is shared most days, and feedback runs in both directions.',
  },
  {
    icon: Users,
    title: 'Diverse work',
    desc: 'Residential, commercial, hospitality, retail. The brief changes weekly — and so does the craft you bring to it.',
    feature: true,
    image: 'https://images.unsplash.com/photo-1768270181430-3e3672a32283?w=1200&q=80',
    vision: 'Hospitality lobby with sculptural ceiling',
  },
]

const processSteps = [
  {
    num: '01',
    title: 'Send a CV or a note',
    desc: 'Apply by email — attach a CV or simply tell us what kind of work you would like to do. We read everything.',
  },
  {
    num: '02',
    title: 'A first conversation',
    desc: 'A 30-minute conversation, in person or by video, with the founders. We mostly listen.',
  },
  {
    num: '03',
    title: 'Studio visit',
    desc: 'A morning at the studio in Belgravia — a tour of the membrane library and a chance to meet the team.',
  },
  {
    num: '04',
    title: 'Offer & start',
    desc: 'A written offer within a week, then onboarding begins. Most new joiners are working on real projects within their first month.',
  },
]

export default function Careers() {
  useSEO({
    title: 'Careers at La Foi Designs',
    description:
      'Open roles at La Foi Designs — installers, designers, project managers. Build with the studio shaping interiors across Zimbabwe.',
    path: '/careers',
    jsonLd: breadcrumbsLd([
      { name: 'Home', path: '/' },
      { name: 'Careers', path: '/careers' },
    ]),
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <CareersHero />
      <Perks />
      <Openings />
      <ProcessTimeline />
      <GeneralApplyCTA />
    </motion.div>
  )
}

function CareersHero() {
  // Aurora Dark — no image, no slideshow. Italic Fraunces headline with sculptural blob accent.
  return (
    <section className="relative min-h-[100svh] lg:min-h-[88vh] overflow-hidden bg-lafoi-dark flex flex-col">
      <div aria-hidden className="absolute inset-0 aurora-mesh" />
      <div aria-hidden className="absolute inset-0 dot-pattern opacity-12 pointer-events-none" />

      {/* Sculptural green blob */}
      <motion.div
        aria-hidden
        className="absolute hidden lg:block top-[18vh] right-[8vw] w-[24rem] h-[24rem] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, rgba(26,138,46,0.45), rgba(26,138,46,0.15) 55%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{ y: [0, -16, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute lg:hidden top-[28vh] right-[-6rem] w-[18rem] h-[18rem] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, rgba(26,138,46,0.4), rgba(26,138,46,0.12) 55%, transparent 70%)',
          filter: 'blur(36px)',
        }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="absolute inset-x-0 top-28 lg:top-32 z-10 pointer-events-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-end gap-3">
          <span className="hidden sm:block w-8 h-px bg-white/30" />
          <span className="font-sora text-[10px] tracking-[0.28em] uppercase text-white/65">
            Vol.&nbsp;06 &mdash; 2026 &middot; Build with us
          </span>
        </div>
      </div>

      <motion.div
        className="relative z-10 flex-1 flex flex-col max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full"
      >
        <motion.div
          className="pt-28 lg:pt-32"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/8 backdrop-blur-md border border-white/15">
            <Briefcase size={13} weight="regular" className="text-lafoi-green-light" />
            <span className="text-[10px] sm:text-[11px] font-sora text-white/85 font-medium tracking-[0.22em] uppercase">
              Careers &middot; Belgravia, Harare
            </span>
          </span>
        </motion.div>

        <div className="mt-auto pb-10 lg:pb-16 grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          <motion.div
            className="lg:col-span-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1
              className="font-display text-white tracking-[-0.035em] leading-[0.95] text-[3rem] sm:text-[4.5rem] lg:text-[6.2rem] xl:text-[6.8rem]"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              <span className="block font-light text-white/95">Build</span>
              <span className="block italic font-light text-lafoi-green-light">with us.</span>
            </h1>

            <motion.p
              className="mt-6 lg:mt-8 max-w-xl text-sm sm:text-base lg:text-[17px] text-white/70 font-body font-light leading-[1.55]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {linkifyProse(
                'We hire for taste, patience and a steady hand — the rest can be taught. The studio is still small, the work is unusually varied, and good craft moves quickly here. See our portfolio for the kind of projects you would be helping shape.',
                { variant: 'dark' }
              )}
            </motion.p>

            <motion.div
              className="mt-8 lg:mt-10 flex flex-wrap items-center gap-x-5 gap-y-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <a
                href="#openings"
                className="group inline-flex items-center gap-3 px-7 py-3.5 bg-lafoi-green-light text-white rounded-full font-body text-sm font-medium hover:bg-lafoi-green transition-all duration-500 shadow-[0_10px_40px_-10px_rgba(34,197,94,0.55)]"
              >
                See open roles
                <ArrowRight
                  size={15}
                  weight="bold"
                  className="group-hover:translate-x-1 transition-transform duration-300"
                />
              </a>
              <a
                href="mailto:admin@lafoidesigns.co.zw?subject=General Application — La Foi Designs"
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/25 text-white/85 hover:bg-white/8 hover:border-white/45 hover:text-white font-body text-sm font-medium transition-all duration-500"
              >
                Open application
                <ArrowUpRight
                  size={14}
                  weight="regular"
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                />
              </a>
            </motion.div>
          </motion.div>

          <motion.aside
            className="lg:col-span-4 hidden lg:block"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="ml-auto max-w-[300px] relative bg-white/[0.06] backdrop-blur-md border border-white/15 rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-lg rounded-bl-lg p-6 overflow-hidden">
              <div aria-hidden className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className="block w-6 h-px bg-lafoi-green-light/70" />
                  <p className="font-sora text-[10px] font-semibold tracking-[0.28em] uppercase text-lafoi-green-light">
                    The studio
                  </p>
                </div>
                <div className="space-y-3 font-body font-light text-[13px] text-white/75 leading-relaxed">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-white/50">Open roles</span>
                    <span className="text-white">{openings.length}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-white/50">Team size</span>
                    <span className="text-white">12 &amp; growing</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-white/50">Founded</span>
                    <span className="text-white">Jan 2024</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-white/50">Studio</span>
                    <span className="text-white">Belgravia</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.1 }}
      >
        <span className="text-[9px] font-sora tracking-[0.35em] uppercase text-white/45">
          Scroll
        </span>
        <span className="block w-px h-8 bg-gradient-to-b from-white/45 to-transparent" />
      </motion.div>
    </section>
  )
}

function Perks() {
  return (
    <section className="relative py-24 lg:py-32 bg-lafoi-cream overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-1 pointer-events-none" />
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14 lg:mb-20">
          <div className="max-w-2xl">
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-5">
                <span className="block w-10 h-px bg-lafoi-green/60" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                  Why work here
                </p>
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                  01 / 04
                </span>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h2 className="font-display font-light text-lafoi-dark text-4xl sm:text-5xl lg:text-[3.6rem] leading-[1.05] tracking-[-0.02em]">
                Four reasons,{' '}
                <span className="text-lafoi-green">honestly stated</span>.
              </h2>
            </AnimatedSection>
          </div>
          <AnimatedSection delay={0.2}>
            <p className="font-body font-light text-lafoi-gray max-w-sm leading-relaxed">
              Less a list of perks than a description of the room. If any of these resonate, the
              rest tend to follow.
            </p>
          </AnimatedSection>
        </div>

        {/* mixed bento — 2 image features + 2 typographic */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          {/* International training — image feature */}
          <AnimatedSection direction="up" className="lg:col-span-7">
            <PerkImageCard p={perks[0]} index={0} />
          </AnimatedSection>

          {/* Room to grow — typographic */}
          <AnimatedSection direction="up" delay={0.05} className="lg:col-span-5">
            <PerkTypoCard p={perks[1]} index={1} />
          </AnimatedSection>

          {/* Quiet team culture — typographic */}
          <AnimatedSection direction="up" delay={0.1} className="lg:col-span-5">
            <PerkTypoCard p={perks[2]} index={2} />
          </AnimatedSection>

          {/* Diverse work — image feature */}
          <AnimatedSection direction="up" delay={0.15} className="lg:col-span-7">
            <PerkImageCard p={perks[3]} index={3} />
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

function PerkImageCard({ p, index }) {
  const Icon = p.icon
  return (
    <div className="relative h-full min-h-[420px] overflow-hidden bg-lafoi-dark rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-2xl rounded-bl-2xl">
      <OptimizedImage
        src={p.image}
        alt={p.title}
        className="w-full h-full object-cover object-center"
        fill
        vision={p.vision}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark via-lafoi-dark/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-lafoi-dark/40 via-transparent to-transparent opacity-70" />

      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/65">
          0{index + 1} / 04
        </span>
        <span className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center">
          <Icon size={14} weight="regular" className="text-white/85" />
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-7 lg:p-9">
        <span className="block w-10 h-px bg-lafoi-green-light/70 mb-4" />
        <h3 className="font-display font-light text-white text-3xl lg:text-4xl xl:text-[2.6rem] leading-[1.05] mb-4 tracking-[-0.01em]">
          {p.title}
        </h3>
        <p className="font-body font-light text-white/75 text-sm lg:text-base leading-relaxed max-w-md">
          {p.desc}
        </p>
      </div>
    </div>
  )
}

function PerkTypoCard({ p, index }) {
  const Icon = p.icon
  return (
    <div className="group h-full min-h-[420px] flex flex-col p-8 lg:p-10 rounded-3xl border border-lafoi-dark/10 bg-white/40 backdrop-blur-sm hover:bg-white hover:border-lafoi-green/30 transition-all duration-500">
      <div className="flex items-baseline justify-between mb-7">
        <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">
          0{index + 1} / 04
        </span>
        <Icon
          size={16}
          weight="regular"
          className="text-lafoi-green/70 group-hover:text-lafoi-green transition-colors duration-500"
        />
      </div>
      <span className="block w-10 h-px bg-lafoi-green/60 mb-6" />
      <h3 className="font-display font-light text-lafoi-dark text-3xl lg:text-4xl xl:text-[2.4rem] leading-[1.1] mb-5 tracking-[-0.01em]">
        {p.title}
      </h3>
      <p className="font-body font-light text-base text-lafoi-gray leading-[1.7]">{linkifyProse(p.desc)}</p>
    </div>
  )
}

function Openings() {
  return (
    <section
      id="openings"
      className="relative py-24 lg:py-36 bg-lafoi-dark overflow-hidden"
    >
      <div className="absolute inset-0 pattern-blueprint-light opacity-50 pointer-events-none" />
      <div className="absolute inset-0 dot-pattern opacity-15 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 100% 0%, rgba(34,197,94,0.07), transparent 50%), radial-gradient(ellipse at 0% 100%, rgba(26,138,46,0.05), transparent 50%)',
        }}
      />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14 lg:mb-20">
          <div className="max-w-2xl">
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-5">
                <span className="block w-10 h-px bg-lafoi-green-light/60" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light">
                  Open positions
                </p>
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/30">
                  02 / 04
                </span>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h2 className="font-display font-light text-white text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.1] tracking-[-0.02em]">
                {openings.length} roles,{' '}
                <span className="text-lafoi-green-light">listed plainly</span>.
              </h2>
            </AnimatedSection>
          </div>
          <AnimatedSection delay={0.2} direction="right">
            <p className="font-body font-light text-white/65 max-w-sm leading-relaxed">
              {linkifyProse(
                'No job-spec theatre. Click through to apply by email — we read every CV personally. Browse our portfolio for the work you would be joining.',
                { variant: 'dark' }
              )}
            </p>
          </AnimatedSection>
        </div>

        {/* Editorial table */}
        <AnimatedSection delay={0.15}>
          <div className="border-t border-white/10">
            {openings.map((job, i) => (
              <JobRow key={job.title} job={job} index={i} total={openings.length} />
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

function JobRow({ job, index, total }) {
  const mailto = `mailto:admin@lafoidesigns.co.zw?subject=Application: ${encodeURIComponent(
    job.title,
  )}`
  return (
    <a
      href={mailto}
      className="group block border-b border-white/10 hover:bg-white/[0.04] transition-colors duration-500"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 py-7 lg:py-9 items-baseline">
        {/* index */}
        <div className="lg:col-span-1 flex items-baseline gap-3">
          <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-green-light/70">
            0{index + 1} / 0{total}
          </span>
        </div>

        {/* title */}
        <div className="lg:col-span-4">
          <h3 className="font-display font-normal text-white text-2xl lg:text-[1.7rem] leading-[1.15] group-hover:text-lafoi-green-light transition-colors duration-300">
            {job.title}
          </h3>
        </div>

        {/* chips */}
        <div className="lg:col-span-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/8 border border-white/15 text-[10px] font-sora tracking-[0.22em] uppercase text-white/75">
            <Briefcase size={11} weight="regular" />
            {job.department}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/8 border border-white/15 text-[10px] font-sora tracking-[0.22em] uppercase text-white/75">
            <Clock size={11} weight="regular" />
            {job.type}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/8 border border-white/15 text-[10px] font-sora tracking-[0.22em] uppercase text-white/75">
            <MapPin size={11} weight="regular" />
            {job.location}
          </span>
        </div>

        {/* description */}
        <div className="lg:col-span-3">
          <p className="font-body font-light text-sm lg:text-[15px] text-white/60 leading-[1.6]">
            {job.desc}
          </p>
        </div>

        {/* CTA */}
        <div className="lg:col-span-1 lg:text-right">
          <span className="inline-flex items-center gap-2 font-sora text-xs font-medium tracking-[0.22em] uppercase text-white/85 group-hover:text-lafoi-green-light transition-colors duration-300">
            Apply
            <ArrowRight
              size={13}
              weight="bold"
              className="group-hover:translate-x-1 transition-transform duration-300"
            />
          </span>
        </div>
      </div>
    </a>
  )
}

function ProcessTimeline() {
  return (
    <section className="relative py-24 lg:py-32 bg-lafoi-cream overflow-hidden">
      <div className="absolute inset-0 pattern-cross-light opacity-40 pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="max-w-2xl mb-14 lg:mb-20">
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-5">
              <span className="block w-10 h-px bg-lafoi-green/60" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                The process
              </p>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                03 / 04
              </span>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="font-display font-light text-lafoi-dark text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.1] tracking-[-0.02em]">
              From note{' '}
              <span className="text-lafoi-green">to first project</span>.
            </h2>
          </AnimatedSection>
        </div>

        <div className="relative max-w-4xl">
          {/* hairline rule connecting steps */}
          <span
            aria-hidden
            className="absolute left-[3.5rem] sm:left-[4.5rem] lg:left-[5rem] top-3 bottom-3 w-px bg-lafoi-dark/15 hidden sm:block"
          />

          <div className="space-y-14 lg:space-y-20">
            {processSteps.map((step, i) => (
              <ProcessStep key={step.num} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ProcessStep({ step, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
      className="relative grid grid-cols-[3.5rem_1fr] sm:grid-cols-[4.5rem_1fr] lg:grid-cols-[5rem_1fr] gap-6 lg:gap-10 items-baseline"
    >
      {/* giant number */}
      <div className="relative">
        <span
          className="font-display font-light text-lafoi-green leading-none tracking-[-0.04em] text-5xl sm:text-6xl lg:text-7xl block bg-lafoi-cream relative z-10 pr-2"
          style={{ fontVariationSettings: '"opsz" 144' }}
        >
          {step.num}
        </span>
      </div>

      {/* body */}
      <div>
        <span className="block w-10 h-px bg-lafoi-green/60 mb-5" />
        <h3 className="font-display font-light text-lafoi-dark text-2xl sm:text-3xl lg:text-[2rem] leading-[1.15] mb-4 tracking-[-0.01em]">
          {step.title}
        </h3>
        <p className="font-body font-light text-base lg:text-lg text-lafoi-gray leading-[1.7] max-w-xl">
          {step.desc}
        </p>
      </div>
    </motion.div>
  )
}

function GeneralApplyCTA() {
  return (
    <section className="relative min-h-[70vh] lg:min-h-[80vh] flex items-center overflow-hidden bg-lafoi-dark">
      <div className="absolute inset-0">
        <OptimizedImage
          src="https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=2000&q=85"
          alt="Quiet studio environment"
          className="w-full h-full object-cover object-center"
          fill
          vision="Quiet gallery space — invitation to apply"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/85 via-lafoi-dark/30 to-lafoi-dark/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-lafoi-dark/55 via-transparent to-lafoi-dark/30" />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full py-24 lg:py-32">
        <div className="max-w-3xl">
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-7">
              <span className="block w-12 h-px bg-lafoi-green-light/70" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light">
                Open application
              </p>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/30">
                04 / 04
              </span>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <h2 className="font-display text-white text-4xl sm:text-5xl lg:text-[4.4rem] xl:text-[5rem] leading-[1.05] tracking-[-0.025em]">
              <span className="block font-light">Don&rsquo;t see your role?</span>
              <span className="block font-normal">
                <span className="text-white">Apply </span>
                <span className="text-lafoi-green-light">anyway.</span>
              </span>
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.25}>
            <p className="mt-8 max-w-xl text-base lg:text-lg text-white/70 font-body font-light leading-relaxed">
              We are always interested in hearing from talented people. Send a CV — or just a note —
              and tell us what you would like to do. We read everything.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <div className="mt-12 flex flex-wrap items-center gap-4 lg:gap-5">
              <a
                href="mailto:admin@lafoidesigns.co.zw?subject=General Application — La Foi Designs"
                className="group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-lafoi-green-light text-white font-sora text-sm font-semibold hover:bg-lafoi-green transition-all duration-500 shadow-[0_8px_30px_rgba(34,197,94,0.25)]"
              >
                <Sparkle size={15} weight="regular" />
                Send your CV
                <ArrowRight
                  size={15}
                  weight="bold"
                  className="group-hover:translate-x-1 transition-transform duration-300"
                />
              </a>
              <Link
                to="/about"
                className="group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-white/10 backdrop-blur-md text-white font-sora text-sm font-semibold border border-white/20 hover:bg-white/15 hover:border-white/40 transition-all duration-500"
              >
                Read more about the studio
                <ArrowUpRight
                  size={15}
                  weight="bold"
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
