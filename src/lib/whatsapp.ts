import type { Product, QuoteLine } from '../data/types'
import { whatsappLink } from '../components/ui'

/**
 * One quote line's details, in the order a fitter actually needs them: what,
 * which colour, which room, the size, how many windows, then anything the
 * shopper wanted to flag. Three separate call sites used to build three
 * different subsets of this — a fitter reading the cart's WhatsApp message
 * would see less detail than one reading the product page's.
 */
export function describeQuoteLine(
  product: Product,
  line: Pick<QuoteLine, 'colour' | 'room' | 'widthCm' | 'dropCm' | 'windows' | 'notes'>,
): string {
  const colour = product.colours.find((c) => c.id === line.colour)?.label
  const detail: string[] = []
  if (colour) detail.push(colour)
  detail.push(line.room)
  if (line.widthCm && line.dropCm) detail.push(`${line.widthCm} x ${line.dropCm} cm`)
  if (line.windows > 1) detail.push(`${line.windows} windows`)

  let out = product.name
  if (detail.length) out += ` (${detail.join(', ')})`
  if (line.notes) out += ` — notes: ${line.notes}`
  return out
}

/** The full WhatsApp message for one or more quote lines, greeting included. */
export function quoteWhatsAppLink(lines: { product: Product; line: QuoteLine }[]): string {
  const body =
    lines.length > 0
      ? lines.map(({ product, line }) => describeQuoteLine(product, line)).join('; ')
      : 'a made-to-measure quote'
  return whatsappLink(`Hello Kipekee, I would like a quote for: ${body}`)
}
