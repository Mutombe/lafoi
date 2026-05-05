import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react'
import { toast } from 'sonner'

/* ============================================================================
   La Foi Designs — Cart Store
   ============================================================================
   A tiny, dependency-free shopping cart that persists to localStorage so
   unauthenticated visitors can add items, leave the site, and return without
   losing their selection.

   Storage key: lafoi.cart.v1
   Shape: Array<{ id, name, price, image, qty, slug, category }>

   The provider is mounted once at the app root (src/App.jsx). The drawer
   (src/components/shop/CartDrawer.jsx) consumes the same context.
   ============================================================================ */

const STORAGE_KEY = 'lafoi.cart.v1'

const CartContext = createContext(null)

// ---------- Reducer --------------------------------------------------------
function cartReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return Array.isArray(action.items) ? action.items : []
    case 'ADD': {
      const { product, qty } = action
      const existing = state.find((i) => i.id === product.slug)
      if (existing) {
        return state.map((i) =>
          i.id === product.slug ? { ...i, qty: i.qty + qty } : i
        )
      }
      return [
        ...state,
        {
          id: product.slug,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: Array.isArray(product.images) ? product.images[0] : product.image,
          category: product.category,
          qty,
        },
      ]
    }
    case 'REMOVE':
      return state.filter((i) => i.id !== action.id)
    case 'UPDATE_QTY': {
      const { id, qty } = action
      if (qty <= 0) return state.filter((i) => i.id !== id)
      return state.map((i) => (i.id === id ? { ...i, qty } : i))
    }
    case 'CLEAR':
      return []
    default:
      return state
  }
}

// ---------- Provider -------------------------------------------------------
export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [])
  const [hydrated, setHydrated] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Read from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) dispatch({ type: 'HYDRATE', items: parsed })
      }
    } catch {
      // ignore corrupt cart, fall through to empty state
    }
    setHydrated(true)
  }, [])

  // Persist to localStorage on every change (after hydration so we don't clobber).
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // quota exceeded / private mode — swallow silently
    }
  }, [items, hydrated])

  const addItem = useCallback((product, qty = 1) => {
    dispatch({ type: 'ADD', product, qty })
    toast.success('Added to cart', {
      description: `${product.name} — view cart →`,
    })
  }, [])

  const removeItem = useCallback((id) => {
    dispatch({ type: 'REMOVE', id })
    toast.success('Removed from cart')
  }, [])

  const updateQty = useCallback((id, qty) => {
    dispatch({ type: 'UPDATE_QTY', id, qty })
  }, [])

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.qty, 0),
    [items]
  )
  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items]
  )

  const value = useMemo(
    () => ({
      items,
      count,
      total,
      addItem,
      removeItem,
      updateQty,
      clear,
      isOpen,
      openCart,
      closeCart,
    }),
    [items, count, total, addItem, removeItem, updateQty, clear, isOpen, openCart, closeCart]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// ---------- Hook -----------------------------------------------------------
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within a <CartProvider>')
  }
  return ctx
}

export default CartProvider
