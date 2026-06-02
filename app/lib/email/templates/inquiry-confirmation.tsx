import { MailLayout } from './_layout'

export function InquiryConfirmationMail({
  name,
  type,
}: {
  name: string
  type: 'contact' | 'show-package' | 'artist-booking'
}) {
  const subjectLine =
    type === 'contact'
      ? 'je bericht'
      : type === 'show-package'
        ? 'je pakketaanvraag'
        : 'je artiestaanvraag'

  return (
    <MailLayout title="Bedankt voor je bericht" preheader="We nemen binnen één werkdag contact op">
      <p style={{ marginTop: 0 }}>Hoi {name},</p>
      <p>
        We hebben {subjectLine} ontvangen en nemen binnen één werkdag contact met je op
        om mee te denken en de details door te nemen.
      </p>
      <p style={{ marginTop: 20, color: '#636466', fontSize: 14 }}>
        Spoed? Bel{' '}
        <a href="tel:+31627172876" style={{ color: '#157A8C' }}>
          06 27 17 28 76
        </a>{' '}
        of stuur een WhatsApp naar hetzelfde nummer.
      </p>
      <p style={{ marginTop: 24, color: '#636466', fontSize: 13 }}>
        Tot snel,
        <br />
        team Wittenboer
      </p>
    </MailLayout>
  )
}
