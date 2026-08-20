import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCatalogue } from '../../store/catalogue'
import { rooms } from '../../data/catalogue'
import { Button, cx } from '../../components/ui'
import { Card, CardHeader, PageHeader } from '../components/AdminUI'
import {
  createProduct,
  updateProduct,
  withdrawProduct,
  useAdminProduct,
  useStock,
  type AdminVariant,
  type ProductPayload,
} from '../data/api'

const PATTERNS = ['plain', 'weave', 'embroidery', 'geometric', 'damask', 'stripe', 'sheer', 'iron', 'ceramic']

type VariantRow = { id: string; label: string; swatch: string; delta: string; inStock: boolean }
type SpecRow = { label: string; value: string }

const blankVariant = (): VariantRow => ({ id: '', label: '', swatch: '', delta: '0', inStock: true })
const blankSpec = (): SpecRow => ({ label: '', value: '' })

interface FormState {
  name: string
  category: string
  mode: 'buy' | 'quote'
  price: string
  compareAt: string
  unit: string
  summary: string
  description: string[]
  rooms: string[]
  care: string[]
  badges: string[]
  pattern: string
  accent: string
  stock: string
  reorderAt: string
  leadTimeDays: string
  bestSeller: boolean
  isPublished: boolean
  colours: VariantRow[]
  sizes: VariantRow[]
  specs: SpecRow[]
}

const blank = (categorySlug: string, mode: 'buy' | 'quote', pattern: string, accent: string): FormState => ({
  name: '',
  category: categorySlug,
  mode,
  price: '',
  compareAt: '',
  unit: 'each',
  summary: '',
  description: [''],
  rooms: [],
  care: [],
  badges: [],
  pattern,
  accent,
  stock: '0',
  reorderAt: '5',
  leadTimeDays: '1',
  bestSeller: false,
  isPublished: false,
  colours: [blankVariant()],
  sizes: [],
  specs: [],
})

const toVariantRow = (v: AdminVariant): VariantRow => ({
  id: v.id,
  label: v.label,
  swatch: v.swatch ?? '',
  delta: String(v.delta),
  inStock: v.inStock,
})

/**
 * Creates or replaces a product. One form for both, since `ProductPayload` on
 * the backend is a full replacement either way; a patch would make "cleared
 * the badges" indistinguishable from "left them alone", so the editor always
 * submits everything it shows.
 */
