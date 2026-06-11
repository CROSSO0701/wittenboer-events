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
export const DURATION_FRAMES = Math.round(29.5 * FPS)

const C = {
  teal: '#157A8C',
  tealBright: '#2BA3B8',
  sand: '#D9C5B2',
  sandDeep: '#8A7660',
  onDark: '#F5F5F6',
  onDarkMuted: '#AFC0C7',
}

const EASE = Easing.bezier(0.16, 1, 0.3, 1)

const WORDS = ['licht.', 'geluid.', 'beeld.', 'podium.', 'crew.']
const WORD_START = 2.3
const WORD_EVERY = 2.6
const WORD_ANIM = 0.7
const MAX_SWAPS = 9

// deterministische pseudo-random (geen Math.random in Remotion)
const rand = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// dikke 3D-extrusie via gestapelde text-shadows
function extrude(depth: number, color: string) {
  const layers: string[] = []
  for (let i = 1; i <= depth; i++) layers.push(`${i}px ${i}px 0 ${color}`)
  layers.push(`${depth + 14}px ${depth + 18}px 38px rgba(0,0,0,0.55)`)
  return layers.join(', ')
}

function rise(t: number, start: number, dur = 1.0, dy = 32) {
  const p = interpolate(t, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  })
  return { opacity: p, transform: `translateY(${(1 - p) * dy}px)` }
}

// ====== Lichtbundels (3D gekanteld) ======
const BEAMS = [
  { left: '4%', rot: 18, teal: false, delay: 0.1, phase: 0.0 },
  { left: '22%', rot: 9, teal: true, delay: 0.3, phase: 2.1 },
  { left: '45%', rot: 0, teal: false, delay: 0.0, phase: 4.2, wide: true },
  { left: '65%', rot: -9, teal: true, delay: 0.4, phase: 1.3 },
  { left: '84%', rot: -18, teal: false, delay: 0.2, phase: 3.4 },
]

function Beam({ b, t }: { b: (typeof BEAMS)[number]; t: number }) {
  const local = t - b.delay
  const opacity = interpolate(
    local,
    [0, 0.11, 0.2, 0.31, 1.4],
    [0, 0.95, 0.12, 0.8, 0.6],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const swayP = interpolate(local, [1.4, 2.4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const sway = Math.sin(((local - 1.4) * 2 * Math.PI) / 9 + b.phase) * 9 * swayP
  const color = b.teal ? '43,163,184' : '217,197,178'
  return (
    <div
      style={{
        position: 'absolute',
        top: -160,
        left: b.left,
        width: b.wide ? 230 : 180,
        height: 1500,
        opacity,
        filter: 'blur(24px)',
        transformOrigin: '50% 0%',
        transform: `translateZ(-260px) rotate(${b.rot + sway}deg)`,
        background: `linear-gradient(180deg, rgba(${color},0.55) 0%, rgba(${color},0.18) 45%, rgba(${color},0) 80%)`,
      }}
    />
  )
}

// ====== Deeltjes ======
function Particles({ t }: { t: number }) {
  const dots = []
  for (let i = 0; i < 42; i++) {
    const d = 0.25 + rand(i + 99) * 0.75 // diepte
    const x = rand(i) * 1920
    const speed = 26 + rand(i + 7) * 50
    const y = 1180 - (((t * speed + rand(i + 31) * 1080) % 1300) + 0)
    const size = 2 + rand(i + 13) * 5
    const teal = rand(i + 51) > 0.6
    const tw = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * (1 + rand(i + 3) * 2) * 2 + rand(i + 4) * 6))
    const appear = interpolate(t, [0.6, 2.2], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
    dots.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: 999,
          opacity: tw * appear,
          background: teal ? C.tealBright : C.sand,
          boxShadow: `0 0 ${8 + size * 2}px ${teal ? 'rgba(43,163,184,0.8)' : 'rgba(217,197,178,0.8)'}`,
          transform: `translateZ(${(d - 0.5) * 520}px)`,
        }}
      />
    )
  }
  return <>{dots}</>
}

