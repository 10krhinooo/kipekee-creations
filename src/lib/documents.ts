import { money } from './format'

/**
 * Every printable document an order produces, from one template.
 *
 * Three kinds so far, and the distinctions between them are the point rather
 * than decoration:
 *
 * - `payment-invoice` goes to the customer at checkout. Nothing has been paid
 *   at that moment, so it states an amount due.
 * - `receipt` acknowledges money received, and is issued by staff once it has
 *   been.
 * - `delivery-note` travels with the goods. It shows quantities and no prices,
 *   which is the whole reason it is a separate document: the person receiving
 *   a delivery at a hotel loading bay has no business seeing what the buyer
 *   paid. It carries a signature block instead of a total.
 *
 * None of them is a tax invoice, and each says so on its face. A Kenyan tax
 * invoice needs a KRA PIN and an eTIMS control code, and a front end has no
 * business minting either. That document comes from the backend once eTIMS is
 * wired; until then, issuing something that merely looks like one would be
 * worse than issuing nothing.
 *
 * Generated as self-contained HTML rather than PDF so the app takes no new
 * dependency. `printDocument()` hands it to the browser's own print dialogue,
 * which is where a real PDF comes from.
 */

export type DocumentKind =
  | 'payment-invoice'
  | 'receipt'
  | 'delivery-note'
  | 'quote-request'
  | 'quotation'

interface KindConfig {
  title: string
  notice: string
  /** Delivery notes deliberately omit money. */
  showPrices: boolean
  totalLabel: string | null
  /** A received-by block, for a document somebody signs on a doorstep. */
  signature: boolean
  /** Made-to-measure work: show the window sizes each line covers. */
  showMeasurements: boolean
  /** Payment instructions. Only on the document that is actually asking to be paid. */
  showPayTo?: boolean
  /** What the quantity column counts. Windows, for a made-to-measure job. */
  qtyLabel: string
  filePrefix: string
}

const KINDS: Record<DocumentKind, KindConfig> = {
  'payment-invoice': {
    title: 'Payment invoice',
    notice:
      '<strong>This is not a tax invoice.</strong> It is a record of your order and the amount due. ' +
      'Pay by M-Pesa using the details below. A tax invoice follows once payment clears.',
    showPrices: true,
    totalLabel: 'Amount due',
    signature: false,
    showMeasurements: false,
    showPayTo: true,
    qtyLabel: 'Qty',
    filePrefix: 'invoice',
  },
  receipt: {
    title: 'Receipt',
    notice:
      '<strong>This is not a tax invoice.</strong> It confirms the amount received against this order. ' +
      'A tax invoice is issued separately.',
    showPrices: true,
    totalLabel: 'Amount paid',
    signature: false,
    showMeasurements: false,
    qtyLabel: 'Qty',
    filePrefix: 'receipt',
  },
  'delivery-note': {
    title: 'Delivery note',
    notice:
      'Please check the goods against this note before signing. ' +
      'Prices are not shown here; they are on the invoice sent to the account holder.',
    showPrices: false,
    totalLabel: null,
    signature: true,
    showMeasurements: false,
    qtyLabel: 'Qty',
    filePrefix: 'delivery-note',
  },
  'quote-request': {
    title: 'Quote request',
    notice:
      'This is a record of what you asked us to quote for, not a price. ' +
      'We will measure where measuring is needed and come back with a fixed, itemised quotation.',
    showPrices: false,
    totalLabel: null,
    signature: false,
    showMeasurements: true,
    qtyLabel: 'Windows',
    filePrefix: 'quote-request',
  },
  quotation: {
    title: 'Quotation',
    notice:
      '<strong>This is a quotation, not an invoice.</strong> ' +
      'Nothing is payable until you accept it. Any line marked "to be priced" needs a site measure first.',
    showPrices: true,
    totalLabel: 'Quoted total',
    signature: false,
    showMeasurements: true,
    qtyLabel: 'Windows',
    filePrefix: 'quotation',
  },
}

export interface DocumentLine {
  productName: string
  detail: string | null
  qty: number
  amount: number
  /** Made-to-measure only: the window this line covers, already formatted. */
  measurements?: string | null
  /**
   * False when staff have not put a figure on this line yet. A quotation with
   * an unpriced line has to say so rather than print a confident zero.
   */
  priced?: boolean
}

export interface OrderDocument {
  kind: DocumentKind
  reference: string
  issuedAt: Date
  name: string
  /** Optional because staff-created orders may predate email capture. */
  email?: string | null
  phone: string
  /** Street address. Falls back to the county line when staff have only that. */
  address?: string | null
  county: string | null
  paymentMethod: string
  deliveryEstimate?: string | null
  /** Courier reference, shown on a delivery note once dispatched. */
  courier?: string | null
  lines: DocumentLine[]
  subtotal: number
  /**
   * Rows between the subtotal and the total: delivery on an order, a discount
   * on a quotation, a deposit later. A list rather than a fixed `delivery`
   * field, because the first thing that wanted a second row had to smuggle a
   * discount through the delivery line and print it as a negative delivery.
   */
  adjustments?: { label: string; amount: number; freeWhenZero?: boolean }[]
  total: number
}

