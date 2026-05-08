import { MailLayout, Field } from './_layout'

export function BookingDeclinedMail({
  artistName,
  clientName,
  eventDate,
  reason,
}: {
  artistName: string
  clientName: string
  eventDate: string
  reason: string
}) {
  return (
    <MailLayout title="Klus afgewezen" preheader={`${eventDate} · ${clientName}`}>
      <p style={{ marginTop: 0 }}>Hoi {artistName},</p>
      <p>
        We kunnen de klus voor <strong>{clientName}</strong> op {eventDate} helaas niet
        accepteren. De reden:
      </p>
      <blockquote
        style={{
          margin: '16px 0',
          padding: '16px 20px',
          borderLeft: '3px solid #D9C5B2',
          backgroundColor: '#F3EAE0',
          color: '#1E2A2F',
          borderRadius: 4,
        }}
      >
        {reason}
      </blockquote>
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tbody>
          <Field label="Klant" value={clientName} />
          <Field label="Datum" value={eventDate} />
        </tbody>
      </table>
      <p style={{ marginTop: 24, color: '#636466', fontSize: 13 }}>
        Vragen of bezwaar? Bel of mail Marnix direct.
      </p>
    </MailLayout>
  )
}