// ====== Lichtstreep die over het beeld schiet bij elke wissel ======
function Streak({ t }: { t: number }) {
  let k = t < WORD_START ? 0 : Math.floor((t - WORD_START) / WORD_EVERY) + 1
  if (k > MAX_SWAPS) k = MAX_SWAPS
  if (k === 0) return null
  const swapAt = WORD_START + (k - 1) * WORD_EVERY
  const e = t - swapAt
  if (e > 0.9) return null
  const p = interpolate(e, [0, 0.9], [0, 1], { easing: Easing.out(Easing.quad) })
  const dir = k % 2 === 0 ? 1 : -1
  return (
    <div
      style={{
        position: 'absolute',
        top: 380,
        left: '50%',
        width: 900,
        height: 5,
        opacity: (1 - p) * 0.85,
        background: `linear-gradient(90deg, transparent, ${C.sand}, transparent)`,
        filter: 'blur(2px)',
        mixBlendMode: 'screen',
        transform: `translateX(${dir * (-2400 + p * 4800)}px) rotate(${dir * -7}deg) translateZ(160px)`,
      }}
    />
  )
}

// ====== Kinetisch woord met 3D-tuimel ======
function Kinetic3D({ t }: { t: number }) {
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
    color: C.sand,
    textShadow: extrude(16, C.sandDeep),
    backfaceVisibility: 'hidden',
  }

  return (
    <span
      style={{
        display: 'inline-grid',
        verticalAlign: 'top',
        perspective: 900,
        transformStyle: 'preserve-3d',
      }}
    >
      <span style={{ ...wordStyle, visibility: 'hidden' }}>podium.</span>
      {inTransition ? (
        <span
          style={{
            ...wordStyle,
            transform: `rotateX(${p * 88}deg) translateY(${-p * 55}%) translateZ(${p * 120}px)`,
            opacity: 1 - p,
          }}
        >
          {prev}
        </span>
      ) : null}
      <span
        style={{
          ...wordStyle,
          transform: inTransition
            ? `rotateX(${-88 + p * 88}deg) translateY(${(1 - p) * 55}%) translateZ(${(1 - p) * 120}px)`
            : 'none',
          opacity: inTransition ? p : 1,
        }}
      >
        {current}
      </span>
    </span>
  )
}

// ====== Marquee ======
const ITEMS = ['Licht', 'Geluid', 'Beeld', 'Podia', 'Showpakketten', 'Drive-ins', 'Festivals', 'Bruiloften', 'Bedrijfsfeesten']

function Marquee({ t }: { t: number }) {
  const opacity = interpolate(t, [2.6, 3.8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const shift = ((t / 26) % 1) * 50
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
        background: 'rgba(19,27,33,0.6)',
        overflow: 'hidden',
        padding: '21px 0',
        fontFamily: anton.fontFamily,
        textTransform: 'uppercase',
        fontSize: 29,
        letterSpacing: '0.12em',
        color: C.onDarkMuted,
      }}
    >
      <div style={{ display: 'flex', width: 'max-content', gap: 67, transform: `translateX(-${shift}%)` }}>
        {half('a')}
        {half('b')}
      </div>
    </div>
  )
}

