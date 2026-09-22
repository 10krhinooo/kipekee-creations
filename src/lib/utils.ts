export { cn } from 'cn'

/*
 * `cn` re-exported rather than re-implemented.
 *
 * shadcn components are generated with `import { cn } from "cn"` baked in, so
 * the package is a dependency whether or not we route through it. Re-exporting
 * here means our own code has one import path to remember and one place to
 * wrap it if that ever becomes necessary, without either half of the codebase
 * having to change when the other does.
 *
 * It is not a replacement for `cx()` in `components/ui.tsx`, and the two should
 * not be swapped for each other in passing. `cn` resolves Tailwind conflicts,
 * so a later `px-6` beats an earlier `px-4` instead of both landing and the
 * cascade deciding. That is what shadcn's variant-plus-override pattern needs,
 * and it costs more than a join. Hand-written components here compose classes
 * rather than override them, so they use the cheap joiner and are right to.
 */
