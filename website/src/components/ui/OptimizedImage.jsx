import React from 'react';
import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function OptimizedImage({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  aspectRatio,
  fill = false,
  priority = false,
  /* Vision comment for the image placement */
  vision = '',
}) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(priority)
  const imgRef = useRef(null)

  useEffect(() => {
    if (priority) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    if (imgRef.current) observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [priority])

  const aspectStyles = aspectRatio
    ? { aspectRatio, position: 'relative', overflow: 'hidden' }
    : fill
    ? { position: 'relative', width: '100%', height: '100%' }
    : {}

  return (
    <div
      ref={imgRef}
      className={`overflow-hidden ${wrapperClassName}`}
      style={aspectStyles}
      data-vision={vision}
    >
      {!loaded && (
        <div className="absolute inset-0 img-placeholder" />
      )}
      {inView && (
        <motion.img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={`transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          onLoad={() => setLoaded(true)}
          initial={false}
          style={fill ? { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' } : {}}
        />
      )}
    </div>
  )
}
