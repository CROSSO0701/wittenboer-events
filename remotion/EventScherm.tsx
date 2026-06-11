import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
} from 'remotion'
import { loadFont as loadAnton } from '@remotion/google-fonts/Anton'
import { loadFont as loadFigtree } from '@remotion/google-fonts/Figtree'

const anton = loadAnton()
const figtree = loadFigtree()

export const FPS = 30
export const DURATION_FRAMES = Math.round(29.5 * FPS) // 29,5 sec — safe onder de 30

// Huisstijl (zelfde tokens als globals.css / event-scherm.html)
const C = {
  dark: '#1A242C',
  teal: '#157A8C',
  tealBright: '#2BA3B8',
  sand: '#D9C5B2',
  onDark: '#F5F5F6',
  onDarkMuted: '#AFC0C7',
}

const EASE = Easing.bezier(0.16, 1, 0.3, 1)

const WORDS = ['licht.', 'geluid.', 'podium.', 'crew.']
const WORD_START = 2.3 // eerste wissel (s)
const WORD_EVERY = 2.6 // wisselinterval (s)
const WORD_ANIM = 0.65 // duur van de wissel (s)
const MAX_SWAPS = 9

// rise-in helper: opacity + translateY vanaf een starttijd
function rise(t: number, start: number, dur = 1.0, dy = 32) {
  const p = interpolate(t, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  })
  return { opacity: p, transform: `translateY(${(1 - p) * dy}px)` }
}

// ====== Lichtbundels ======
const BEAMS = [
  { left: '6%', rot: 14, teal: false, delay: 0.1, phase: 0.0 },
  { left: '24%', rot: 7, teal: true, delay: 0.3, phase: 2.1 },
  { left: '46%', rot: 0, teal: false, delay: 0.0, phase: 4.2, wide: true },
  { left: '66%', rot: -7, teal: true, delay: 0.4, phase: 1.3 },
  { left: '84%', rot: -14, teal: false, delay: 0.2, phase: 3.4 },
]

