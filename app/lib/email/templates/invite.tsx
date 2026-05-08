import { MailLayout, Button } from './_layout'

export function InviteMail({
  name,
  role,
  link,
}: {
  name: string
  role: 'artiest' | 'crewlid'
  link: string
}) {
  return (
    <MailLayout title="Welkom bij Wittenboer Events" preheader="Stel je wachtwoord in en log in">
      <p style={{ marginTop: 0 }}>Hoi {name},</p>
      <p>
        Marnix heeft je toegevoegd aan Wittenboer Events {role === 'artiest' ? 'als artiest' : 'als crewlid'}. Klik op de
        knop hieronder om je wachtwoord in te stellen en in te loggen.
      </p>
      <p style={{ marginTop: 24 }}>
        <Button href={link}>Inloggen</Button>
      </p>
      <p style={{ marginTop: 28, color: '#636466', fontSize: 13 }}>
        De knop werkt niet? Plak deze link in je browser:
      </p>
      <p style={{ wordBreak: 'break-all', fontSize: 12, color: '#636466' }}>{link}</p>
      <p style={{ marginTop: 28, color: '#636466', fontSize: 13 }}>
        Vragen? Mail of bel Marnix:{' '}
        <a href="tel:+31627172876" style={{ color: '#157A8C' }}>06-27172876</a>.
      </p>
    </MailLayout>
  )
}
