import type { ReactNode } from 'react'

const COLORS = {
  bg: '#F5F5F6',
  surface: '#FFFFFF',
  border: '#DCDEE0',
  fg: '#1E2A2F',
  muted: '#636466',
  primary: '#157A8C',
  primaryDeep: '#0B4A57',
  accent: '#D9C5B2',
}

export function MailLayout({
  preheader,
  title,
  children,
}: {
  preheader?: string
  title: string
  children: ReactNode
}) {
  return (
    <html lang="nl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
      </head>
      <body
        style={{
          margin: 0,
          backgroundColor: COLORS.bg,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: COLORS.fg,
        }}
      >
        {preheader && (
          <div
            style={{
              display: 'none',
              maxHeight: 0,
              overflow: 'hidden',
              color: 'transparent',
              opacity: 0,
            }}
          >
            {preheader}
          </div>
        )}
        <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ backgroundColor: COLORS.bg }}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: '32px 16px' }}>
                <table
                  width="600"
                  cellPadding={0}
                  cellSpacing={0}
                  role="presentation"
                  style={{ width: '100%', maxWidth: 600, backgroundColor: COLORS.surface, borderRadius: 12, border: `1px solid ${COLORS.border}` }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          padding: '24px 32px',
                          borderBottom: `4px solid ${COLORS.primary}`,
                          backgroundColor: COLORS.primaryDeep,
                          color: '#fff',
                        }}
                      >
                        <div style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.7 }}>Wittenboer Events</div>
                        <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{title}</div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '32px', fontSize: 15, lineHeight: 1.6, color: COLORS.fg }}>
                        {children}
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: '20px 32px',
                          borderTop: `1px solid ${COLORS.border}`,
                          fontSize: 12,
                          color: COLORS.muted,
                        }}
                      >
                        Wittenboer Events · Het Schild 35, 5275 EE Den Dungen ·{' '}
                        <a href="mailto:info@wittenboerevents.nl" style={{ color: COLORS.primary }}>
                          info@wittenboerevents.nl
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}

export function Button({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      style={{
        display: 'inline-block',
        backgroundColor: COLORS.primary,
        color: '#fff',
        padding: '12px 22px',
        borderRadius: 999,
        textDecoration: 'none',
        fontWeight: 500,
        fontSize: 14,
      }}
    >
      {children}
    </a>
  )
}

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ padding: '8px 0', borderTop: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.muted, width: 140 }}>
        {label}
      </td>
      <td style={{ padding: '8px 0', borderTop: `1px solid ${COLORS.border}`, fontSize: 14, color: COLORS.fg }}>
        {value}
      </td>
    </tr>
  )
}

export const mailColors = COLORS
