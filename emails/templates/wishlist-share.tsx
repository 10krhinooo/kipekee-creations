import { Text } from '@react-email/components'
import { Shell } from '../components/Shell.tsx'
import { Cta, Line, Panel } from '../components/Bits.tsx'
import { S, v } from '../qute.tsx'
import { text } from '../theme.ts'

/**
 * Data: shopUrl, items[{ name, detail, price, url }]
 * Sent by: WishlistEmailResource. No account needed, which is the point: this
 * is how a guest keeps a list without one.
 */
export default function WishlistShare() {
  return (
    <Shell
      preview="The Kipekee pieces you saved, so you can find them again"
      eyebrow="Your saved list"
      footNote="You are getting this because you asked us to email you a list you saved. We do not add this address to anything else."
    >
      <Text style={text.h1}>The pieces you saved</Text>
      <Text style={text.body}>
        Here is your list, so it is somewhere safe rather than only on one browser. Prices are what
        they were when you saved them and can change.
      </Text>

      <S t="#for item in items" />
      <Line title={v('item.name')} detail={v('item.detail')} amount={v('item.price')} />
      <S t="/for" />

      <Cta href={v('shopUrl')}>Open my list on the site</Cta>

      <Panel heading="Want a price for a whole room?">
        <Text style={{ ...text.small, margin: 0 }}>
          Made-to-measure work is quoted, not bought off the shelf. Send us the room and we measure
          it free anywhere in Nairobi, then give you a fixed written price valid 30 days.
        </Text>
      </Panel>
    </Shell>
  )
}
