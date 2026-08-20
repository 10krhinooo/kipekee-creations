import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { BasketProvider } from './store/basket'
import { CatalogueProvider } from './store/catalogue'
import { SavedProvider } from './store/saved'
import { TierProvider, useRenderTier } from './components/preview/TierProvider'

// Lazy, and never imported from anywhere eager: this is the boundary that keeps
// three, fiber and drei out of the entry chunk entirely.
const SharedCanvas = lazy(() => import('./components/preview/SharedCanvas'))
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { BasketDrawer } from './components/BasketDrawer'
import { Button, WhatsAppIcon, whatsappLink } from './components/ui'
import { Home } from './pages/Home'
import { Shop } from './pages/Shop'
import { ProductPage } from './pages/ProductPage'
import { Checkout } from './pages/Checkout'
import { QuoteApproval } from './pages/QuoteApproval'
import { QuoteRequest } from './pages/QuoteRequest'
import { CustomCurtains } from './pages/CustomCurtains'
import { MeasureGuide } from './pages/MeasureGuide'
import { Trade } from './pages/Trade'
import { About } from './pages/About'
import { Contact } from './pages/Contact'
import { Wishlist } from './pages/Wishlist'
import { Compare } from './pages/Compare'
import { CompareBar } from './components/CompareBar'
import { PageCurtain } from './components/PageCurtain'
import { AdminLayout } from './admin/AdminLayout'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { ResetPassword } from './pages/auth/ResetPassword'
import { ChangePassword } from './pages/auth/ChangePassword'
import { AcceptInvite } from './pages/auth/AcceptInvite'
import { NoAccess } from './pages/auth/NoAccess'
import { AccountLayout } from './pages/account/AccountLayout'
import { AccountOverview } from './pages/account/Overview'
import { AccountOrders } from './pages/account/Orders'
import { AccountSaved } from './pages/account/Saved'
import { AccountAddresses } from './pages/account/Addresses'
import { AccountProfile } from './pages/account/Profile'
import { Accounts } from './admin/pages/Accounts'
import { Dashboard } from './admin/pages/Dashboard'
import { Quotes } from './admin/pages/Quotes'
import { QuoteBuilder } from './admin/pages/QuoteBuilder'
import { Orders, OrderDetail } from './admin/pages/Orders'
import { Products } from './admin/pages/Products'
import { ProductEditor } from './admin/pages/ProductEditor'
import { Schedule } from './admin/pages/Schedule'
import { Customers } from './admin/pages/Customers'
import { ProductPhotos } from './admin/pages/ProductPhotos'

/**
 * Takes the pathname rather than reading it. During a curtain transition the
 * page on screen is one step behind the real location, and scrolling to the top
 * of the page somebody is still looking at would be a visible jolt.
 */
function ScrollToTop({ pathname }: { pathname: string }) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/**
 * A persistent WhatsApp button. For a Kenyan shopper this is the single
 * highest-converting control on the page, so it stays reachable from every
 * screen.
 */
function WhatsAppFab() {
  return (
    <Button
      variant="whatsapp"
      className="fixed right-4 bottom-4 z-30 shadow-xl sm:right-6 sm:bottom-6"
      href={whatsappLink('Hello Kipekee, I have a question about your products.')}
    >
      <WhatsAppIcon className="h-5 w-5" />
      <span className="hidden sm:inline">Chat with us</span>
    </Button>
  )
}

/**
 * The storefront chrome. The admin runs its own shell, so the two never share
 * a header, a footer or a basket drawer.
 */
function StorefrontLayout() {
  const { tier } = useRenderTier()
  const { pathname } = useLocation()

  return (
    <div>
      <Header />
      {/* Keyed so each page replays the entrance, and on `<main>` rather than a
          wrapper so the animated transform never becomes a containing block for
          the fixed header, drawer or FAB above it. */}
      <main id="main" key={pathname} className="animate-page-rise">
        <Outlet />
      </main>
      <Footer />
      <BasketDrawer />
      <CompareBar />
      <WhatsAppFab />

      {/* Mounted once per session and deliberately out here, above the router
          outlet: ProductPage remounts its subtree on every navigation, and a
          Canvas inside that would burn a WebGL context each time. */}
      {tier === '3d' && (
        <Suspense fallback={null}>
          <SharedCanvas />
        </Suspense>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
    <CatalogueProvider>
    <BasketProvider>
      {/* Above both shells: the storefront previews products in a room, and the
          admin will preview materials in the same one, so the tier is a
          property of the session rather than of either app. */}
      <TierProvider>
       <SavedProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        <PageCurtain>
          {(shown) => (
            <>
              <ScrollToTop pathname={shown.pathname} />
              <Routes location={shown}>
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/quote" element={<QuoteRequest />} />
            <Route path="/quote/:reference" element={<QuoteApproval />} />
            <Route path="/custom-curtains" element={<CustomCurtains />} />
            <Route path="/measure-guide" element={<MeasureGuide />} />
            <Route path="/hotel-linen" element={<Trade />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/compare" element={<Compare />} />

            {/* The account area lives inside the storefront shell: a customer
                checking an order is still shopping, and taking the header and
                basket away to show them a receipt ends the visit early. */}
            <Route
              path="/account"
              element={
                <RequireAuth>
                  <AccountLayout />
                </RequireAuth>
              }
            >
              <Route index element={<AccountOverview />} />
              <Route path="orders" element={<AccountOrders />} />
              <Route path="saved" element={<AccountSaved />} />
              <Route path="addresses" element={<AccountAddresses />} />
              <Route path="profile" element={<AccountProfile />} />
            </Route>

            <Route path="*" element={<Home />} />
          </Route>

          {/* One set of auth screens for everybody. The role on the account
              decides where signing in lands, not which door was used. */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/no-access" element={<NoAccess />} />

          {/* The staff-only paths these replaced. Kept as redirects because
              they are in bookmarks and in already-sent emails. */}
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/admin/forgot-password" element={<Navigate to="/forgot-password" replace />} />
          <Route path="/admin/reset-password" element={<Navigate to="/reset-password" replace />} />

          <Route
            path="/admin"
            element={
              <RequireAuth roles={['STAFF', 'ADMIN']}>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="quotes/:id" element={<QuoteBuilder />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductEditor />} />
            <Route path="products/:slug/edit" element={<ProductEditor />} />
            <Route path="products/:slug/photos" element={<ProductPhotos />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="customers" element={<Customers />} />
            {/* Managing who works here is ADMIN only, on top of the staff gate
                the whole console already sits behind. */}
            <Route
              path="accounts"
              element={
                <RequireAuth roles={['ADMIN']}>
                  <Accounts />
                </RequireAuth>
              }
            />
          </Route>
              </Routes>
            </>
          )}
        </PageCurtain>
       </SavedProvider>
      </TierProvider>
    </BasketProvider>
    </CatalogueProvider>
    </AuthProvider>
  )
}
