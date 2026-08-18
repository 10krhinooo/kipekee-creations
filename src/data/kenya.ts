/**
 * All 47 Kenyan counties, for the checkout delivery selector.
 *
 * Delivery days are tiered rather than looked up per county because the
 * business doesn't have a courier rate card that granular yet: Nairobi ships
 * next day, the other main urban centres in 2-3 days, everywhere else in
 * 3-4. `id` values are stable slugs so `Checkout.tsx`'s "Pay on delivery"
 * gate (Nairobi only) keeps working off `county === 'nairobi'` regardless of
 * how the label text changes.
 */
export interface KenyaCounty {
  id: string
  name: string
}

const FAST_TIER = new Set(['mombasa', 'kisumu', 'nakuru', 'eldoret-uasin-gishu', 'kiambu', 'machakos'])

export const KENYA_COUNTIES: KenyaCounty[] = [
  { id: 'nairobi', name: 'Nairobi' },
  { id: 'mombasa', name: 'Mombasa' },
  { id: 'kwale', name: 'Kwale' },
  { id: 'kilifi', name: 'Kilifi' },
  { id: 'tana-river', name: 'Tana River' },
  { id: 'lamu', name: 'Lamu' },
  { id: 'taita-taveta', name: 'Taita-Taveta' },
  { id: 'garissa', name: 'Garissa' },
  { id: 'wajir', name: 'Wajir' },
  { id: 'mandera', name: 'Mandera' },
  { id: 'marsabit', name: 'Marsabit' },
  { id: 'isiolo', name: 'Isiolo' },
  { id: 'meru', name: 'Meru' },
  { id: 'tharaka-nithi', name: 'Tharaka-Nithi' },
  { id: 'embu', name: 'Embu' },
  { id: 'kitui', name: 'Kitui' },
  { id: 'machakos', name: 'Machakos' },
  { id: 'makueni', name: 'Makueni' },
  { id: 'nyandarua', name: 'Nyandarua' },
  { id: 'nyeri', name: 'Nyeri' },
  { id: 'kirinyaga', name: 'Kirinyaga' },
  { id: 'muranga', name: "Murang'a" },
  { id: 'kiambu', name: 'Kiambu' },
  { id: 'turkana', name: 'Turkana' },
  { id: 'west-pokot', name: 'West Pokot' },
  { id: 'samburu', name: 'Samburu' },
  { id: 'trans-nzoia', name: 'Trans Nzoia' },
  { id: 'eldoret-uasin-gishu', name: 'Uasin Gishu' },
  { id: 'elgeyo-marakwet', name: 'Elgeyo-Marakwet' },
  { id: 'nandi', name: 'Nandi' },
  { id: 'baringo', name: 'Baringo' },
  { id: 'laikipia', name: 'Laikipia' },
  { id: 'nakuru', name: 'Nakuru' },
  { id: 'narok', name: 'Narok' },
  { id: 'kajiado', name: 'Kajiado' },
  { id: 'kericho', name: 'Kericho' },
  { id: 'bomet', name: 'Bomet' },
  { id: 'kakamega', name: 'Kakamega' },
  { id: 'vihiga', name: 'Vihiga' },
  { id: 'bungoma', name: 'Bungoma' },
  { id: 'busia', name: 'Busia' },
  { id: 'siaya', name: 'Siaya' },
  { id: 'kisumu', name: 'Kisumu' },
  { id: 'homa-bay', name: 'Homa Bay' },
  { id: 'migori', name: 'Migori' },
  { id: 'kisii', name: 'Kisii' },
  { id: 'nyamira', name: 'Nyamira' },
]

export const deliveryEtaFor = (countyId: string): string => {
  if (countyId === 'nairobi') return 'next day'
  if (FAST_TIER.has(countyId)) return '2–3 days'
  return '3–4 days'
}
