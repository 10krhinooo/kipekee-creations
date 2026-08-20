import type { Product, Room } from './types'

/*
 * What is left of the catalogue module: the arithmetic, not the data.
 *
 * The products and categories used to live here as an 840 line literal and now
 * come from the backend through `src/store/catalogue.tsx`. These three stayed
 * because none of them needs the catalogue: they are pure functions of a
 * product somebody is already holding, and putting them behind a hook would
 * mean a context read to add two numbers together.
 */

/**
 * The most of a line a shopper may hold. Only ready-made goods are finite,
 * made-to-measure work is cut to order, so its `stock` figure means nothing
 * there. Callers disable the control at the cap rather than letting the click
 * land and silently do nothing.
 */
export const stockCapOf = (product: Product | undefined): number =>
  product && product.mode === 'buy' ? product.stock : Infinity

export const priceOf = (product: Product, colourId?: string, sizeId?: string) => {
  const c = product.colours.find((v) => v.id === colourId)
  const s = product.sizes?.find((v) => v.id === sizeId)
  return product.price + (c?.delta ?? 0) + (s?.delta ?? 0)
}

export const rooms: Room[] = [
  'Living room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Kids room',
  'Hotel & hospitality',
  'Outdoor',
]
