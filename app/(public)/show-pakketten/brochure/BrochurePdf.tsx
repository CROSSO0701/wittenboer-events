import path from 'node:path'
import { readFile } from 'node:fs/promises'
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
  renderToBuffer,
} from '@react-pdf/renderer'
import { fmtEUR, featureList, type Pkg } from './data'

// Anton (huisstijl-display) registreren vanaf het lokale TTF.
Font.register({
  family: 'Anton',
  src: path.join(process.cwd(), 'public', 'fonts', 'Anton-Regular.ttf'),
})
// Geen woordafbreking met streepjes in de PDF.
Font.registerHyphenationCallback((word) => [word])

const C = {
  dark: '#2A3840',
  dark2: '#3B4D54',
  ink: '#1E2A2F',
  sub: '#3E3F42',
  muted: '#6B6F72',
  teal: '#157A8C',
  sand: '#D9C5B2',
  sandDeep: '#B8A088',
  border: '#DCDEE0',
  onDark: '#F5F5F6',
  onDarkMuted: '#AFC0C7',
  white: '#FFFFFF',
}

const s = StyleSheet.create({
  page: { backgroundColor: C.white, color: C.ink, fontFamily: 'Helvetica', fontSize: 10 },
  // Cover
  cover: { flexDirection: 'column', backgroundColor: C.dark, color: C.onDark, height: '100%' },
  coverTop: { padding: 48, paddingBottom: 28 },
  coverHero: { flexGrow: 1, position: 'relative' },
  coverHeroImg: { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' },
  coverHeroFade: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(42,56,64,0.45)' },
  coverFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: C.dark2,
    backgroundColor: C.dark,
  },
  logo: { width: 64, height: 64, objectFit: 'contain', marginBottom: 18 },
  kicker: { color: C.sand, fontSize: 9, letterSpacing: 2, marginBottom: 10 },
  kickerTeal: { color: C.teal, fontSize: 9, letterSpacing: 2, marginBottom: 8 },
  h1: { fontFamily: 'Anton', fontSize: 46, lineHeight: 1.02, color: C.onDark },
  lead: { fontSize: 11.5, lineHeight: 1.55, color: C.onDarkMuted, marginTop: 16, maxWidth: 380 },
  footCol: { fontSize: 8.5, lineHeight: 1.5, color: C.onDarkMuted },
  footStrong: { color: C.onDark, fontFamily: 'Helvetica-Bold' },
  // Package page
  pkgImgWrap: { height: 300, backgroundColor: C.dark, position: 'relative' },
  pkgImg: { width: '100%', height: '100%', objectFit: 'cover' },
  badge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: C.teal,
    color: C.white,
    fontSize: 8,
    letterSpacing: 1.5,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
  },
  pkgBody: { padding: 48, paddingTop: 30, flexGrow: 1 },
  pkgNum: { fontFamily: 'Anton', fontSize: 12, color: C.sandDeep, letterSpacing: 1 },
  h2: { fontFamily: 'Anton', fontSize: 40, color: C.ink, marginTop: 4, lineHeight: 1.0 },
  pkgDesc: { fontSize: 11, lineHeight: 1.55, color: C.sub, marginTop: 12, maxWidth: 420 },
  metaRow: {
    flexDirection: 'row',
    marginTop: 22,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  metaCell: { marginRight: 56 },
  metaLabel: { fontSize: 8, letterSpacing: 1.5, color: C.muted },
  metaValue: { fontFamily: 'Anton', fontSize: 20, color: C.ink, marginTop: 3 },
  sectionLabel: { fontSize: 9, letterSpacing: 1.5, color: C.muted, marginTop: 26, marginBottom: 6 },
  feat: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#EDEEEF' },
  featDot: { width: 4, height: 4, borderRadius: 999, backgroundColor: C.teal, marginTop: 5, marginRight: 9 },
  featText: { fontSize: 10.5, color: C.ink, flex: 1 },
  pageFoot: {
    position: 'absolute',
    bottom: 26,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: C.muted,
  },
  // Closing
  closing: { padding: 48, height: '100%' },
  inclItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#EDEEEF' },
  inclText: { fontSize: 10.5, lineHeight: 1.5, color: C.ink, flex: 1 },
  inclStrong: { fontFamily: 'Helvetica-Bold', color: C.ink },
  ctaBox: { marginTop: 32, backgroundColor: C.dark, color: C.onDark, borderRadius: 10, padding: 30 },
  ctaH: { fontFamily: 'Anton', fontSize: 28, color: C.onDark },
  ctaP: { fontSize: 10.5, lineHeight: 1.55, color: C.onDarkMuted, marginTop: 10, maxWidth: 420 },
  ctaBig: { fontFamily: 'Anton', fontSize: 15, color: C.sand, marginTop: 18 },
})

