import { Link } from 'react-router-dom'
import { AuthScene } from '../../components/auth/AuthScene'
import { AuthCard, AuthFooter } from '../../components/auth/AuthUI'
import { homeFor, useAuth } from '../../auth/AuthProvider'

/**
 * Signed in, but not for this.
 *
 * Deliberately not a redirect to the login screen. Bouncing somebody to a form
 * they have already filled in correctly reads as a broken site; saying plainly
 * that the account is the wrong one is both true and actionable.
 */
export function NoAccess() {
  const { user, logout } = useAuth()

  return (
    <AuthScene>
      <AuthCard
        title="That part is not open to your account"
        intro="You are signed in, just not with an account that reaches this."
      >
        <p className="mt-6 text-[13px] leading-relaxed text-muted">
          {user ? (
            <>
              You are signed in as <span className="font-medium text-ink">{user.email}</span>. If you
              should have access, ask whoever manages the workshop console to change your role.
            </>
          ) : (
            'Sign in with an account that has access.'
          )}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {user && (
            <Link
              to={homeFor(user.role)}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Back to where you belong
            </Link>
          )}
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-5 text-sm font-medium text-ink transition-colors hover:border-brand hover:text-brand"
          >
            Go to the shop
          </Link>
        </div>

        <AuthFooter>
          <button onClick={logout} className="text-ink underline underline-offset-2 hover:text-brand">
            Sign out and use another account
          </button>
        </AuthFooter>
      </AuthCard>
    </AuthScene>
  )
}
