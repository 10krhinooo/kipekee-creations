import { useEffect, useState } from 'react'
import { Button } from '../../components/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/shadcn/dialog'
import { categories } from '../../data/catalogue'
import {
  type ProductDraft,
  createProduct,
  slugify,
  updateProduct,
  useCatalogue,
  validate as validateDraft,
} from '../../data/catalogueStore'
import type { Product } from '../../data/types'

/**
 * Adding and editing a product from the console.
 *
 * Both jobs are the same form, because they are the same fields and splitting
 * them only produces two things to keep in step. The one difference is the
 * slug: it is derived from the name when a product is created and then left
 * alone, since it is the product's address on the shop and the key its
 * photographs and order lines are filed under. Renaming a product moves its
 * name, not its URL.
 *
 * What is not here is as deliberate as what is. Colourways, photographs,
 * specifications and care instructions all need controls of their own - a
 * colourway is a label, a swatch and a price delta, not a text box - and
 * photographs already have a screen. Putting a half-working version of each
 * in this dialog would mean staff editing them badly rather than not yet.
 */

const INPUT =
  'w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand'

/** Numbers are held as text so a field can be empty while it is being retyped. */
interface FormState {
  name: string
  category: string
  mode: Product['mode']
  price: string
  compareAt: string
  unit: string
  summary: string
  stock: string
  reorderAt: string
  leadTimeDays: string
}

const blank = (): FormState => ({
  name: '',
  category: categories[0]?.slug ?? '',
  mode: 'buy',
  price: '',
  compareAt: '',
  unit: 'each',
  summary: '',
  stock: '0',
  reorderAt: '10',
  leadTimeDays: '3',
})

const from = (p: Product): FormState => ({
  name: p.name,
  category: p.category,
  mode: p.mode,
  price: String(p.price),
  compareAt: p.compareAt ? String(p.compareAt) : '',
  unit: p.unit,
  summary: p.summary,
  stock: String(p.stock),
  reorderAt: String(p.reorderAt ?? 10),
  leadTimeDays: String(p.leadTimeDays),
})

const toDraft = (f: FormState): ProductDraft => ({
  name: f.name.trim(),
  category: f.category,
  mode: f.mode,
  price: Number(f.price),
  // Empty means there is no old price, which is a zero rather than a NaN.
  compareAt: f.compareAt.trim() ? Number(f.compareAt) : 0,
  unit: f.unit.trim(),
  summary: f.summary.trim(),
  stock: Number(f.stock),
  reorderAt: Number(f.reorderAt),
  leadTimeDays: Number(f.leadTimeDays),
})

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-console font-medium">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="mt-1 block text-console-sm text-brand">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1 block text-console-sm text-muted-foreground">{hint}</span>
      )}
    </label>
  )
}

export function ProductForm({
  open,
  onOpenChange,
  /** The product being edited, or null to create a new one. */
  product,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSaved?: (slug: string) => void
}) {
  const catalogue = useCatalogue()
  const [form, setForm] = useState<FormState>(blank)
  const [errors, setErrors] = useState<Partial<Record<keyof ProductDraft, string>>>({})

  // Reopening on a different row has to reload the fields, or the dialog shows
  // whatever was last typed into it against somebody else's product.
  useEffect(() => {
    if (!open) return
    setForm(product ? from(product) : blank())
    setErrors({})
  }, [open, product])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const draft = toDraft(form)

    if (product) {
      // Validate against the catalogue without this product in it, so keeping
      // its own name is not reported as a clash with itself.
      const others = catalogue.filter((p) => p.slug !== product.slug)
      const problems = validateDraft(draft, product.slug, others)
      if (problems) {
        setErrors(problems)
        return
      }
      updateProduct(product.slug, {
        name: draft.name,
        category: draft.category,
        mode: draft.mode,
        price: draft.price,
        compareAt: draft.compareAt > 0 ? draft.compareAt : undefined,
        unit: draft.unit,
        summary: draft.summary,
        // A quoted product is cut to order, so its shelf count and reorder
        // level mean nothing. Zeroing them stops a product that was switched
        // from ready-made sitting in the low-stock queue forever.
        stock: draft.mode === 'buy' ? draft.stock : 0,
        reorderAt: draft.mode === 'buy' ? draft.reorderAt : undefined,
        leadTimeDays: draft.leadTimeDays,
      })
      onSaved?.(product.slug)
      onOpenChange(false)
      return
    }

    const result = createProduct(draft)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    onSaved?.(result.slug)
    onOpenChange(false)
  }

  const slug = product?.slug ?? slugify(form.name)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {product ? `Edit ${product.name}` : 'Add a product'}
          </DialogTitle>
          <DialogDescription className="text-console">
            {product
              ? 'Changes show on the shop straight away.'
              : 'It goes live on the shop as soon as you save. Photographs and colourways are added afterwards.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4">
          <Field
            label="Name"
            error={errors.name}
            hint={slug ? `Address on the shop: /product/${slug}` : 'Used to build the web address.'}
          >
            <input
              className={INPUT}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              autoFocus
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" error={errors.category}>
              <select
                className={INPUT}
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Sold as"
              hint={
                form.mode === 'buy'
                  ? 'Shoppers add it to the basket and pay.'
                  : 'Shoppers ask for a quote. The price shows as a "from".'
              }
            >
              <select
                className={INPUT}
                value={form.mode}
                onChange={(e) => set('mode', e.target.value as Product['mode'])}
              >
                <option value="buy">Ready-made, buy now</option>
                <option value="quote">Made to measure, quoted</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={form.mode === 'buy' ? 'Price (KSh)' : 'From price (KSh)'}
              error={errors.price}
            >
              <input
                className={INPUT}
                inputMode="numeric"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
              />
            </Field>

            <Field label="Priced per" error={errors.unit} hint='e.g. "each", "per metre", "set of 4"'>
              <input
                className={INPUT}
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
              />
            </Field>
          </div>

          <Field
            label="Was (KSh)"
            error={errors.compareAt}
            hint="Optional. Shows struck through, with the saving on the card. Leave empty for no sale price."
          >
            <input
              className={INPUT}
              inputMode="numeric"
              placeholder="No old price"
              value={form.compareAt}
              onChange={(e) => set('compareAt', e.target.value)}
            />
          </Field>

          {form.mode === 'buy' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="In stock" error={errors.stock}>
                <input
                  className={INPUT}
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) => set('stock', e.target.value)}
                />
              </Field>
              <Field
                label="Reorder at"
                error={errors.reorderAt}
                hint="Below this it shows in the low-stock queue."
              >
                <input
                  className={INPUT}
                  inputMode="numeric"
                  value={form.reorderAt}
                  onChange={(e) => set('reorderAt', e.target.value)}
                />
              </Field>
            </div>
          )}

          <Field
            label="Lead time (days)"
            error={errors.leadTimeDays}
            hint={form.mode === 'buy' ? 'Days to dispatch.' : 'Working days from approved quote to fitting.'}
          >
            <input
              className={INPUT}
              inputMode="numeric"
              value={form.leadTimeDays}
              onChange={(e) => set('leadTimeDays', e.target.value)}
            />
          </Field>

          <Field label="Summary" hint="The line under the name on the shop listing.">
            <textarea
              rows={3}
              className={INPUT}
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {product ? 'Save changes' : 'Add product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