// Bestand → data-URI (betrouwbaar in @react-pdf). Ontbreekt het bestand, dan null.
async function dataUri(rel: string, mime: string): Promise<string | null> {
  try {
    const buf = await readFile(path.join(process.cwd(), rel))
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

const INCLUDED = [
  ['Transport.', 'Wij brengen alles in onze eigen bus. Binnen 50 km rond Den Bosch zonder voorrijkosten.'],
  ['Opbouw & afbouw.', 'Twee technici komen 2-4 uur voor aanvang. Na afloop alles weer mee.'],
  ['Programmering.', 'Lichtshow vooraf geprogrammeerd, op de avond zelf iemand achter de console.'],
  ['Aanspreekpunt.', 'Eén nummer voor de hele avond. Iets gaat fout? Wij lossen het op.'],
]

export async function renderBrochurePdf(packages: Pkg[]): Promise<Buffer> {
  const logo = await dataUri('public/logo/we-mark.png', 'image/png')
  const imgs: Record<string, string | null> = {}
  for (const p of packages) imgs[p.slug] = await dataUri(`public/photos/show-packages/${p.slug}.jpg`, 'image/jpeg')
  const hero = imgs['truss-show'] ?? Object.values(imgs).find(Boolean) ?? null

  const doc = (
    <Document title="Wittenboer Events — Showpakketten" author="Wittenboer Events">
      {/* COVER */}
      <Page size="A4" style={s.page}>
        <View style={s.cover}>
          <View style={s.coverTop}>
            {logo ? <Image src={logo} style={s.logo} /> : null}
            <Text style={s.kicker}>SHOWPAKKETTEN · BROCHURE</Text>
            <Text style={s.h1}>VIER SHOWS,{'\n'}ÉÉN TELEFOONTJE.</Text>
            <Text style={s.lead}>
              Kant-en-klare licht- en geluidsproducties voor bruiloften, jubilea, verjaardagen en
              bedrijfsfeesten. Wij brengen, bouwen op, draaien de show, breken af. Jij bevestigt
              alleen de datum.
            </Text>
          </View>
          <View style={s.coverHero}>
            {hero ? <Image src={hero} style={s.coverHeroImg} /> : null}
            <View style={s.coverHeroFade} />
          </View>
          <View style={s.coverFoot}>
            <Text style={s.footCol}>
              <Text style={s.footStrong}>Wittenboer Events</Text>
              {'\n'}Het Schild 35{'\n'}5275 EE Den Dungen
            </Text>
            <Text style={s.footCol}>
              06 27 17 28 76{'\n'}info@wittenboerevents.nl
            </Text>
            <Text style={s.footCol}>
              wittenboerevents.nl{'\n'}KVK 65834921
            </Text>
          </View>
        </View>
      </Page>

      {/* PACKAGE PAGES */}
      {packages.map((p, idx) => {
        const img = imgs[p.slug]
        return (
          <Page size="A4" style={s.page} key={p.slug}>
            <View style={s.pkgImgWrap}>
              {img ? <Image src={img} style={s.pkgImg} /> : null}
              {p.is_popular ? <Text style={s.badge}>POPULAIRSTE</Text> : null}
            </View>
            <View style={s.pkgBody}>
              <Text style={s.pkgNum}>{String(idx + 1).padStart(2, '0')} / SHOWPAKKET</Text>
              <Text style={s.h2}>{(p.name ?? '').toUpperCase()}</Text>
              {p.description ? <Text style={s.pkgDesc}>{p.description}</Text> : null}
              <View style={s.metaRow}>
                <View style={s.metaCell}>
                  <Text style={s.metaLabel}>PRIJS</Text>
                  <Text style={s.metaValue}>vanaf {fmtEUR(p.price_from_cents)}</Text>
                </View>
                <View style={s.metaCell}>
                  <Text style={s.metaLabel}>GASTEN</Text>
                  <Text style={s.metaValue}>
                    {p.guest_capacity_min ?? '-'}–{p.guest_capacity_max ?? '-'}
                  </Text>
                </View>
              </View>
              <Text style={s.sectionLabel}>INBEGREPEN</Text>
              {featureList(p).map((f) => (
                <View style={s.feat} key={f}>
                  <View style={s.featDot} />
                  <Text style={s.featText}>{f}</Text>
                </View>
              ))}
            </View>
            <View style={s.pageFoot} fixed>
              <Text>Wittenboer Events · Showpakketten</Text>
              <Text>06 27 17 28 76 · wittenboerevents.nl</Text>
            </View>
          </Page>
        )
      })}

      {/* CLOSING */}
      <Page size="A4" style={s.page}>
        <View style={s.closing}>
          <Text style={s.kickerTeal}>BIJ ELK PAKKET</Text>
          <Text style={s.h2}>ÉÉN PRIJS.{'\n'}GEEN VERRASSINGEN.</Text>
          <View style={{ marginTop: 22 }}>
            {INCLUDED.map(([t, d]) => (
              <View style={s.inclItem} key={t}>
                <View style={s.featDot} />
                <Text style={s.inclText}>
                  <Text style={s.inclStrong}>{t} </Text>
                  {d}
                </Text>
              </View>
            ))}
          </View>
          <View style={s.ctaBox}>
            <Text style={s.ctaH}>RESERVEER EEN PAKKET</Text>
            <Text style={s.ctaP}>
              Stuur een korte aanvraag met datum, locatie en welk pakket je in gedachten hebt. Je
              krijgt binnen één werkdag een offerte met vaste prijs.
            </Text>
            <Text style={s.ctaBig}>06 27 17 28 76 · info@wittenboerevents.nl</Text>
          </View>
        </View>
      </Page>
    </Document>
  )

  return renderToBuffer(doc)
}