// ====== Hoofdcompositie ======
export const EventScherm3D = () => {
  const frame = useCurrentFrame()
  const t = frame / FPS

  // camera-kick op elke woordwissel (basdreun)
  let k = t < WORD_START ? 0 : Math.floor((t - WORD_START) / WORD_EVERY) + 1
  if (k > MAX_SWAPS) k = MAX_SWAPS
  const lastSwap = k > 0 ? WORD_START + (k - 1) * WORD_EVERY : -10
  const kick = Math.exp(-(t - lastSwap) * 5.5)
  const kickSign = k % 2 === 0 ? 1 : -1

  // zwevende camera
  const camRX = -3 + Math.sin((t * 2 * Math.PI) / 17) * 3
  const camRY = Math.sin((t * 2 * Math.PI) / 23) * 5 + kickSign * kick * 1.2
  const camRZ = kickSign * kick * 0.7
  const dolly = interpolate(t, [0, 29.5], [1.0, 1.07]) + kick * 0.035

  // intro: logo vliegt uit de diepte
  const logoP = interpolate(t, [0.5, 1.7], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  })
  const logoZ = (1 - logoP) * -1100
  const logoBlur = (1 - logoP) * 14

  // headline-regels tuimelen binnen
  const l1p = interpolate(t, [1.15, 2.25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  })
  const l2p = interpolate(t, [1.35, 2.45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  })

  // achtergrond-puls op de wissel
  const glowR = 700 + kick * 260

  // CTA-puls
  const pulseT = Math.max(0, t - 3)
  const pulseP = (1 - Math.cos((pulseT * 2 * Math.PI) / 3.2)) / 2
  const pulseSpread = pulseP * 21
  const pulseAlpha = 0.4 * (1 - pulseP)

  const fadeOut = interpolate(t, [28.0, 29.3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(120% 90% at 50% 0%, #25323B 0%, #1A242C 55%, #10171C 100%)',
        fontFamily: figtree.fontFamily,
        overflow: 'hidden',
        perspective: 1300,
      }}
    >
      {/* pulserende gloed achter alles */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '46%',
          width: glowR * 2,
          height: glowR * 1.2,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(50% 50% at 50% 50%, rgba(21,122,140,${0.22 + kick * 0.2}) 0%, rgba(21,122,140,0) 70%)`,
          filter: 'blur(10px)',
        }}
      />

      {/* 3D-wereld */}
      <AbsoluteFill
        style={{
          transformStyle: 'preserve-3d',
          transform: `scale(${dolly}) rotateX(${camRX}deg) rotateY(${camRY}deg) rotateZ(${camRZ}deg)`,
        }}
      >
        {BEAMS.map((b, i) => (
          <Beam key={i} b={b} t={t} />
        ))}
        <Particles t={t} />
        <Streak t={t} />

        {/* vloer-gloed */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 380,
            background: 'radial-gradient(60% 100% at 50% 100%, rgba(217,197,178,0.12) 0%, rgba(217,197,178,0) 70%)',
          }}
        />

        {/* content */}
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            paddingBottom: 110,
            transformStyle: 'preserve-3d',
          }}
        >
          <div style={{ transformStyle: 'preserve-3d' }}>
            {/* logo vliegt uit de diepte */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 42,
                opacity: logoP,
                filter: `blur(${logoBlur}px)`,
                transform: `translateZ(${logoZ}px)`,
              }}
            >
              <Img
                src={staticFile('logo/we-mark.png')}
                style={{ width: 190, filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.5))' }}
              />
              <div
                style={{
                  fontWeight: 700,
                  color: C.onDark,
                  fontSize: 84,
                  lineHeight: 0.95,
                  letterSpacing: '-0.02em',
                  textAlign: 'left',
                  textShadow: '0 14px 30px rgba(0,0,0,0.55)',
                }}
              >
                wittenboer
                <br />
                events
              </div>
            </div>

            {/* headline met dikke extrusie */}
            <h1
              style={{
                margin: '42px 0 0',
                fontFamily: anton.fontFamily,
                fontWeight: 400,
                textTransform: 'uppercase',
                color: C.onDark,
                fontSize: 182,
                lineHeight: 1.04,
                letterSpacing: '0.01em',
                transformStyle: 'preserve-3d',
              }}
            >
              <span
                style={{
                  display: 'block',
                  opacity: l1p,
                  textShadow: extrude(14, '#0E1419'),
                  transform: `rotateX(${(1 - l1p) * -80}deg) translateZ(${(1 - l1p) * 200}px)`,
                }}
              >
                Wij regelen je
              </span>
              <span
                style={{
                  display: 'block',
                  opacity: l2p,
                  transform: `rotateX(${(1 - l2p) * -80}deg) translateZ(${(1 - l2p) * 200}px) translateZ(60px)`,
                }}
              >
                <Kinetic3D t={t} />
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
                textShadow: '0 6px 18px rgba(0,0,0,0.5)',
                ...rise(t, 1.9, 1.0, 27),
              }}
            >
              Licht, geluid, beeld en podia voor bruiloften, bedrijfsfeesten en festivals.
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
                transform: 'translateZ(80px)',
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
                  boxShadow: `0 0 0 ${pulseSpread}px rgba(43,163,184,${pulseAlpha}), 0 22px 40px rgba(0,0,0,0.45)`,
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
                  textShadow: extrude(8, '#0E1419'),
                }}
              >
                06 27 17 28 76
              </span>
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      <Marquee t={t} />

      <AbsoluteFill style={{ background: '#10171C', opacity: fadeOut, pointerEvents: 'none' }} />
    </AbsoluteFill>
  )
}
