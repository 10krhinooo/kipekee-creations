/**
 * The brand, restated for email.
 *
 * These are the same values as the `@theme` block in `src/index.css` and must
 * stay in step with it. They are duplicated rather than imported because this
 * workspace renders outside Vite and has no Tailwind at all: an email client is
 * not a browser, so every rule ends up as an inline `style` regardless.
 */
export const color = {
  brand: '#a11c20',
  brand700: '#85171b',
  brand200: '#f6cdcf',
  brand50: '#fdf3f3',
  ink: '#191512',
  inkSoft: '#3a332e',
  muted: '#6f665e',
  line: '#e7e0d8',
  lineStrong: '#d6cabb',
  shell: '#faf7f3',
  sand: '#f0e8de',
  linen: '#f7f1e8',
  /** The secondary accent. Rules, dividers and the odd figure, never a button. */
  brass: '#c9a15e',
  brassDeep: '#8d6a34',
  white: '#ffffff',
  /** The one non-brand colour, reserved for "this went well" confirmations. */
  goodBg: '#e8f5ec',
  goodInk: '#1a6b39',
} as const

/**
 * Headings are a serif on the site now, so they are a serif here too. Fraunces
 * is a webfont and email clients will not load it, which is fine: the fallback
 * is Georgia, and Georgia is the reason a serif works in email at all — it is
 * installed everywhere including Outlook, and it is a warm enough face that the
 * mail reads as the same brand as the site rather than a near miss.
 *
 * Poppins keeps the labels and buttons, matching `--font-ui`.
 */
export const font = {
  display: "'Fraunces', Georgia, 'Times New Roman', serif",
  ui: "'Poppins', 'Trebuchet MS', 'Segoe UI', Arial, sans-serif",
  body: "'Open Sans', 'Segoe UI', Arial, Helvetica, sans-serif",
} as const

export const text = {
  h1: {
    fontFamily: font.display,
    fontSize: '24px',
    lineHeight: '31px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    color: color.ink,
    margin: '0 0 12px',
  },
  h2: {
    fontFamily: font.display,
    fontSize: '16px',
    lineHeight: '23px',
    fontWeight: 600,
    color: color.ink,
    margin: '0 0 10px',
  },
  body: { fontFamily: font.body, fontSize: '15px', lineHeight: '24px', color: color.inkSoft, margin: '0 0 16px' },
  small: { fontFamily: font.body, fontSize: '13px', lineHeight: '21px', color: color.muted, margin: '0 0 12px' },
  label: {
    fontFamily: font.ui,
    fontSize: '11px',
    lineHeight: '16px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    fontWeight: 600,
    color: color.muted,
    margin: '0 0 4px',
  },
  button: {
    fontFamily: font.ui,
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 500,
  },
} as const
