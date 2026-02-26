import React from 'react';
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Clock, Briefcase, ChevronDown, Heart, Zap, Globe, Users } from 'lucide-react'
import { toast } from 'sonner'
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import { useSEO } from '../utils/seo'

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
  { icon: Globe, title: 'International Training', desc: 'Get trained by our German and Estonian partners.' },
  { icon: Zap, title: 'Growth Opportunities', desc: 'Fast-growing company with room to advance quickly.' },
  { icon: Heart, title: 'Team Culture', desc: 'Collaborative, supportive, and creative environment.' },
  { icon: Users, title: 'Diverse Projects', desc: 'Work on exciting residential, commercial, and hospitality projects.' },
]

export default function Careers() {
  useSEO({
    title: 'Careers',
    description: 'Join La Foi Designs — Zimbabwe\'s premier stretch ceiling company. Explore career opportunities and grow with us.',
    path: '/careers',
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          {/* Vision: Team of diverse professionals at work, energetic and collaborative */}
          <OptimizedImage
            src="https://images.unsplash.com/photo-1758691736975-9f7f643d178e?w=1920&q=80"
            alt="La Foi Designs Team"
            className="w-full h-full object-cover"
            fill
            priority
            vision="Diverse professional team smiling in a modern office setting"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-lafoi-dark/90 via-lafoi-dark/70 to-lafoi-dark/40" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full pt-32 pb-16">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="text-lafoi-green font-sora text-sm font-semibold tracking-widest uppercase">Careers</span>
            <h1 className="heading-xl text-4xl sm:text-5xl lg:text-6xl text-white mt-4 mb-6">
              Build the future of<br /><span className="text-gradient">interior design</span>
            </h1>
            <p className="text-white/60 font-general text-lg max-w-xl">
              Join Zimbabwe's most innovative ceiling and lighting company. We're always looking for talented, passionate people.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Perks */}
      <section className="py-16 lg:py-24 bg-lafoi-green-soft">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <AnimatedSection className="text-center mb-12">
            <h2 className="heading-lg text-2xl sm:text-3xl text-lafoi-dark">Why work with us?</h2>
          </AnimatedSection>
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.08}>
            {perks.map((p) => (
              <StaggerItem key={p.title}>
                <div className="p-6 rounded-2xl bg-white border border-gray-100 text-center h-full">
                  <div className="w-12 h-12 rounded-xl bg-lafoi-green/10 flex items-center justify-center mx-auto mb-4">
                    <p.icon size={22} className="text-lafoi-green" />
                  </div>
                  <h3 className="font-sora text-base font-bold text-lafoi-dark mb-2">{p.title}</h3>
                  <p className="text-sm text-lafoi-gray font-general">{p.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Openings */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
          <AnimatedSection className="text-center mb-12">
            <h2 className="heading-lg text-2xl sm:text-3xl text-lafoi-dark mb-4">Open Positions</h2>
            <p className="text-lafoi-gray font-general">Explore our current opportunities and find your perfect role.</p>
          </AnimatedSection>
          <div className="space-y-4">
            {openings.map((job, i) => (
              <JobCard key={i} job={job} />
            ))}
          </div>
        </div>
      </section>

      {/* General Application CTA */}
      <section className="py-16 lg:py-24 bg-lafoi-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <AnimatedSection>
            <h2 className="heading-lg text-2xl sm:text-3xl text-white mb-5">
              Don't see your role? <span className="text-gradient">Apply anyway.</span>
            </h2>
            <p className="text-white/50 font-general mb-8">
              We're always interested in hearing from talented individuals. Send your CV to admin@lafoidesigns.co.zw
            </p>
            <a
              href="mailto:admin@lafoidesigns.co.zw?subject=General Application — La Foi Designs"
              className="inline-flex items-center gap-2 px-7 py-4 bg-lafoi-green text-white rounded-full font-sora text-sm font-semibold hover:bg-lafoi-green-light transition-colors group"
            >
              Send Your CV
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </AnimatedSection>
        </div>
      </section>
    </motion.div>
  )
}

function JobCard({ job }) {
  const [open, setOpen] = useState(false)

  const handleApply = () => {
    toast.success(`Application started for ${job.title}`, { description: 'Redirecting to email...' })
    window.location.href = `mailto:admin@lafoidesigns.co.zw?subject=Application: ${job.title}`
  }

  return (
    <AnimatedSection>
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between p-6 text-left"
        >
          <div>
            <h3 className="font-sora text-lg font-bold text-lafoi-dark">{job.title}</h3>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-lafoi-gray font-general">
              <span className="flex items-center gap-1"><Briefcase size={14} /> {job.department}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {job.type}</span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
            </div>
          </div>
          <ChevronDown size={20} className={`text-lafoi-gray transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-6 pb-6 border-t border-gray-100 pt-4"
          >
            <p className="text-sm text-lafoi-gray font-general mb-4">{job.desc}</p>
            <button
              onClick={handleApply}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-lafoi-green text-white rounded-full text-sm font-sora font-medium hover:bg-lafoi-green-light transition-colors"
            >
              Apply Now <ArrowRight size={14} />
            </button>
          </motion.div>
        )}
      </div>
    </AnimatedSection>
  )
}
