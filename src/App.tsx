import { Suspense, lazy, useEffect } from 'react'
import { Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { BasketProvider } from './store/basket'
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
import { QuoteRequest } from './pages/QuoteRequest'
import { CustomCurtains } from './pages/CustomCurtains'
import { MeasureGuide } from './pages/MeasureGuide'
import { Trade } from './pages/Trade'
import { About } from './pages/About'
import { Contact } from './pages/Contact'
import { AdminLayout } from './admin/AdminLayout'
import { Dashboard } from './admin/pages/Dashboard'
import { Quotes } from './admin/pages/Quotes'
import { QuoteBuilder } from './admin/pages/QuoteBuilder'
import { Orders, OrderDetail } from './admin/pages/Orders'
import { Products } from './admin/pages/Products'
import { Schedule } from './admin/pages/Schedule'
import { Customers } from './admin/pages/Customers'

function ScrollToTop() {
  const { pathname } = useLocation()
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

  return (
    <div>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <BasketDrawer />
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
    <BasketProvider>
      {/* Above both shells: the storefront previews products in a room, and the
          admin will preview materials in the same one, so the tier is a
          property of the session rather than of either app. */}
      <TierProvider>
        <ScrollToTop />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        <Routes>
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/quote" element={<QuoteRequest />} />
            <Route path="/custom-curtains" element={<CustomCurtains />} />
            <Route path="/measure-guide" element={<MeasureGuide />} />
            <Route path="/hotel-linen" element={<Trade />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Home />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="quotes/:id" element={<QuoteBuilder />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="products" element={<Products />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="customers" element={<Customers />} />
          </Route>
        </Routes>
      </TierProvider>
    </BasketProvider>
  )
}
