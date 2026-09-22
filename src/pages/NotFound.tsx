import { Link } from 'react-router-dom'
import { Button, Container } from '../components/ui'
import { categories } from '../data/catalogue'
import { useSeo } from '../lib/seo'

/**
 * A real 404.
 *
 * The `*` route used to render `Home`, which meant a mistyped or retired URL
 * answered with a 200 and the homepage. That is worse than it looks: a shopper
 * following a stale WhatsApp link lands somewhere plausible and quietly loses
 * the product they were sent, and a crawler indexes the homepage under every
 * dead URL the site has ever had.
 *
 * A Vite SPA cannot set a status code from the client, so this cannot be a true
 * 404 response without the host's help. What it can do is tell the truth to the
 * person reading it and to any crawler that gets this far, which is what the
 * `noindex` tag below is for.
 */
export function NotFound() {

  useSeo({
    title: 'Page not found | Kipekee Creations',
    description: 'That page does not exist. Browse the shop instead.',
    // A dead URL must not be indexed, and the `*` route used to serve the
    // homepage under every one of them.
    noIndex: true,
  })

  return (
    <Container className="py-24 text-center">
      <p className="eyebrow mb-4 text-brand">Error 404</p>
      <h1 className="font-display text-display font-semibold text-ink">
        We can&rsquo;t find that page
      </h1>
      <p className="mx-auto mt-4 mb-8 max-w-md text-lede text-muted-foreground">
        It may have been renamed, retired, or the link may have a typo in it. The shop is still
        here.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Button to="/shop" size="lg">
          Browse the shop
        </Button>
        <Button to="/" size="lg" variant="outline">
          Back to the homepage
        </Button>
      </div>

      <div className="mx-auto mt-12 max-w-xl border-t border-line pt-8">
        <p className="eyebrow mb-4 text-muted-foreground">Or start from a category</p>
        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[14px]">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link to={`/shop?category=${c.slug}`} className="text-ink hover:text-brand">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  )
}