function Beam({ b, t }: { b: (typeof BEAMS)[number]; t: number }) {
  const local = t - b.delay
  // power-on flikker (zelfde keyframes als CSS beamOn)
  const opacity = interpolate(
    local,
    [0, 0.11, 0.2, 0.31, 1.4],
    [0, 0.9, 0.12, 0.75, 0.55],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  // sway na power-on
  const swayP = interpolate(local, [1.4, 2.4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const sway = Math.sin(((local - 1.4) * 2 * Math.PI) / 14 + b.phase) * 23 * swayP
  const color = b.teal ? '43,163,184' : '217,197,178'
  return (
    <div
      style={{
        position: 'absolute',
        top: -130,
        left: b.left,
        width: b.wide ? 211 : 173,
        height: 1350,
        opacity,
        filter: 'blur(23px)',
        transformOrigin: '50% 0%',
        transform: `translateX(${sway}px) rotate(${b.rot}deg)`,
        background: `linear-gradient(180deg, rgba(${color},0.5) 0%, rgba(${color},0.16) 45%, rgba(${color},0) 80%)`,
      }}
    />
  )
}

// ====== Kinetisch wisselwoord ======
function Kinetic({ t }: { t: number }) {
  let k = t < WORD_START ? 0 : Math.floor((t - WORD_START) / WORD_EVERY) + 1
  if (k > MAX_SWAPS) k = MAX_SWAPS
  const swapAt = WORD_START + (k - 1) * WORD_EVERY
  const inTransition = k > 0 && t < swapAt + WORD_ANIM

  const current = WORDS[k % WORDS.length]
  const prev = WORDS[(k - 1 + WORDS.length) % WORDS.length]

  const p = inTransition
    ? interpolate(t, [swapAt, swapAt + WORD_ANIM], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: EASE,
      })
    : 1

  const wordStyle: React.CSSProperties = {
    gridArea: '1 / 1',
    display: 'block',
    textAlign: 'center',
  }

  return (
    <span
      style={{
        color: C.sand,
        display: 'inline-grid',
        overflow: 'hidden',
        verticalAlign: 'top',
      }}
    >
      <span style={{ ...wordStyle, visibility: 'hidden' }}>podium.</span>
      {inTransition ? (
        <span
          style={{
            ...wordStyle,
            transform: `translateY(${-110 * p}%)`,
            opacity: 1 - p,
          }}
        >
          {prev}
        </span>
      ) : null}
      <span
        style={{
          ...wordStyle,
          transform: `translateY(${inTransition ? 110 * (1 - p) : 0}%)`,
          opacity: inTransition ? p : 1,
        }}
      >
        {current}
      </span>
    </span>
  )
}

// ====== Marquee ======
const ITEMS = [
  'Licht',
  'Geluid',
  'Podia',
  'Showpakketten',
  'Drive-ins',
  'Festivals',
  'Bruiloften',
  'Bedrijfsfeesten',
]

function Marquee({ t }: { t: number }) {
  const opacity = interpolate(t, [2.6, 3.8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const shift = ((t / 28) % 1) * 50 // % van de track (2 halves)
  const half = (key: string) => (
    <div key={key} style={{ display: 'flex', gap: 67 }}>
      {ITEMS.map((it) => (
        <span key={it} style={{ whiteSpace: 'nowrap' }}>
          {it} <span style={{ color: C.sand }}>·</span>
        </span>
      ))}
    </div>
  )
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        opacity,
        borderTop: '1px solid rgba(245,245,246,0.10)',
        background: 'rgba(19,27,33,0.55)',
        overflow: 'hidden',
        padding: '21px 0',
        fontFamily: anton.fontFamily,
        textTransform: 'uppercase',
        fontSize: 29,
        letterSpacing: '0.12em',
        color: C.onDarkMuted,
      }}
    >
      <div
        style={{
          display: 'flex',
          width: 'max-content',
          gap: 67,
          transform: `translateX(-${shift}%)`,
        }}
      >
        {half('a')}
        {half('b')}
      </div>
    </div>
  )
}

// ====== Hoofdcompositie ======
export const EventScherm = () => {
  const frame = useCurrentFrame()
  const t = frame / FPS

  // langzame cinematische zoom
  const zoom = interpolate(t, [0, 30], [1, 1.035])

  // vloer-gloed
  const floorOpacity = interpolate(t, [0.8, 2.8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // headline-regels schuiven omhoog (mask)
  const line1 = interpolate(t, [1.15, 2.15], [110, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  })
  const line2 = interpolate(t, [1.3, 2.3], [110, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  })

  // CTA-puls (3.2s-periode, start na 3s)
  const pulseT = Math.max(0, t - 3)
  const pulseP = (1 - Math.cos((pulseT * 2 * Math.PI) / 3.2)) / 2
  const pulseSpread = pulseP * 21
  const pulseAlpha = 0.4 * (1 - pulseP)

  // eind-fade naar zwart
  const fadeOut = interpolate(t, [28.0, 29.3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(120% 90% at 50% 0%, #25323B 0%, #1A242C 55%, #131B21 100%)',
        fontFamily: figtree.fontFamily,
        overflow: 'hidden',
      }}
    >
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        {/* lichtbundels */}
        {BEAMS.map((b, i) => (
          <Beam key={i} b={b} t={t} />
        ))}

        {/* warme vloer-gloed */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 367,
            opacity: floorOpacity,
            background:
              'radial-gradient(60% 100% at 50% 100%, rgba(217,197,178,0.10) 0%, rgba(217,197,178,0) 70%)',
          }}
        />

        {/* content */}
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            paddingBottom: 110,
          }}
        >
          <div>
            {/* logo-lockup */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 42,
                ...rise(t, 0.7, 1.1),
              }}
            >
              <Img src={staticFile('logo/we-mark.png')} style={{ width: 190 }} />
              <div
                style={{
                  fontWeight: 700,
                  color: C.onDark,
                  fontSize: 84,
                  lineHeight: 0.95,
                  letterSpacing: '-0.02em',
                  textAlign: 'left',
                }}
              >
                wittenboer
                <br />
                events
              </div>
            </div>

            {/* headline */}
            <h1
              style={{
                margin: '42px 0 0',
                fontFamily: anton.fontFamily,
                fontWeight: 400,
                textTransform: 'uppercase',
                color: C.onDark,
                fontSize: 182,
                lineHeight: 1.02,
                letterSpacing: '0.01em',
              }}
            >
              <span style={{ display: 'block', overflow: 'hidden' }}>
                <span style={{ display: 'block', transform: `translateY(${line1}%)` }}>
                  Wij regelen je
                </span>
              </span>
              <span style={{ display: 'block', overflow: 'hidden' }}>
                <span style={{ display: 'block', transform: `translateY(${line2}%)` }}>
                  <Kinetic t={t} />
                </span>
              </span>
            </h1>

            {/* subregel */}
            <p
              style={{
                margin: '36px 0 0',
                color: C.onDarkMuted,
                fontSize: 35,
                fontWeight: 500,
                lineHeight: 1.5,
                ...rise(t, 1.9, 1.0, 27),
              }}
            >
              Licht, geluid en podia voor bruiloften, bedrijfsfeesten en festivals.
              <br />
              Wij denken mee en regelen alles van A tot Z.
            </p>

            {/* CTA */}
            <div
              style={{
                marginTop: 46,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 42,
                ...rise(t, 2.3, 1.0, 27),
              }}
            >
              <span
                style={{
                  background: C.teal,
                  color: C.onDark,
                  fontWeight: 700,
                  fontSize: 36,
                  padding: '27px 58px',
                  borderRadius: 999,
                  boxShadow: `0 0 0 ${pulseSpread}px rgba(43,163,184,${pulseAlpha})`,
                }}
              >
                wittenboerevents.nl
              </span>
              <span
                style={{
                  fontFamily: anton.fontFamily,
                  color: C.onDark,
                  fontSize: 50,
                  letterSpacing: '0.04em',
                }}
              >
                06 27 17 28 76
              </span>
            </div>
          </div>
        </AbsoluteFill>

        <Marquee t={t} />
      </AbsoluteFill>

      {/* eind-fade naar zwart */}
      <AbsoluteFill style={{ background: '#10171C', opacity: fadeOut, pointerEvents: 'none' }} />
    </AbsoluteFill>
  )
}
