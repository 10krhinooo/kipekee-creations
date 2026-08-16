import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import type { CartLine, QuoteLine } from '../data/types'
import { bySlug, priceOf } from '../data/catalogue'

/*
 * Two baskets, deliberately. Ready-made stock goes in `cart` and is payable at
 * checkout; made-to-measure work goes in `quote` carrying the measurements a
 * quote actually needs. Mixing them into one basket is what forces sites like
 * the old one to either hide prices everywhere or fake them.
 */

interface State {
  cart: CartLine[]
  quote: QuoteLine[]
}

type Action =
  | { type: 'cart/add'; line: CartLine }
  | { type: 'cart/qty'; index: number; qty: number }
  | { type: 'cart/remove'; index: number }
  | { type: 'quote/add'; line: QuoteLine }
  | { type: 'quote/update'; index: number; patch: Partial<QuoteLine> }
  | { type: 'quote/remove'; index: number }
  | { type: 'clear'; basket: 'cart' | 'quote' }
  | { type: 'hydrate'; state: State }

const empty: State = { cart: [], quote: [] }

const sameCartLine = (a: CartLine, b: CartLine) =>
  a.slug === b.slug && a.colour === b.colour && a.size === b.size

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'hydrate':
      return action.state

    case 'cart/add': {
      const at = state.cart.findIndex((l) => sameCartLine(l, action.line))
      if (at === -1) return { ...state, cart: [...state.cart, action.line] }
      const cart = state.cart.map((l, i) =>
        i === at ? { ...l, qty: l.qty + action.line.qty } : l,
      )
      return { ...state, cart }
    }

    case 'cart/qty':
      return {
        ...state,
        cart: state.cart
          .map((l, i) => (i === action.index ? { ...l, qty: Math.max(0, action.qty) } : l))
          .filter((l) => l.qty > 0),
      }

    case 'cart/remove':
      return { ...state, cart: state.cart.filter((_, i) => i !== action.index) }

    case 'quote/add':
      return { ...state, quote: [...state.quote, action.line] }

    case 'quote/update':
      return {
        ...state,
        quote: state.quote.map((l, i) => (i === action.index ? { ...l, ...action.patch } : l)),
      }

    case 'quote/remove':
      return { ...state, quote: state.quote.filter((_, i) => i !== action.index) }

    case 'clear':
      return { ...state, [action.basket]: [] }

    default:
      return state
  }
}

const STORAGE_KEY = 'kipekee.basket.v1'

/** Which panel the slide-over is showing, or null when it is closed. */
export type DrawerView = 'cart' | 'quote' | null

interface BasketApi extends State {
  addToCart: (line: CartLine) => void
  setCartQty: (index: number, qty: number) => void
  removeFromCart: (index: number) => void
  addToQuote: (line: QuoteLine) => void
  updateQuote: (index: number, patch: Partial<QuoteLine>) => void
  removeFromQuote: (index: number) => void
  clear: (basket: 'cart' | 'quote') => void
  cartCount: number
  quoteCount: number
  subtotal: number
  /** Free over KSh 10,000 inside Nairobi, the real policy, not a $200 placeholder. */
  delivery: number
  total: number
  drawer: DrawerView
  openDrawer: (view: Exclude<DrawerView, null>) => void
  closeDrawer: () => void
}

const BasketContext = createContext<BasketApi | null>(null)

export const FREE_DELIVERY_THRESHOLD = 10000
export const DELIVERY_FEE = 450

export function BasketProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, empty)
  const [drawer, setDrawer] = useState<DrawerView>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as State
        if (Array.isArray(parsed.cart) && Array.isArray(parsed.quote)) {
          dispatch({ type: 'hydrate', state: parsed })
        }
      }
    } catch {
      // A corrupt or unavailable store should never block the shop from loading.
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Private browsing can refuse writes; the basket still works in memory.
    }
  }, [state, ready])

  const openDrawer = useCallback((view: Exclude<DrawerView, null>) => setDrawer(view), [])
  const closeDrawer = useCallback(() => setDrawer(null), [])

  const subtotal = useMemo(
    () =>
      state.cart.reduce((sum, line) => {
        const product = bySlug(line.slug)
        if (!product) return sum
        return sum + priceOf(product, line.colour, line.size) * line.qty
      }, 0),
    [state.cart],
  )

  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE

  const value = useMemo<BasketApi>(
    () => ({
      ...state,
      addToCart: (line) => {
        dispatch({ type: 'cart/add', line })
        setDrawer('cart')
      },
      setCartQty: (index, qty) => dispatch({ type: 'cart/qty', index, qty }),
      removeFromCart: (index) => dispatch({ type: 'cart/remove', index }),
      addToQuote: (line) => {
        dispatch({ type: 'quote/add', line })
        setDrawer('quote')
      },
      updateQuote: (index, patch) => dispatch({ type: 'quote/update', index, patch }),
      removeFromQuote: (index) => dispatch({ type: 'quote/remove', index }),
      clear: (basket) => dispatch({ type: 'clear', basket }),
      cartCount: state.cart.reduce((n, l) => n + l.qty, 0),
      quoteCount: state.quote.length,
      subtotal,
      delivery,
      total: subtotal + delivery,
      drawer,
      openDrawer,
      closeDrawer,
    }),
    [state, subtotal, delivery, drawer, openDrawer, closeDrawer],
  )

  return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBasket() {
  const ctx = useContext(BasketContext)
  if (!ctx) throw new Error('useBasket must be used inside a BasketProvider')
  return ctx
}
