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
      <p style={{ marginTop: 0 }}>Beste {name},</p>
      <p>
        Je bent toegevoegd aan het portaal van Wittenboer Events {role === 'artiest' ? 'als artiest' : 'als crewlid'}. Stel hieronder je
        wachtwoord in om in te loggen.
      </p>
      <p style={{ marginTop: 24 }}>
        <Button href={link}>Inloggen</Button>
      </p>
      <p style={{ marginTop: 28, color: '#636466', fontSize: 13 }}>
        De knop werkt niet? Plak deze link in je browser:
      </p>
      <p style={{ wordBreak: 'break-all', fontSize: 12, color: '#636466' }}>{link}</p>
      <p style={{ marginTop: 28, color: '#636466', fontSize: 13 }}>
        Vragen? Neem contact met ons op via{' '}
        <a href="tel:+31627172876" style={{ color: '#157A8C' }}>06 27 17 28 76</a>.
      </p>
    </MailLayout>
  )
}
