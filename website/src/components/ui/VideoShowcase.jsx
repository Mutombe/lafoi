import React, { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, X } from '@phosphor-icons/react'

/**
 * VideoShowcase — Catalogue-style "Play video" tile grid.
 *
 *   <VideoShowcase
 *     videos={[{ src: '/brand/videos/7.mp4', title: 'Stretch install', caption: 'Residential · Harare' }]}
 *     layout="bento"   // 1 large + 4 small (5 visible)
 *     // or
 *     layout="row"     // uniform 4×2 (8 visible)
 *   />
 *
 * Each card has a silent muted hover-preview. Clicking opens a portaled modal
 * that plays the original video with controls + audio. ESC / outside-click closes.
 *
 * The same video file powers both preview and modal — no double-storage.
 * Cards use preload="metadata" so we only fetch the manifest, not bytes.
 */

/* ============================================================================
   VideoCard — single tile with hover preview + click-to-open
   ============================================================================ */

function VideoCard({ video, onOpen, aspect = 'aspect-[16/10]', large = false, index = 0 }) {
  const videoRef = useRef(null)
  const [hoverable, setHoverable] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setHoverable(window.matchMedia('(hover: hover)').matches)
  }, [])

  const onEnter = useCallback(() => {
    if (!hoverable || !videoRef.current) return
    const v = videoRef.current
    // muted previews — silent until opened.
    v.muted = true
    const playPromise = v.play()
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {})
    }
  }, [hoverable])

  const onLeave = useCallback(() => {
    if (!videoRef.current) return
    const v = videoRef.current
    v.pause()
    try {
      v.currentTime = 0
    } catch {
      /* some browsers throw if metadata not loaded yet */
    }
  }, [])

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(video)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative block w-full ${aspect} rounded-3xl overflow-hidden bg-lafoi-dark text-left ring-1 ring-lafoi-dark/10 hover:ring-lafoi-green-light/40 transition-shadow duration-500 shadow-[0_18px_40px_-28px_rgba(17,17,17,0.35)]`}
      aria-label={`Play ${video.title}`}
    >
      {/* hairline reveal — top */}
      <span
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px bg-lafoi-green-light origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] z-20"
      />

      <video
        ref={videoRef}
        src={video.src}
        muted
        playsInline
        preload="metadata"
        loop
        width={large ? 1200 : 800}
        height={large ? 1500 : 500}
        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-[1.04] transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      />

      {/* permanent dark gradient — bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/85 via-lafoi-dark/15 to-transparent pointer-events-none" />
      {/* on-hover deepening — adds depth without losing the imagery */}
      <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* centre play badge — glassmorphic, restrained */}
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)] group-hover:scale-110 group-hover:bg-white/25 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
      >
        <Play size={18} weight="fill" className="text-white translate-x-[1px]" />
      </span>

      {/* index — top-left */}
      <span className="absolute top-4 left-4 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-sora text-white/85 tracking-[0.2em] uppercase">
        <span
          aria-hidden
          className="block w-1.5 h-1.5 rounded-full bg-lafoi-green-light"
        />
        Video
      </span>

      {/* details — bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-6 z-10">
        <span aria-hidden className="block w-7 h-px bg-lafoi-green-light/70 mb-3" />
        <h3
          className={`font-display font-light text-white leading-tight tracking-tight ${
            large ? 'text-2xl lg:text-3xl' : 'text-lg lg:text-xl'
          }`}
        >
          {video.title}
        </h3>
        <p className="mt-1.5 font-sora text-[10px] tracking-[0.22em] uppercase text-white/65">
          {video.caption}
        </p>
      </div>
    </motion.button>
  )
}

/* ============================================================================
   VideoModal — portaled, ESC + outside-click to close, body-scroll lock
   ============================================================================ */

function VideoModal({ video, onClose }) {
  // ESC to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <motion.div
      key="video-modal"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 lg:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* backdrop — clicking outside the video closes */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />

      {/* close button — fixed top-right of viewport */}
      <button
        onClick={onClose}
        type="button"
        aria-label="Close video"
        className="absolute top-5 right-5 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-colors duration-300"
      >
        <X size={18} weight="bold" />
      </button>

      <motion.div
        className="relative w-full max-w-5xl"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-2xl overflow-hidden bg-lafoi-dark shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
          <video
            src={video.src}
            controls
            autoPlay
            playsInline
            className="block w-full h-auto max-h-[78vh] bg-black"
          />
        </div>

        <div className="mt-5 flex items-start justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 mb-2">
              <span aria-hidden className="block w-6 h-px bg-lafoi-green-light/70" />
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-green-light">
                In motion
              </span>
            </span>
            <h3 className="font-display font-light text-white text-xl lg:text-2xl leading-tight tracking-tight">
              {video.title}
            </h3>
            <p className="mt-1.5 font-sora text-[11px] tracking-[0.22em] uppercase text-white/60">
              {video.caption}
            </p>
          </div>
          <p className="hidden sm:block font-sora text-[10px] tracking-[0.3em] uppercase text-white/40 mt-1 shrink-0">
            ESC to close
          </p>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

/* ============================================================================
   VideoShowcase — public component
   ============================================================================ */

export default function VideoShowcase({ videos = [], layout = 'row', className = '' }) {
  const [openVideo, setOpenVideo] = useState(null)

  const handleOpen = useCallback((v) => setOpenVideo(v), [])
  const handleClose = useCallback(() => setOpenVideo(null), [])

  if (!Array.isArray(videos) || videos.length === 0) return null

  if (layout === 'bento') {
    // 1 large (col-span-2 row-span-2) + 4 small (1×1 each).
    // 5 visible. Asymmetric, showcase moment.
    const [hero, ...rest] = videos.slice(0, 5)
    return (
      <div className={className}>
        <div className="grid grid-cols-2 lg:grid-cols-4 grid-rows-[auto] gap-4 lg:gap-5">
          {/* large — left two cols, two rows */}
          {hero && (
            <div className="col-span-2 row-span-2">
              <VideoCard
                video={hero}
                onOpen={handleOpen}
                aspect="aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[560px]"
                large
                index={0}
              />
            </div>
          )}
          {/* 4 small — top right and bottom right rows */}
          {rest.map((v, i) => (
            <div key={v.src} className="col-span-1 row-span-1">
              <VideoCard
                video={v}
                onOpen={handleOpen}
                aspect="aspect-[16/10]"
                index={i + 1}
              />
            </div>
          ))}
        </div>

        <AnimatePresence>
          {openVideo && <VideoModal video={openVideo} onClose={handleClose} />}
        </AnimatePresence>
      </div>
    )
  }

  // layout === 'row' — uniform 4×2 grid (8 visible). Catalogue feel.
  return (
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {videos.slice(0, 8).map((v, i) => (
          <VideoCard
            key={v.src}
            video={v}
            onOpen={handleOpen}
            aspect="aspect-[4/3]"
            index={i}
          />
        ))}
      </div>

      <AnimatePresence>
        {openVideo && <VideoModal video={openVideo} onClose={handleClose} />}
      </AnimatePresence>
    </div>
  )
}
