import React from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Calendar, Clock, ArrowUpRight } from '@phosphor-icons/react'
import OptimizedImage from '../components/ui/OptimizedImage'
import AnimatedSection from '../components/ui/AnimatedSection'
import { linkifyProse } from '../utils/linkify.jsx'
import { useSEO, breadcrumbsLd } from '../utils/seo'
import { getPost, getRelatedPosts } from '../data/blog'

export default function BlogPost() {
  const { slug } = useParams()
  const post = getPost(slug)

  useSEO(
    post
      ? {
          title: `${post.title} | La Foi Designs`,
          description: post.excerpt,
          path: `/blog/${post.slug}`,
          image: post.image,
          jsonLd: breadcrumbsLd([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        }
      : { title: 'Article not found | La Foi Designs', path: '/blog' },
  )

  if (!post) return <Navigate to="/blog" replace />

  const related = getRelatedPosts(post.slug, 3)

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-lafoi-cream"
    >
      {/* Header */}
      <header className="relative pt-28 lg:pt-36 pb-10 lg:pb-14">
        <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/blog"
            className="group inline-flex items-center gap-2 font-sora text-xs tracking-wide text-lafoi-gray hover:text-lafoi-green transition-colors mb-8"
          >
            <ArrowLeft size={14} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
            All articles
          </Link>

          <div className="flex items-center gap-3 mb-5">
            <span className="font-sora text-[10px] font-semibold tracking-[0.28em] uppercase text-lafoi-green">
              {post.category}
            </span>
            <span aria-hidden className="w-1 h-1 rounded-full bg-lafoi-gray/30" />
            <span className="inline-flex items-center gap-1.5 font-sora text-[11px] text-lafoi-gray-medium">
              <Calendar size={12} /> {post.date}
            </span>
            <span className="inline-flex items-center gap-1.5 font-sora text-[11px] text-lafoi-gray-medium">
              <Clock size={12} /> {post.readTime}
            </span>
          </div>

          <h1 className="font-display font-light text-lafoi-dark text-[2.2rem] sm:text-[2.8rem] lg:text-[3.4rem] leading-[1.05] tracking-[-0.025em]">
            {post.title}
          </h1>

          <p className="mt-5 text-lg text-lafoi-gray font-general font-light leading-relaxed max-w-2xl">
            {post.excerpt}
          </p>
          <p className="mt-6 font-sora text-[11px] tracking-[0.2em] uppercase text-lafoi-gray-medium">
            By {post.author}
          </p>
        </div>
      </header>

      {/* Hero image */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-sm overflow-hidden bg-lafoi-dark">
          <OptimizedImage
            src={post.image}
            alt={`${post.title} — ${post.vision || ''}`}
            className="w-full h-full object-cover object-center"
            fill
            priority
            vision={post.vision}
          />
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="space-y-6">
          {post.body.map((block, i) =>
            block.h ? (
              <AnimatedSection key={i} delay={0}>
                <h2 className="font-display font-normal text-lafoi-dark text-2xl lg:text-[1.7rem] leading-tight tracking-[-0.01em] pt-4">
                  {block.h}
                </h2>
              </AnimatedSection>
            ) : (
              <p key={i} className="font-general text-[17px] lg:text-lg text-lafoi-dark/80 leading-[1.75]">
                {linkifyProse(block.p)}
              </p>
            ),
          )}
        </div>

        {/* Inline CTA */}
        <div className="mt-14 p-7 lg:p-8 rounded-sm bg-lafoi-dark text-white">
          <p className="font-display font-light text-xl lg:text-2xl leading-snug">
            Thinking about a ceiling for your space?
          </p>
          <p className="mt-2 text-sm text-white/70 font-general max-w-md">
            The first design consultation and site visit are free. We sample the finish in your own light before anything is ordered.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-3 bg-lafoi-green text-white rounded-sm font-sora text-sm font-medium hover:bg-lafoi-green-light transition-colors"
            >
              Get a Free Quote <ArrowRight size={15} weight="bold" />
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-sm border border-white/20 text-white/85 hover:bg-white/10 transition-colors font-sora text-sm font-medium"
            >
              Browse the finishes
            </Link>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-lafoi-dark/10 bg-white py-16 lg:py-20">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <span className="block w-8 h-px bg-lafoi-green/50" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.28em] uppercase text-lafoi-green">
                Keep reading
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((r) => (
                <Link key={r.slug} to={`/blog/${r.slug}`} className="group block">
                  <div className="relative aspect-[4/3] rounded-sm overflow-hidden bg-lafoi-dark mb-4">
                    <OptimizedImage
                      src={r.image}
                      alt={r.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      fill
                      vision={r.vision}
                    />
                  </div>
                  <p className="font-sora text-[10px] font-semibold tracking-[0.24em] uppercase text-lafoi-green mb-2">
                    {r.category}
                  </p>
                  <h3 className="font-display font-normal text-lafoi-dark text-lg leading-snug group-hover:text-lafoi-green transition-colors">
                    {r.title}
                  </h3>
                  <span className="mt-2 inline-flex items-center gap-1 font-sora text-xs text-lafoi-gray group-hover:text-lafoi-green transition-colors">
                    Read <ArrowUpRight size={12} weight="bold" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </motion.article>
  )
}
