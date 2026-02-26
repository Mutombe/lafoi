import React from 'react';
import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-lafoi-cream">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lafoi-green to-lafoi-green-light"
          animate={{
            rotate: [0, 90, 180, 270, 360],
            borderRadius: ['20%', '50%', '20%', '50%', '20%'],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.p
          className="font-sora text-sm font-medium text-lafoi-gray tracking-widest uppercase"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading
        </motion.p>
      </motion.div>
    </div>
  )
}
