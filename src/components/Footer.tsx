import { Link } from 'react-router-dom'
import { categories } from '../data/catalogue'
import {
  Button,
  Container,
  FacebookIcon,
  InstagramIcon,
  MAP_URL,
  TikTokIcon,
  WhatsAppIcon,
  whatsappLink,
} from './ui'

/** Real profile URLs to follow once the brand's accounts are live. */
const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#', Icon: InstagramIcon },
  { label: 'Facebook', href: '#', Icon: FacebookIcon },
  { label: 'TikTok', href: '#', Icon: TikTokIcon },
]

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-ink text-white/80">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="font-display text-xl font-bold text-white">Kipekee</span>
          <span className="mb-4 block text-[10px] tracking-[0.28em] text-brand-400 uppercase">
            Creations
          </span>
          <p className="max-w-xs text-sm leading-relaxed">
            Interior decor and made-to-measure soft furnishings for homes, hotels, architects and
            property managers across Kenya. Sewing on Katani Road, off Mombasa Road, since 2012.
          </p>
          <Button
            variant="whatsapp"
            size="sm"
            className="mt-5"
            href={whatsappLink('Hello Kipekee, I would like to talk about a project.')}
          >
            <WhatsAppIcon />
            WhatsApp us
          </Button>

          <div className="mt-5 flex items-center gap-3">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="rounded-full border border-white/15 p-2 text-white/70 transition-colors hover:border-white/30 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-white">Shop</h3>
          <ul className="space-y-1 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to={`/shop?category=${c.slug}`} className="inline-block py-1 hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-white">Help</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <Link to="/measure-guide" className="inline-block py-1 hover:text-white">
                How to measure your windows
              </Link>
            </li>
            <li>
              <Link to="/custom-curtains" className="inline-block py-1 hover:text-white">
                Made-to-measure process
              </Link>
            </li>
            <li>
              <Link to="/hotel-linen" className="inline-block py-1 hover:text-white">
                Trade &amp; hotel pricing
              </Link>
            </li>
            <li>
              <Link to="/contact" className="inline-block py-1 hover:text-white">
                Delivery &amp; returns
              </Link>
            </li>
            <li>
              <Link to="/about" className="inline-block py-1 hover:text-white">
                About us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-white">Visit the showroom</h3>
          <address className="space-y-2.5 text-sm not-italic">
            <p>
              <a
                href={MAP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-block py-1 hover:text-white"
              >
                Katani Road, off Mombasa Road, Nairobi
              </a>
            </p>
            <p>Mon–Fri 8.30am–5.30pm · Sat 9am–3pm</p>
            <p>
              <a href="tel:+254721527797" className="inline-block py-1 hover:text-white">
                0721 527 797
              </a>{' '}
              ·{' '}
              <a href="tel:+254722771321" className="inline-block py-1 hover:text-white">
                0722 771 321
              </a>
            </p>
            <p>
              <a href="mailto:info@kipekeecreations.co.ke" className="inline-block py-1 hover:text-white">
                info@kipekeecreations.co.ke
              </a>
            </p>
          </address>

          <div className="mt-5 flex items-center gap-2">
            <span className="rounded border border-white/20 px-2 py-1 text-[10px] font-semibold tracking-wide">
              M-PESA
            </span>
            <span className="rounded border border-white/20 px-2 py-1 text-[10px] font-semibold tracking-wide">
              VISA
            </span>
            <span className="rounded border border-white/20 px-2 py-1 text-[10px] font-semibold tracking-wide">
              MASTERCARD
            </span>
          </div>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-5 text-[12px] sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Kipekee Creations. All rights reserved.</p>
          <p className="text-white/50">Prices in Kenya Shillings, inclusive of VAT.</p>
        </Container>
      </div>
    </footer>
  )
}
