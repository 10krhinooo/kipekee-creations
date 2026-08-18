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
import { bySlug, priceOf, stockCapOf } from '../data/catalogue'

/*
 * Two baskets, deliberately. Ready-made stock goes in `cart` and is payable at
 * checkout; made-to-measure work goes in `quote` carrying the measurements a
 * quote actually needs. Mixing them into one basket forces a choice between
 * hiding prices everywhere or inventing them.
 */

interface State {
  cart: CartLine[]
  quote: QuoteLine[]
}

type Action =
  | { type: 'cart/add'; line: CartLine }
  | { type: 'cart/qty'; index: number; qty: number }
  | { type: 'cart/remove'; index: number }
  | { type: 'cart/insert'; index: number; line: CartLine }
  | { type: 'quote/add'; line: QuoteLine }
  | { type: 'quote/update'; index: number; patch: Partial<QuoteLine> }
  | { type: 'quote/remove'; index: number }
  | { type: 'quote/insert'; index: number; line: QuoteLine }
  | { type: 'clear'; basket: 'cart' | 'quote' }
  | { type: 'hydrate'; state: State }

const empty: State = { cart: [], quote: [] }

const sameCartLine = (a: CartLine, b: CartLine) =>
  a.slug === b.slug && a.colour === b.colour && a.size === b.size

const capped = (line: CartLine, qty: number): number =>
  Math.min(Math.max(0, qty), stockCapOf(bySlug(line.slug)))

const insertAt = <T,>(list: T[], index: number, item: T): T[] => {
  const next = [...list]
  // A line removed from the end of a list that has since shrunk still has to
  // land somewhere, so the index is clamped rather than trusted.
  next.splice(Math.min(Math.max(0, index), next.length), 0, item)
  return next
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'hydrate':
      return action.state

    case 'cart/add': {
      const at = state.cart.findIndex((l) => sameCartLine(l, action.line))
      if (at === -1) {
        const qty = capped(action.line, action.line.qty)
        return qty > 0 ? { ...state, cart: [...state.cart, { ...action.line, qty }] } : state
      }
      const cart = state.cart.map((l, i) =>
        i === at ? { ...l, qty: capped(l, l.qty + action.line.qty) } : l,
      )
      return { ...state, cart }
    }

    case 'cart/qty':
      return {
        ...state,
        cart: state.cart
          .map((l, i) => (i === action.index ? { ...l, qty: capped(l, action.qty) } : l))
          .filter((l) => l.qty > 0),
      }

    case 'cart/remove':
      return { ...state, cart: state.cart.filter((_, i) => i !== action.index) }

    case 'cart/insert':
      return { ...state, cart: insertAt(state.cart, action.index, action.line) }

    case 'quote/add':
      return { ...state, quote: [...state.quote, action.line] }

    case 'quote/update':
      return {
        ...state,
        quote: state.quote.map((l, i) => (i === action.index ? { ...l, ...action.patch } : l)),
      }

    case 'quote/remove':
      return { ...state, quote: state.quote.filter((_, i) => i !== action.index) }

    case 'quote/insert':
      return { ...state, quote: insertAt(state.quote, action.index, action.line) }

    case 'clear':
      return { ...state, [action.basket]: [] }

    default:
      return state
  }
}

const STORAGE_KEY = 'kipekee.basket.v1'

/** Which panel the slide-over is showing, or null when it is closed. */
export type DrawerView = 'cart' | 'quote' | null

/** Why a line left a basket, which is all that separates the two undo copies. */
export type RemoveReason = 'removed' | 'saved'

/**
 * The last line taken out of a basket, held so it can be put back.
 *
 * Kept out of the persisted `State` on purpose. Undo is a few seconds of grace
 * inside one session, and writing it to storage would both change the shape
 * behind `kipekee.basket.v1` and offer a stale undo to somebody returning days
 * later.
 */
interface RemovedLine {
  basket: 'cart' | 'quote'
  index: number
  line: CartLine | QuoteLine
  reason: RemoveReason
  /** Makes each removal distinct, so a second one restarts the timer. */
  token: number
}

/** Long enough to notice the mistake, short enough not to sit there. */
const UNDO_MS = 8000

interface BasketApi extends State {
  addToCart: (line: CartLine) => void
  setCartQty: (index: number, qty: number) => void
  removeFromCart: (index: number, reason?: RemoveReason) => void
  addToQuote: (line: QuoteLine) => void
  updateQuote: (index: number, patch: Partial<QuoteLine>) => void
  removeFromQuote: (index: number) => void
  clear: (basket: 'cart' | 'quote') => void
  removed: RemovedLine | null
  undoRemove: () => void
  dismissUndo: () => void
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
  const [removed, setRemoved] = useState<RemovedLine | null>(null)
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

  // `token` makes every removal a fresh object, so a second one inside the
  // window replaces the first offer and restarts the countdown rather than
  // inheriting the remainder of it.
  useEffect(() => {
    if (!removed) return
    const id = setTimeout(() => setRemoved(null), UNDO_MS)
    return () => clearTimeout(id)
  }, [removed])

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
      removeFromCart: (index, reason = 'removed') => {
        const line = state.cart[index]
        if (!line) return
        dispatch({ type: 'cart/remove', index })
        setRemoved({ basket: 'cart', index, line, reason, token: Date.now() })
      },
      addToQuote: (line) => {
        dispatch({ type: 'quote/add', line })
        setDrawer('quote')
      },
      updateQuote: (index, patch) => dispatch({ type: 'quote/update', index, patch }),
      removeFromQuote: (index) => {
        const line = state.quote[index]
        if (!line) return
        dispatch({ type: 'quote/remove', index })
        setRemoved({ basket: 'quote', index, line, reason: 'removed', token: Date.now() })
      },
      clear: (basket) => dispatch({ type: 'clear', basket }),
      removed,
      undoRemove: () => {
        if (!removed) return
        if (removed.basket === 'cart') {
          dispatch({ type: 'cart/insert', index: removed.index, line: removed.line as CartLine })
        } else {
          dispatch({ type: 'quote/insert', index: removed.index, line: removed.line as QuoteLine })
        }
        setRemoved(null)
      },
      dismissUndo: () => setRemoved(null),
      cartCount: state.cart.reduce((n, l) => n + l.qty, 0),
      quoteCount: state.quote.length,
      subtotal,
      delivery,
      total: subtotal + delivery,
      drawer,
      openDrawer,
      closeDrawer,
    }),
    [state, subtotal, delivery, drawer, removed, openDrawer, closeDrawer],
  )

  return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBasket() {
  const ctx = useContext(BasketContext)
  if (!ctx) throw new Error('useBasket must be used inside a BasketProvider')
  return ctx
}
