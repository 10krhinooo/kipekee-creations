import { useEffect } from 'react'

/**
 * Per-route metadata, written into the head as the route changes.
 *
 * One honest limitation to know before relying on this. A Vite SPA has no
 * server render, so these tags are set by JavaScript after the document
 * loads. Google runs JavaScript and will see them. **WhatsApp, Facebook and
 * Twitter do not.** Their crawlers read the HTML as served and stop, which
 * means a product link pasted into WhatsApp shows whatever is hardcoded in
 * `index.html`, not the product.
 *
 * That matters more here than it would elsewhere, because WhatsApp is the
 * channel this business actually sells through. The fix is prerendering the
 * routes at build time, which is a separate piece of work. Until then:
 * `index.html` carries a good brand-level card that every crawler sees, and
 * this improves what Google indexes per route.
 */

export const SITE_URL = 'https://kipekee-creations.vercel.app'

export interface Seo {
  title: string
  description: string
  /** Absolute or site-relative. Defaults to the brand card. */
  image?: string
  /** Path only, e.g. `/product/kitenge-blockout-curtains`. */
  path?: string
  type?: 'website' | 'product' | 'article'
  /** Structured data for this page, serialised into a JSON-LD script tag. */
  jsonLd?: Record<string, unknown>
  /** Keeps a page out of the index: the 404, and anything behind a login. */
  noIndex?: boolean
}

const DEFAULT_IMAGE = '/photos/og-default-1600.jpg'

const absolute = (url: string) => (url.startsWith('http') ? url : `${SITE_URL}${url}`)

/**
 * Sets a meta tag, creating it if the document does not already carry one.
 * `property` for Open Graph, `name` for everything else, because Facebook
 * reads only the former and most other consumers read only the latter.
 */
function setTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

const JSON_LD_ID = 'route-json-ld'

export function useSeo({
  title,
  description,
  image = DEFAULT_IMAGE,
  path,
  type = 'website',
  jsonLd,
  noIndex = false,
}: Seo) {
  useEffect(() => {
    const url = absolute(path ?? window.location.pathname)
    const img = absolute(image)

    document.title = title
    setTag('name', 'description', description)
    setTag('name', 'robots', noIndex ? 'noindex, follow' : 'index, follow')
    setLink('canonical', url)

    setTag('property', 'og:title', title)
    setTag('property', 'og:description', description)
    setTag('property', 'og:url', url)
    setTag('property', 'og:image', img)
    setTag('property', 'og:type', type)

    setTag('name', 'twitter:card', 'summary_large_image')
    setTag('name', 'twitter:title', title)
    setTag('name', 'twitter:description', description)
    setTag('name', 'twitter:image', img)

    // One structured-data block at a time. Leaving the previous route's behind
    // would tell a crawler the About page is also a product.
    document.getElementById(JSON_LD_ID)?.remove()
    if (jsonLd) {
      const script = document.createElement('script')
      script.id = JSON_LD_ID
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }

    return () => document.getElementById(JSON_LD_ID)?.remove()
    // `jsonLd` is an object literal at every call site, so it is a new
    // reference on every render. Serialising it is what makes this effect fire
    // when the content changes rather than on every keystroke elsewhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, image, path, type, noIndex, JSON.stringify(jsonLd ?? null)])
}

/**
 * Product structured data, which is what puts a price and a rating under a
 * Google result. Only fields we can actually stand behind: no invented review
 * counts, and `availability` reflects real stock.
 */
export function productJsonLd(input: {
  name: string
  description: string
  slug: string
  price: number
  images: string[]
  inStock: boolean
  rating?: { value: number; count: number }
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    image: input.images.map(absolute),
    brand: { '@type': 'Brand', name: 'Kipekee Creations' },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${input.slug}`,
      priceCurrency: 'KES',
      price: input.price,
      availability: input.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/PreOrder',
      seller: { '@type': 'Organization', name: 'Kipekee Creations' },
    },
    // Omitted entirely rather than sent as zero when there are no reviews.
    ...(input.rating && input.rating.count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: input.rating.value,
            reviewCount: input.rating.count,
          },
        }
      : {}),
  }
}

/** The shop itself, for the homepage. */
export const organisationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HomeGoodsStore',
  name: 'Kipekee Creations',
  description:
    'Made-to-measure curtains, blinds and canopies, plus hotel linen and interior decor, from a Nairobi workshop.',
  url: SITE_URL,
  telephone: '+254722771321',
  email: 'info@kipekeecreations.co.ke',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Katani Road, off Mombasa Road',
    addressLocality: 'Nairobi',
    addressCountry: 'KE',
  },
  areaServed: 'KE',
}
