interface LaminatePassProps {
  /** Naam op de pas. */
  name: string;
  /** Rol/toegangsniveau, in hoofdletters. */
  role?: string;
  /** Naam van het event. */
  event?: string;
  /** Datum-aanduiding (vrij formaat). */
  date?: string;
}

/**
 * Backstage laminate-pas (credential): afgeronde kaart met pons-gat + lanyard-hint,
 * gekleurde toegangsbalk, rol-tekst en mono-details. Puur decoratief, geen interactie.
 */
export function LaminatePass({
  name,
  role = 'CREW',
  event = 'Wittenboer Events',
  date = "Seizoen '26",
}: LaminatePassProps) {
  return (
    <div className="relative inline-block pt-6">
      {/* Lanyard-hint: smal bandje dat in het pons-gat verdwijnt. */}
      <span
        aria-hidden
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: '14px',
          height: '34px',
          background:
            'linear-gradient(180deg, var(--color-primary-deep) 0%, var(--color-primary) 100%)',
          clipPath: 'polygon(50% 0, 100% 0, 70% 100%, 30% 100%)',
          opacity: 0.9,
        }}
      />

      <div
        className="relative w-[15.5rem] overflow-hidden rounded-[1.1rem]"
        style={{
          background:
            'linear-gradient(160deg, var(--color-surface-dark-1) 0%, var(--color-surface-dark) 60%)',
          border: '1px solid var(--color-border-on-dark)',
          boxShadow:
            '0 18px 40px -18px rgb(0 0 0 / 0.55), inset 0 1px 0 rgb(255 255 255 / 0.06)',
          color: 'var(--color-fg-on-dark)',
        }}
      >
        {/* Pons-gat met ingedrukte rand. */}
        <span
          aria-hidden
          className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full"
          style={{
            width: '34px',
            height: '11px',
            background: 'var(--color-bg)',
            boxShadow:
              'inset 0 2px 3px rgb(0 0 0 / 0.5), 0 1px 0 rgb(255 255 255 / 0.08)',
          }}
        />

        {/* Gekleurde toegangsbalk met rol. */}
        <div
          className="mt-8 flex items-center justify-between px-4 py-2"
          style={{
            background:
              'linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-deep) 100%)',
          }}
        >
          <span className="font-[family-name:var(--font-mono)] text-[0.62rem] uppercase tracking-[0.22em] text-[var(--color-fg-on-dark)]/80">
            Access
          </span>
          <span className="font-[family-name:var(--font-display)] text-[0.95rem] uppercase tracking-[0.08em]">
            {role}
          </span>
        </div>

        {/* Naam + tagline. */}
        <div className="px-4 pb-3 pt-4">
          <p style={{ color: 'var(--color-fg-on-dark-muted)' }} className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.2em]">
            Naam
          </p>
          <p style={{ color: 'var(--color-fg-on-dark)' }} className="mt-0.5 font-[family-name:var(--font-display)] text-[1.45rem] uppercase leading-none tracking-[0.01em]">
            {name}
          </p>
          <p style={{ color: 'var(--color-tertiary)' }} className="mt-2 text-[0.72rem] uppercase tracking-[0.18em]">
            All Areas
          </p>
        </div>

        {/* Mono-details: event + datum, als een echte credential-voet. */}
        <div
          className="grid grid-cols-2 gap-px"
          style={{ background: 'var(--color-border-on-dark)' }}
        >
          {[
            { k: 'Event', v: event },
            { k: 'Datum', v: date },
          ].map((row) => (
            <div
              key={row.k}
              className="px-4 py-2.5"
              style={{ background: 'var(--color-surface-dark)' }}
            >
              <p style={{ color: 'var(--color-fg-on-dark-muted)' }} className="font-[family-name:var(--font-mono)] text-[0.55rem] uppercase tracking-[0.2em]">
                {row.k}
              </p>
              <p style={{ color: 'var(--color-fg-on-dark)' }} className="mt-0.5 truncate font-[family-name:var(--font-mono)] text-[0.78rem] tracking-[0.04em]">
                {row.v}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
