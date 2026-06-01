import { MailLayout, Field, Button } from './_layout'

export function StaffAssignedMail({
  staffName,
  artistName,
  clientName,
  eventDate,
  eventLocation,
  roleOnJob,
  notes,
  portalUrl,
}: {
  staffName: string
  artistName?: string
  clientName: string
  eventDate: string
  eventLocation: string
  roleOnJob?: string
  notes?: string
  portalUrl: string
}) {
  return (
    <MailLayout title="Je staat ingepland" preheader={`${eventDate} · ${eventLocation}`}>
      <p style={{ marginTop: 0 }}>Beste {staffName},</p>
      <p>
        Je bent toegevoegd aan een klus{artistName ? ` met ${artistName}` : ''}. Hieronder de
        details. Bevestig in het portaal of neem contact op als het niet uitkomt.
      </p>
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ marginTop: 16 }}>
        <tbody>
          <Field label="Klant" value={clientName} />
          <Field label="Datum" value={eventDate} />
          <Field label="Locatie" value={eventLocation} />
          {roleOnJob && <Field label="Rol" value={roleOnJob} />}
          {artistName && <Field label="Artiest" value={artistName} />}
          {notes && <Field label="Notities" value={notes} />}
        </tbody>
      </table>
      <p style={{ marginTop: 24 }}>
        <Button href={portalUrl}>Bekijk in portaal</Button>
      </p>
    </MailLayout>
  )
}
