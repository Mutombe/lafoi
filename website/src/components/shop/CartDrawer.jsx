import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ShoppingBag,
  Trash,
  Minus,
  Plus,
  ArrowRight,
  WhatsappLogo,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useCart } from '../../store/cart'

/* ============================================================================
   CartDrawer — slides in from the right, full-height, cream surface.
   Mounted once at the app root so it's available from any page.

   WhatsApp checkout:
     Builds a plain-text order summary, URL-encodes it, and opens wa.me with
     the merchant number (+263 782 931 472) in a new tab. We do not auto-clear
     the cart — the user manages it after the conversation.
   ============================================================================ */

// Merchant WhatsApp number — primary line. Kept as the full literal URL so
// it's greppable and obvious at a glance.
const WHATSAPP_BASE_URL = 'https://wa.me/263782931472'

function buildWhatsAppMessage(items, total) {
  const lines = items.map((it, i) => {
    return `${i + 1}. ${it.name} (× ${it.qty}) — $${it.price * it.qty}`
  })
  return [
    'Hello La Foi Designs 👋',
    '',
    'I would like to order:',
    '',
    ...lines,
    '',
    `Subtotal: $${total} USD`,
    '',
    'Could you confirm availability and arrange delivery? Thank you.',
  ].join('\n')
}

export default function CartDrawer() {
  const {
    items,
    count,
    total,
    isOpen,
    closeCart,
    removeItem,
    updateQty,
    clear,
  } = useCart()

  // ESC closes drawer
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeCart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, closeCart])

  // Body scroll lock while drawer is open
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  const handleCheckout = () => {
    if (items.length === 0) return
    const message = buildWhatsAppMessage(items, total)
    const url = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener')
    toast.success('Sent to WhatsApp', {
      description: 'Continue the conversation in your WhatsApp tab.',
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[180]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeCart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Drawer */}
          <motion.aside
            className="absolute inset-y-0 right-0 w-full sm:w-[420px] bg-lafoi-cream shadow-2xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 280 }}
            role="dialog"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-lafoi-dark/[0.07]">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl font-light text-lafoi-dark tracking-tight">
                  Your cart
                </h2>
                {count > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-lafoi-green text-white text-[11px] font-sora font-semibold">
                    {count}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-2 rounded-xl hover:bg-lafoi-dark/[0.05] transition-colors"
                aria-label="Close cart"
              >
                <X size={18} weight="regular" className="text-lafoi-gray" />
              </button>
            </div>

            {/* Body */}
            {items.length === 0 ? (
              <EmptyState onClose={closeCart} />
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdate={updateQty}
                      onRemove={removeItem}
                    />
                  ))}
                </div>

                {/* Footer */}
                <div className="border-t border-lafoi-dark/[0.07] px-6 py-5 bg-white/40">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-sora text-[11px] tracking-[0.2em] uppercase text-lafoi-gray-medium">
                      Subtotal
                    </span>
                    <span className="font-display text-2xl font-light text-lafoi-dark">
                      ${total} <span className="text-sm text-lafoi-gray">USD</span>
                    </span>
                  </div>
                  <p className="text-xs text-lafoi-gray-medium mb-5">
                    Delivery & payment confirmed via WhatsApp.
                  </p>

                  <button
                    onClick={handleCheckout}
                    className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-full font-sora text-sm font-medium transition-colors duration-300 shadow-lg shadow-[#25D366]/25 group"
                  >
                    <WhatsappLogo size={18} weight="fill" />
                    <span>Checkout via WhatsApp</span>
                    <ArrowRight
                      size={14}
                      weight="bold"
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>

                  <button
                    onClick={clear}
                    className="w-full mt-3 py-2 text-xs text-lafoi-gray-medium hover:text-lafoi-dark transition-colors font-general"
                  >
                    Clear cart
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ---------- Empty state ---------------------------------------------------
function EmptyState({ onClose }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-lafoi-green/10 flex items-center justify-center mb-5">
        <ShoppingBag size={32} weight="regular" className="text-lafoi-green/70" />
      </div>
      <h3 className="font-display text-xl font-light text-lafoi-dark mb-2">
        Your cart is empty.
      </h3>
      <p className="text-sm text-lafoi-gray font-general mb-6 max-w-[260px]">
        Browse our companion line of lamps, humidifiers and care kits.
      </p>
      <Link
        to="/shop"
        onClick={onClose}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-lafoi-dark text-white rounded-full font-sora text-sm font-medium hover:bg-lafoi-green transition-colors group"
      >
        Browse the shop
        <ArrowRight
          size={14}
          weight="bold"
          className="group-hover:translate-x-1 transition-transform"
        />
      </Link>
    </div>
  )
}

// ---------- Cart item -----------------------------------------------------
function CartItem({ item, onUpdate, onRemove }) {
  return (
    <div className="flex gap-4 group">
      <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-lafoi-dark/[0.04] shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-sora text-[10px] tracking-[0.2em] uppercase text-lafoi-gray-medium mb-0.5">
              {item.category}
            </p>
            <p className="font-display text-base text-lafoi-dark leading-tight truncate">
              {item.name}
            </p>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="p-1.5 rounded-lg text-lafoi-gray-medium hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
            aria-label={`Remove ${item.name}`}
          >
            <Trash size={14} weight="regular" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <div className="inline-flex items-center bg-white border border-lafoi-dark/[0.08] rounded-full">
            <button
              onClick={() => onUpdate(item.id, item.qty - 1)}
              className="w-7 h-7 flex items-center justify-center text-lafoi-gray hover:text-lafoi-green transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={12} weight="bold" />
            </button>
            <span className="w-7 text-center font-sora text-xs font-medium text-lafoi-dark">
              {item.qty}
            </span>
            <button
              onClick={() => onUpdate(item.id, item.qty + 1)}
              className="w-7 h-7 flex items-center justify-center text-lafoi-gray hover:text-lafoi-green transition-colors"
              aria-label="Increase quantity"
            >
              <Plus size={12} weight="bold" />
            </button>
          </div>
          <span className="font-sora text-sm font-medium text-lafoi-dark">
            ${item.price * item.qty}
          </span>
        </div>
      </div>
    </div>
  )
}
