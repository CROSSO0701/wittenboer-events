import { MailLayout, Field, Button } from './_layout'

export function BookingAcceptedMail({
  artistName,
  clientName,
  eventDate,
  eventLocation,
  feeFormatted,
  notes,
  portalUrl,
}: {
  artistName: string
  clientName: string
  eventDate: string
  eventLocation: string
  feeFormatted?: string
  notes?: string
  portalUrl: string
}) {
  return (
    <MailLayout title="Klus geaccepteerd" preheader={`${eventDate} · ${eventLocation}`}>
      <p style={{ marginTop: 0 }}>Hoi {artistName},</p>
      <p>
        Je aanvraag voor <strong>{clientName}</strong> is bevestigd. De datum
        staat in de agenda en je krijgt nog bericht zodra er techniek/personeel is toegewezen.
      </p>
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ marginTop: 16 }}>
        <tbody>
          <Field label="Klant" value={clientName} />
          <Field label="Datum" value={eventDate} />
          <Field label="Locatie" value={eventLocation} />
          {feeFormatted && <Field label="Gage" value={feeFormatted} />}
          {notes && <Field label="Notities" value={notes} />}
        </tbody>
      </table>
      <p style={{ marginTop: 24 }}>
        <Button href={portalUrl}>Naar mijn portaal</Button>
      </p>
    </MailLayout>
  )
}