export function ProductEditor() {
  const { slug } = useParams()
  const editing = Boolean(slug)
  const navigate = useNavigate()
  const { categories, reload: reloadCatalogue } = useCatalogue()
  const { data: existing, loading, error } = useAdminProduct(slug ?? '', editing)
  // `ProductDetail` (the single-product read) carries no `reorderAt` - only the
  // list endpoint's `StockRow` does - so the current low-stock threshold comes
  // from there instead of being reset to a guess on every save.
  const { data: stockRows } = useStock()

  const [form, setForm] = useState<FormState | null>(editing ? null : null)
  const [saving, setSaving] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => {
    if (editing) {
      if (!existing) return
      setForm({
        name: existing.name,
        category: existing.category,
        mode: existing.mode,
        price: String(existing.price),
        compareAt: existing.compareAt != null ? String(existing.compareAt) : '',
        unit: existing.unit,
        summary: existing.summary,
        description: existing.description,
        rooms: existing.rooms,
        care: existing.care,
        badges: existing.badges,
        pattern: existing.pattern,
        accent: existing.accent,
        stock: String(existing.stock),
        reorderAt: String(stockRows?.find((s) => s.slug === slug)?.reorderAt ?? 5),
        leadTimeDays: String(existing.leadTimeDays),
        bestSeller: existing.bestSeller,
        isPublished: existing.isPublished,
        colours: existing.colours.map(toVariantRow),
        sizes: (existing.sizes ?? []).map(toVariantRow),
        specs: existing.specs,
      })
    } else if (categories.length > 0 && !form) {
      setForm(blank(categories[0].slug, 'buy', categories[0].pattern, categories[0].accent))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, existing, categories, stockRows])

  if (editing && loading) return <p className="text-sm text-muted">Loading product…</p>
  if (editing && error) return <p className="text-sm text-brand">{error}</p>
  if (!form) return <p className="text-sm text-muted">Loading…</p>

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))

  const toggleRoom = (room: string) =>
    set('rooms', form.rooms.includes(room) ? form.rooms.filter((r) => r !== room) : [...form.rooms, room])

  const save = async () => {
    if (form.colours.filter((c) => c.label.trim()).length === 0) {
      setProblem('Add at least one colour. The storefront picks a default colour from the first one.')
      return
    }
    setProblem(null)
    setSaving(true)

    const payload: ProductPayload = {
      name: form.name.trim(),
      category: form.category,
      mode: form.mode,
      price: Math.max(0, Math.round(Number(form.price) || 0)),
      compareAt: form.compareAt.trim() ? Math.round(Number(form.compareAt)) : null,
      unit: form.unit.trim() || 'each',
      summary: form.summary.trim(),
      description: form.description.map((d) => d.trim()).filter(Boolean),
      rooms: form.rooms,
      care: form.care.map((c) => c.trim()).filter(Boolean),
      badges: form.badges.map((b) => b.trim()).filter(Boolean),
      pattern: form.pattern,
      accent: form.accent,
      stock: Math.max(0, Math.round(Number(form.stock) || 0)),
      reorderAt: Math.max(0, Math.round(Number(form.reorderAt) || 0)),
      leadTimeDays: Math.max(0, Math.round(Number(form.leadTimeDays) || 0)),
      bestSeller: form.bestSeller,
      isPublished: form.isPublished,
      colours: form.colours
        .filter((c) => c.label.trim())
        .map((c) => ({
          id: c.id || undefined,
          label: c.label.trim(),
          swatch: c.swatch.trim() || undefined,
          delta: Math.round(Number(c.delta) || 0),
          inStock: c.inStock,
        })),
      sizes: form.sizes
        .filter((s) => s.label.trim())
        .map((s) => ({
          id: s.id || undefined,
          label: s.label.trim(),
          swatch: s.swatch.trim() || undefined,
          delta: Math.round(Number(s.delta) || 0),
          inStock: s.inStock,
        })),
      specs: form.specs
        .filter((s) => s.label.trim() && s.value.trim())
        .map((s) => ({ label: s.label.trim(), value: s.value.trim() })),
    }

    const result = editing && slug ? await updateProduct(slug, payload) : await createProduct(payload)
    setSaving(false)

    if (!result.ok) {
      setProblem(result.message)
      return
    }
    reloadCatalogue()
    navigate(`/admin/products/${result.data.slug}/photos`)
  }

  const withdraw = async () => {
    if (!slug || !confirm(`Withdraw ${form.name}? It stays on past orders and quotes but leaves the shop.`)) return
    setWithdrawing(true)
    const result = await withdrawProduct(slug)
    setWithdrawing(false)
    if (result.ok) {
      reloadCatalogue()
      navigate('/admin/products')
    } else {
      setProblem(result.message)
    }
  }

  return (
    <>
      <PageHeader
        title={editing ? `Edit: ${form.name || slug}` : 'Add product'}
        intro={
          editing
            ? 'Every field here is sent together, so leaving one blank clears it rather than leaving it alone.'
            : 'Photos come next, once the product exists to attach them to.'
        }
        action={
          <div className="flex items-center gap-3">
            {editing && (
              <button
                onClick={withdraw}
                disabled={withdrawing}
                className="text-[13px] text-brand hover:underline"
              >
                {withdrawing ? 'Withdrawing…' : 'Withdraw'}
              </button>
            )}
            <Button size="sm" variant="outline" to="/admin/products">
              Cancel
            </Button>
          </div>
        }
      />

      {problem && (
        <p className="mb-5 rounded-lg bg-brand-50 px-3 py-2 text-[13px] text-brand-700">{problem}</p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Basics" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={form.name} onChange={(v) => set('name', v)} className="sm:col-span-2" />
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium">Category</span>
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium">Sold as</span>
                <select
                  value={form.mode}
                  onChange={(e) => set('mode', e.target.value as 'buy' | 'quote')}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  <option value="buy">Buy now</option>
                  <option value="quote">Made to measure (quoted)</option>
                </select>
              </label>
              <Field
                label={form.mode === 'quote' ? 'Indicative price (from)' : 'Price'}
                type="number"
                value={form.price}
                onChange={(v) => set('price', v)}
              />
              <Field label="Compare-at price" type="number" value={form.compareAt} onChange={(v) => set('compareAt', v)} />
              <Field label="Unit" value={form.unit} onChange={(v) => set('unit', v)} placeholder="each, per metre, per pair…" />
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[13px] font-medium">Summary</span>
                <textarea
                  rows={2}
                  value={form.summary}
                  onChange={(e) => set('summary', e.target.value)}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </label>
            </div>
          </Card>

          <Card>
            <CardHeader title="Description" hint="One paragraph per line, in the order they read on the product page." />
            <ListField values={form.description} onChange={(v) => set('description', v)} placeholder="A paragraph about the product" multiline />
          </Card>

          <Card>
            <CardHeader title="Rooms" />
            <div className="flex flex-wrap gap-2">
              {rooms.map((room) => (
                <label
                  key={room}
                  className={cx(
                    'cursor-pointer rounded-full border px-3 py-1.5 text-[13px]',
                    form.rooms.includes(room) ? 'border-brand bg-brand-50 text-brand' : 'border-line text-ink-soft',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form.rooms.includes(room)}
                    onChange={() => toggleRoom(room)}
                    className="hidden"
                  />
                  {room}
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Colours" hint="The first is the default a shopper sees." />
            <VariantList rows={form.colours} onChange={(v) => set('colours', v)} withSwatch />
          </Card>

          <Card>
            <CardHeader title="Sizes" hint="Leave empty if this product does not come in sizes." />
            <VariantList rows={form.sizes} onChange={(v) => set('sizes', v)} />
          </Card>

          <Card>
            <CardHeader title="Specifications" />
            <SpecList rows={form.specs} onChange={(v) => set('specs', v)} />
          </Card>

          <Card>
            <CardHeader title="Care instructions" />
            <ListField values={form.care} onChange={(v) => set('care', v)} placeholder="Machine wash cold, line dry" />
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Stock and lead time" />
            <div className="space-y-4">
              {form.mode === 'buy' ? (
                <>
                  <Field label="Stock" type="number" value={form.stock} onChange={(v) => set('stock', v)} />
                  <Field label="Reorder at" type="number" value={form.reorderAt} onChange={(v) => set('reorderAt', v)} />
                </>
              ) : (
                <p className="text-[13px] text-muted">Made-to-measure work is not held in stock.</p>
              )}
              <Field label="Lead time (days)" type="number" value={form.leadTimeDays} onChange={(v) => set('leadTimeDays', v)} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Appearance" />
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium">Pattern</span>
                <select
                  value={form.pattern}
                  onChange={(e) => set('pattern', e.target.value)}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  {PATTERNS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium">Accent colour</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(form.accent) ? form.accent : '#a11c20'}
                    onChange={(e) => set('accent', e.target.value)}
                    className="h-10 w-12 shrink-0 rounded-lg border border-line"
                  />
                  <input
                    value={form.accent}
                    onChange={(e) => set('accent', e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </div>
              </label>
            </div>
          </Card>

          <Card>
            <CardHeader title="Badges" hint="e.g. Best seller, Cuttings available" />
            <ListField values={form.badges} onChange={(v) => set('badges', v)} placeholder="Badge text" />
          </Card>

          <Card>
            <CardHeader title="Visibility" />
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[13px] text-ink-soft">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => set('isPublished', e.target.checked)}
                  className="h-4 w-4 accent-[#a11c20]"
                />
                Published, visible on the storefront
              </label>
              <label className="flex items-center gap-2 text-[13px] text-ink-soft">
                <input
                  type="checkbox"
                  checked={form.bestSeller}
                  onChange={(e) => set('bestSeller', e.target.checked)}
                  className="h-4 w-4 accent-[#a11c20]"
                />
                Flag as best seller
              </label>
            </div>
          </Card>

          <Button full size="lg" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </div>
    </>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  className,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  className?: string
}) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
      />
    </label>
  )
}

/** A reorderable-by-editing list of plain strings: description paragraphs, care lines, badges. */
function ListField({
  values,
  onChange,
  placeholder,
  multiline,
}: {
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  multiline?: boolean
}) {
  const rows = values.length ? values : ['']
  const update = (i: number, v: string) => onChange(rows.map((r, idx) => (idx === i ? v : r)))
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))
  const add = () => onChange([...rows, ''])

  return (
    <div className="space-y-2">
      {rows.map((row, i) =>
        multiline ? (
          <div key={i} className="flex gap-2">
            <textarea
              rows={2}
              value={row}
              placeholder={placeholder}
              onChange={(e) => update(i, e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-brand"
            />
            <button onClick={() => remove(i)} className="shrink-0 self-start text-[12px] text-muted hover:text-brand">
              Remove
            </button>
          </div>
        ) : (
          <div key={i} className="flex gap-2">
            <input
              value={row}
              placeholder={placeholder}
              onChange={(e) => update(i, e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-brand"
            />
            <button onClick={() => remove(i)} className="shrink-0 text-[12px] text-muted hover:text-brand">
              Remove
            </button>
          </div>
        ),
      )}
      <button onClick={add} className="text-[12.5px] font-medium text-brand hover:underline">
        + Add line
      </button>
    </div>
  )
}

function VariantList({
  rows,
  onChange,
  withSwatch,
}: {
  rows: VariantRow[]
  onChange: (v: VariantRow[]) => void
  withSwatch?: boolean
}) {
  const update = (i: number, patch: Partial<VariantRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))
  const add = () => onChange([...rows, blankVariant()])

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-line p-3 sm:grid-cols-5 sm:items-center">
          <input
            value={row.label}
            placeholder="Label, e.g. Charcoal"
            onChange={(e) => update(i, { label: e.target.value })}
            className="rounded-lg border border-line px-2.5 py-2 text-[13px] outline-none focus:border-brand sm:col-span-2"
          />
          {withSwatch && (
            <input
              value={row.swatch}
              placeholder="#hex"
              onChange={(e) => update(i, { swatch: e.target.value })}
              className="rounded-lg border border-line px-2.5 py-2 text-[13px] outline-none focus:border-brand"
            />
          )}
          <input
            type="number"
            value={row.delta}
            placeholder="Price delta"
            onChange={(e) => update(i, { delta: e.target.value })}
            className="rounded-lg border border-line px-2.5 py-2 text-[13px] outline-none focus:border-brand"
          />
          <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
            <input
              type="checkbox"
              checked={row.inStock}
              onChange={(e) => update(i, { inStock: e.target.checked })}
              className="h-4 w-4 accent-[#a11c20]"
            />
            In stock
          </label>
          <button onClick={() => remove(i)} className="text-[12px] text-muted hover:text-brand">
            Remove
          </button>
        </div>
      ))}
      <button onClick={add} className="text-[12.5px] font-medium text-brand hover:underline">
        + Add
      </button>
    </div>
  )
}

function SpecList({ rows, onChange }: { rows: SpecRow[]; onChange: (v: SpecRow[]) => void }) {
  const update = (i: number, patch: Partial<SpecRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))
  const add = () => onChange([...rows, blankSpec()])

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={row.label}
            placeholder="Label, e.g. Composition"
            onChange={(e) => update(i, { label: e.target.value })}
            className="w-2/5 rounded-lg border border-line px-2.5 py-2 text-[13px] outline-none focus:border-brand"
          />
          <input
            value={row.value}
            placeholder="Value"
            onChange={(e) => update(i, { value: e.target.value })}
            className="w-full rounded-lg border border-line px-2.5 py-2 text-[13px] outline-none focus:border-brand"
          />
          <button onClick={() => remove(i)} className="shrink-0 text-[12px] text-muted hover:text-brand">
            Remove
          </button>
        </div>
      ))}
      <button onClick={add} className="text-[12.5px] font-medium text-brand hover:underline">
        + Add
      </button>
    </div>
  )
}
