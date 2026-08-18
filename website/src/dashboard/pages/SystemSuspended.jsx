import React from 'react'
import { Lock } from '@phosphor-icons/react'

/**
 * Full-screen notice shown when the backend reports the platform is suspended.
 * Deliberately standalone — no nav, no auth, no data — so it renders no matter
 * what state the app was in when the switch was thrown.
 */
export default function SystemSuspended() {
  return (
    <div className="min-h-screen w-full bg-lafoi-dark text-lafoi-cream flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-8 w-16 h-16 rounded-full border border-lafoi-green/40 bg-lafoi-green/10 flex items-center justify-center">
          <Lock size={26} weight="light" className="text-lafoi-green" />
        </div>

        <p className="font-sora text-[10px] tracking-[0.4em] uppercase text-lafoi-green mb-5">
          La Foi Designs
        </p>

        <h1 className="font-display text-3xl sm:text-4xl leading-tight mb-4">
          Lafoi system is suspended.
        </h1>

        <p className="font-body text-sm leading-relaxed text-lafoi-cream/60">
          The platform is temporarily unavailable. Access has been paused.
          Please contact the administrator to restore service.
        </p>

        <div className="mt-10 pt-6 border-t border-white/10">
          <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-cream/35">
            Service paused
          </p>
        </div>
      </div>
    </div>
  )
}
