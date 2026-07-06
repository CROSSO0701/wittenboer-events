import { MailLayout, Field } from './_layout'

export function InquiryReceivedMail({
  type,
  name,
  email,
  phone,
  organisation,
  subject,
  message,
  packageName,
  artistName,
  eventDate,
  showtimes,
  guestCount,
  location,
  setupType,
  floorLevel,
  pavedPath,
}: {
  type: 'contact' | 'show-package' | 'artist-booking'
  name: string
  email: string
  phone?: string
  organisation?: string
  subject?: string
  message?: string
  packageName?: string
  artistName?: string
  eventDate?: string
  showtimes?: string
  guestCount?: number
  location?: string
  setupType?: string
  floorLevel?: string
  pavedPath?: string
}) {
  const title =
    type === 'contact'
      ? 'Nieuwe contact-aanvraag'
      : type === 'show-package'
        ? 'Nieuwe pakket-aanvraag'
        : 'Nieuwe artiestboeking'

  return (
    <MailLayout title={title} preheader={`Van ${name} <${email}>`}>
      <p style={{ marginTop: 0 }}>Er is een nieuwe aanvraag binnen via de site.</p>
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tbody>
          <Field label="Naam" value={name} />
          <Field label="E-mail" value={email} />
          {phone && <Field label="Telefoon" value={phone} />}
          {organisation && <Field label="Organisatie" value={organisation} />}
          {packageName && <Field label="Pakket" value={packageName} />}
          {artistName && <Field label="Artiest" value={artistName} />}
          {eventDate && <Field label="Datum" value={eventDate} />}
          {showtimes && <Field label="Showtijden" value={showtimes} />}
          {guestCount && <Field label="Gasten" value={String(guestCount)} />}
          {location && <Field label="Locatie" value={location} />}
          {setupType && <Field label="Prikken of opbouwen" value={setupType} />}
          {floorLevel && <Field label="Begane grond of verdieping" value={floorLevel} />}
          {pavedPath && <Field label="Verhard pad" value={pavedPath} />}
          {subject && <Field label="Onderwerp" value={subject} />}
        </tbody>
      </table>
      {message && (
        <>
          <p style={{ marginTop: 20, fontSize: 13, color: '#636466', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Bericht
          </p>
          <p style={{ whiteSpace: 'pre-wrap', backgroundColor: '#F2F2F3', padding: '14px 16px', borderRadius: 6 }}>
            {message}
          </p>
        </>
      )}
    </MailLayout>
  )
}
