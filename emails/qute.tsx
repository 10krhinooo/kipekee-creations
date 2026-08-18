/**
 * The bridge between a React template and a Qute one.
 *
 * These templates are authored in React but never rendered at send time. The
 * build script renders each one once, to a static HTML file that Quarkus then
 * fills in per message. So every dynamic value has to survive React's renderer
 * as literal text and come out the other side as Qute syntax.
 *
 * That works because Qute's delimiters contain nothing HTML-special: `{`, `}`
 * and `#` all pass through React's text escaping untouched. The helpers below
 * exist so the intent is visible at the call site, not so they transform
 * anything.
 */

/** An interpolated value, HTML-escaped by Qute at send time: `{customerName}`. */
export const v = (expr: string) => `{${expr}}`

/**
 * A value inserted without escaping. Only for markup we generated ourselves,
 * never for anything a customer typed.
 */
export const rawValue = (expr: string) => `{${expr}.raw}`

/**
 * A value with a fallback for when the server does not supply it, which Qute
 * spells with `?:`. Reaches for this rather than an `{#if}` around one word.
 */
export const orElse = (expr: string, fallback: string) => `{${expr} ?: '${fallback}'}`

/**
 * A Qute section tag: `<S t="#for line in lines" />` ... `<S t="/for" />`.
 *
 * Rendered as a bare text node, so it must only ever sit between block-level
 * elements. Putting one between `<tr>`s would emit text into a `<tbody>`, which
 * is why every repeated block in these templates is a self-contained table
 * rather than a row of a shared one.
 */
export const S = ({ t }: { t: string }) => <>{`{${t}}`}</>
