import { MailLayout, Field } from './_layout'

export function BookingCancelledMail({
  name,
  clientName,
  eventDate,
  eventLocation,
  reason,
}: {
  name: string
  clientName: string
  eventDate: string
  eventLocation: string
  reason?: string
}) {
  return (
    <MailLayout title="Boeking geannuleerd" preheader={`${eventDate} · ${clientName}`}>
      <p style={{ marginTop: 0 }}>Beste {name},</p>
      <p>
        De klus voor <strong>{clientName}</strong> op {eventDate} is geannuleerd. De agenda is
        bijgewerkt.
      </p>
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tbody>
          <Field label="Klant" value={clientName} />
          <Field label="Datum" value={eventDate} />
          <Field label="Locatie" value={eventLocation} />
        </tbody>
      </table>
      {reason && (
        <blockquote
          style={{
            margin: '16px 0',
            padding: '14px 18px',
            borderLeft: '3px solid #D9C5B2',
            backgroundColor: '#F3EAE0',
            color: '#1E2A2F',
            borderRadius: 4,
          }}
        >
          <strong style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#636466' }}>
            Reden
          </strong>
          {reason}
        </blockquote>
      )}
      <p style={{ marginTop: 24, color: '#636466', fontSize: 13 }}>
        Vragen? Neem gerust contact met ons op.
      </p>
    </MailLayout>
  )
}
