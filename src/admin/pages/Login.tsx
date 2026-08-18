import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { animate, stagger } from 'animejs'
import { cx } from '../../components/ui'
import { reducedMotion } from '../../lib/motion'
import { useAdminAuth } from '../auth'

/**
 * Centered card on a dark decorative field, split into a form panel and a
 * brand panel with floating shapes - the pattern from
 * apeiro-marketing's SignInScreen, reskinned to Kipekee's brand tokens and
 * built on anime.js (already a dependency via RoomPreview) rather than GSAP.
 */
export function AdminLogin() {
  const { status, login } = useAdminAuth()
  const location = useLocation()
  const scope = useRef<HTMLDivElement>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const el = scope.current
    if (!el || reducedMotion()) return

    animate(el.querySelectorAll('[data-anim="shape"]'), {
      opacity: [0, 1],
      scale: [0.6, 1],
      duration: 500,
      delay: stagger(25),
      ease: 'outCubic',
    })
    animate(el.querySelectorAll('[data-anim="card"]'), {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 400,
      delay: 150,
      ease: 'outCubic',
    })
    animate(el.querySelectorAll('[data-anim="field"]'), {
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 300,
      delay: stagger(40, { start: 200 }),
      ease: 'outCubic',
    })
    animate(el.querySelectorAll('[data-anim="deco"]'), {
      opacity: [0, 1],
      translateY: [12, 0],
      scale: [0.92, 1],
      duration: 350,
      delay: stagger(60, { start: 350 }),
      ease: 'outCubic',
    })
  }, [])

  if (status === 'signed-in') {
    const target = (location.state as { from?: string } | null)?.from ?? '/admin'
    return <Navigate to={target} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await login(email, password)
    setSubmitting(false)
    if (!result.ok) setError(result.message)
  }

  return (
    <div
      ref={scope}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-ink p-5 md:p-8"
    >
      <div
        data-anim="shape"
        className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 -rotate-12 bg-brand/20"
        style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        aria-hidden
      />
      <div
        data-anim="shape"
        className="pointer-events-none absolute -top-20 -right-10 h-72 w-72 rounded-[40%_60%_55%_45%/45%_40%_60%_55%] bg-brand/10"
        aria-hidden
      />
      <div
        data-anim="shape"
        className="pointer-events-none absolute bottom-[-6rem] left-[20%] h-64 w-64 rounded-full bg-white/[0.04]"
        aria-hidden
      />
      <div
        data-anim="shape"
        className="pointer-events-none absolute right-[10%] bottom-[-7rem] h-96 w-96 rounded-full bg-brand/15"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-[960px]">
        <div
          data-anim="card"
          className="grid overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] lg:grid-cols-[1fr_1.05fr]"
        >
          {/* Left: form panel */}
          <div className="flex flex-col justify-center px-8 py-10 md:px-12">
            <div className="w-full max-w-[320px]">
              <div data-anim="field">
                <span className="font-display text-2xl font-bold text-ink">Kipekee</span>
                <span className="mt-0.5 block text-[11px] tracking-[0.24em] text-brand uppercase">
                  Workshop admin
                </span>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
                <label data-anim="field" className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-ink-soft">Email</span>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    disabled={submitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@kipekeecreations.co.ke"
                    className="rounded-xl border border-line bg-shell px-4 py-3 text-sm text-ink outline-none transition-all duration-300 ease-out placeholder:text-muted focus:border-brand focus:bg-white focus:shadow-[0_0_0_4px_rgba(161,28,32,0.1)] disabled:opacity-60"
                  />
                </label>

                <label data-anim="field" className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-ink-soft">Password</span>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    disabled={submitting}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    className="rounded-xl border border-line bg-shell px-4 py-3 text-sm text-ink outline-none transition-all duration-300 ease-out placeholder:text-muted focus:border-brand focus:bg-white focus:shadow-[0_0_0_4px_rgba(161,28,32,0.1)] disabled:opacity-60"
                  />
                </label>

                {error && <p className="text-[12px] text-brand-700">{error}</p>}

                <button
                  data-anim="field"
                  type="submit"
                  disabled={submitting}
                  className={cx(
                    'mt-2 inline-flex h-[50px] w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white shadow-[0_10px_24px_-6px_rgba(161,28,32,0.5)] transition-transform duration-300',
                    'hover:scale-[1.01] disabled:opacity-80 disabled:hover:scale-100',
                  )}
                >
                  {submitting ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <p data-anim="field" className="mt-6 text-center text-[13px] text-muted">
                Staff access only. Ask your manager for a login.
              </p>
            </div>
          </div>

          {/* Right: brand panel */}
          <div className="relative hidden flex-col bg-ink px-8 py-8 lg:flex">
            <div
              className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-brand/10"
              aria-hidden
            />

            <div className="relative">
              <p className="max-w-[220px] text-[15px] font-medium leading-snug text-white">
                Quotes, orders and stock, all in one workshop console.
              </p>
            </div>

            <div className="relative mt-auto w-full flex-1">
              <div
                data-anim="deco"
                className="absolute top-0 left-0 -rotate-2 rounded-2xl bg-white/[0.08] p-3 backdrop-blur-sm"
              >
                <p className="text-[11px] font-semibold text-white">Today's quotes</p>
                <p className="text-[9px] text-white/50">reviewed each morning</p>
              </div>

              <div
                data-anim="deco"
                className="absolute top-8 right-0 w-[168px] rotate-3 rounded-2xl bg-white p-4 shadow-[0_20px_45px_-12px_rgba(0,0,0,0.35)]"
              >
                <p className="font-mono text-[8px] tracking-widest text-muted uppercase">Order</p>
                <p className="mt-1 text-[12px] font-semibold text-ink">Curtains, made to measure</p>
                <p className="mt-1 text-[9px] text-muted">Ready for fitting</p>
              </div>

              <div
                data-anim="deco"
                className="absolute bottom-0 left-0 w-[168px] -rotate-2 rounded-2xl bg-white p-4 shadow-[0_20px_45px_-12px_rgba(0,0,0,0.35)]"
              >
                <p className="font-mono text-[8px] tracking-widest text-muted uppercase">Stock</p>
                <p className="mt-1 text-[12px] font-semibold text-ink">Low: linen sets</p>
                <p className="mt-1 text-[9px] text-muted">Reorder this week</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
