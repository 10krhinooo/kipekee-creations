import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { BasketProvider } from './store/basket'
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

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/**
 * A persistent WhatsApp button. For a Kenyan shopper this is the single
 * highest-converting control on the page, and the old site had no equivalent
 * anywhere.
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

export default function App() {
  return (
    <BasketProvider>
      <ScrollToTop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Routes>
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
        </Routes>
      </main>
      <Footer />
      <BasketDrawer />
      <WhatsAppFab />
    </BasketProvider>
  )
}