/** The shop, as it appears on the document. Matches the footer and Contact. */
const SELLER = {
  name: 'Kipekee Creations',
  strapline: 'Curtains, hotel linen and interior decor',
  address: 'Katani Road, off Mombasa Road, Nairobi, Kenya',
  phone: '0722 771 321',
  email: 'info@kipekeecreations.co.ke',
}

/**
 * How to pay.
 *
 * Pochi la Biashara, so the customer uses Send Money to the shop's own number
 * rather than a paybill and a separate account field. Deliberately reading the
 * number from `SELLER` rather than repeating it: a business that changes its
 * line and updates the footer but not the invoice sends money nowhere.
 */
const PAY_TO = {
  method: 'M-Pesa, Pochi la Biashara',
  number: SELLER.phone,
  steps: [
    'M-Pesa menu, then Send Money',
    `Number: <strong>${SELLER.phone}</strong>`,
    'Enter the amount shown below',
    'Use the reference above when we ask for it',
  ],
}

/**
 * Customer-supplied text goes into markup, so it gets escaped. A delivery
 * address with an ampersand in it should not be able to break the document,
 * let alone inject anything into a file the customer may forward on.
 */
const esc = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const dateOf = (d: Date) =>
  d.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })

export function documentHtml(data: OrderDocument): string {
  const kind = KINDS[data.kind]
  const rows = data.lines
    .map(
      (line) => `
        <tr>
          <td>
            <strong>${esc(line.productName)}</strong>
            ${line.detail ? `<span class="detail">${esc(line.detail)}</span>` : ''}
            ${
              kind.showMeasurements && line.measurements
                ? `<span class="detail">${esc(line.measurements)}</span>`
                : ''
            }
          </td>
          <td class="num">${line.qty}</td>
          ${
            kind.showPrices
              ? line.priced === false
                // An unpriced line says so rather than printing a confident
                // zero that a customer could reasonably read as "free".
                ? '<td class="num tbq" colspan="2">To be priced after measure</td>'
                : `<td class="num">${esc(money(line.amount / Math.max(line.qty, 1)))}</td>
          <td class="num">${esc(money(line.amount))}</td>`
              : ''
          }
        </tr>`,
    )
    .join('')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${kind.title} ${esc(data.reference)} · ${SELLER.name}</title>
<style>
  /* Self-contained on purpose: this file gets emailed, forwarded and opened
     offline, so it cannot reach for a stylesheet or a webfont. */
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 40px 32px;
    background: #faf7f3;
    color: #191512;
    font: 14px/1.6 "Helvetica Neue", Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet { max-width: 780px; margin: 0 auto; background: #fff; padding: 40px; border: 1px solid #e7e0d8; }
  h1 { font: 700 13px/1 Arial, sans-serif; letter-spacing: .18em; text-transform: uppercase; color: #a11c20; margin: 0 0 4px; }
  .brand { font: 700 24px/1.1 Georgia, "Times New Roman", serif; margin: 0; }
  .strap { color: #6f665e; font-size: 13px; margin: 2px 0 0; }
  .top { display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap; border-bottom: 2px solid #191512; padding-bottom: 20px; }
  .ref { text-align: right; font-size: 13px; }
  .ref strong { display: block; font: 700 18px/1.2 Georgia, serif; }
  .notice { margin: 20px 0 0; padding: 10px 14px; background: #f7f1e8; border-left: 3px solid #c9a15e; font-size: 13px; }
  .cols { display: flex; gap: 32px; flex-wrap: wrap; margin: 24px 0 8px; }
  /* 180 rather than 220: the sheet is 780 wide less 80 of padding and two
     32px gaps, which leaves 212 a column. A 220 basis wrapped the third one
     onto its own row on every document. */
  .cols section { flex: 1 1 180px; }
  /* The one column somebody has to act on, so it is the one that is boxed. */
  .pay { background: #f7f1e8; border: 1px solid #e4d9c6; border-radius: 6px; padding: 10px 12px; }
  h2 { font: 700 11px/1 Arial, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #6f665e; margin: 0 0 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  th { font: 700 11px/1 Arial, sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #6f665e; text-align: left; padding: 0 0 8px; border-bottom: 1px solid #e7e0d8; }
  td { padding: 12px 0; border-bottom: 1px solid #f0e8de; vertical-align: top; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  th.num { text-align: right; }
  .detail { display: block; color: #6f665e; font-size: 12px; }
  .tbq { color: #8d6a34; font-style: italic; font-size: 12px; }
  .totals { margin-top: 16px; margin-left: auto; width: 280px; }
  .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
  .totals .due { border-top: 2px solid #191512; margin-top: 6px; padding-top: 10px; font: 700 18px/1 Georgia, serif; }
  footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e7e0d8; color: #6f665e; font-size: 12px; }
  .sign { margin-top: 36px; display: flex; gap: 32px; flex-wrap: wrap; }
  .sign div { flex: 1 1 180px; }
  .sign span { display: block; border-bottom: 1px solid #191512; height: 34px; }
  .sign label { display: block; margin-top: 6px; font: 700 11px/1 Arial, sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #6f665e; }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { border: 0; padding: 0; max-width: none; }
  }
</style>
</head>
<body>
<div class="sheet">
  <div class="top">
    <div>
      <h1>${kind.title}</h1>
      <p class="brand">${SELLER.name}</p>
      <p class="strap">${SELLER.strapline}</p>
    </div>
    <div class="ref">
      <strong>${esc(data.reference)}</strong>
      ${esc(dateOf(data.issuedAt))}
    </div>
  </div>

  <p class="notice">${kind.notice}</p>

  <div class="cols">
    <section>
      <h2>${data.kind === 'delivery-note' ? 'Deliver to' : 'Billed to'}</h2>
      <p>
        <strong>${esc(data.name)}</strong><br>
        ${data.address ? `${esc(data.address)}<br>` : ''}
        ${data.county ? `${esc(data.county)}<br>` : ''}
        ${esc(data.phone)}
        ${data.email ? `<br>${esc(data.email)}` : ''}
      </p>
    </section>
    <section>
      <h2>From</h2>
      <p>
        <strong>${SELLER.name}</strong><br>
        ${SELLER.address}<br>
        ${SELLER.phone}<br>
        ${SELLER.email}
      </p>
    </section>
    ${
      kind.showPayTo
        ? `<section class="pay">
      <h2>How to pay</h2>
      <p>
        <strong>${PAY_TO.method}</strong><br>
        ${PAY_TO.steps.join('<br>')}
      </p>
    </section>`
        : ''
    }
    <section>
      <h2>Order</h2>
      <p>
        Payment method: ${esc(data.paymentMethod)}
        ${data.deliveryEstimate ? `<br>Delivery: ${esc(data.deliveryEstimate)}` : ''}
        ${data.courier ? `<br>Courier: ${esc(data.courier)}` : ''}
      </p>
    </section>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="num">${kind.qtyLabel}</th>
        ${kind.showPrices ? '<th class="num">Unit</th><th class="num">Amount</th>' : ''}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  ${
    kind.totalLabel
      ? `<div class="totals">
    <div><span>Subtotal</span><span>${esc(money(data.subtotal))}</span></div>
    ${
      data.lines.some((l) => l.priced === false)
        ? '<div><span>Not yet priced</span><span>After measure</span></div>'
        : ''
    }
    ${(data.adjustments ?? [])
      .map(
        (row) =>
          `<div><span>${esc(row.label)}</span><span>${
            row.amount === 0 && row.freeWhenZero ? 'Free' : esc(money(row.amount))
          }</span></div>`,
      )
      .join('')}
    <div class="due"><span>${kind.totalLabel}</span><span>${esc(money(data.total))}</span></div>
  </div>`
      : ''
  }

  ${
    kind.signature
      ? `<div class="sign">
    <div><span></span><label>Received by, print name</label></div>
    <div><span></span><label>Signature</label></div>
    <div><span></span><label>Date</label></div>
  </div>`
      : ''
  }

  <footer>
    ${kind.showPrices ? 'Prices in Kenya Shillings. ' : ''}Questions about this order:
    ${SELLER.phone} or ${SELLER.email}, quoting ${esc(data.reference)}.
  </footer>
</div>
</body>
</html>`
}

/** Saves the document as an .html file that can be kept, opened or forwarded. */
export function downloadDocument(data: OrderDocument) {
  const blob = new Blob([documentHtml(data)], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kipekee-${KINDS[data.kind].filePrefix}-${data.reference}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoked on the next turn of the event loop: revoking synchronously can
  // race the download in some browsers and produce an empty file.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/**
 * Hands the document to the browser's print dialogue, which is where a real PDF
 * comes from without this app shipping a PDF library.
 *
 * A hidden iframe rather than a new window: a popup is blocked often enough
 * that it cannot be the path a customer needs to get their paperwork, and
 * printing the page itself would print the storefront around it.
 */
export function printDocument(data: OrderDocument) {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  frame.srcdoc = documentHtml(data)

  frame.onload = () => {
    const win = frame.contentWindow
    if (!win) return
    win.focus()
    win.print()
    // Left in the DOM until the dialogue is done with it. Removing it while
    // the print preview is open cancels the job in Chrome.
    const cleanup = () => {
      frame.remove()
      win.removeEventListener('afterprint', cleanup)
    }
    win.addEventListener('afterprint', cleanup)
    setTimeout(cleanup, 60_000)
  }

  document.body.appendChild(frame)
}
