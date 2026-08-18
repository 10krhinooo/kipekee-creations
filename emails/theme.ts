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
  ink: '#17181a',
  inkSoft: '#323232',
  muted: '#888888',
  line: '#e5e5e5',
  shell: '#faf8f6',
  sand: '#f3ede7',
  white: '#ffffff',
  /** The one non-brand colour, reserved for "this went well" confirmations. */
  goodBg: '#e8f5ec',
  goodInk: '#1a6b39',
} as const

/**
 * Poppins for display and Open Sans for body, matching the site, each with a
 * real fallback stack. Outlook ignores webfonts entirely and lands on Georgia
 * or Arial, which is why the fallbacks are picked rather than left to default.
 */
export const font = {
  display: "'Poppins', 'Trebuchet MS', 'Segoe UI', Arial, sans-serif",
  body: "'Open Sans', 'Segoe UI', Arial, Helvetica, sans-serif",
} as const

export const text = {
  h1: { fontFamily: font.display, fontSize: '22px', lineHeight: '30px', fontWeight: 600, color: color.ink, margin: '0 0 12px' },
  h2: { fontFamily: font.display, fontSize: '15px', lineHeight: '22px', fontWeight: 600, color: color.ink, margin: '0 0 10px' },
  body: { fontFamily: font.body, fontSize: '15px', lineHeight: '24px', color: color.inkSoft, margin: '0 0 16px' },
  small: { fontFamily: font.body, fontSize: '13px', lineHeight: '21px', color: color.muted, margin: '0 0 12px' },
  label: {
    fontFamily: font.body,
    fontSize: '11px',
    lineHeight: '16px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: color.muted,
    margin: '0 0 4px',
  },
} as const
