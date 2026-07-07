import { MailLayout, Button } from './_layout'

export function CrewWelcomeMail({
  name,
  loginLink,
  calendarUrl,
}: {
  name: string
  loginLink: string
  calendarUrl: string
}) {
  return (
    <MailLayout
      title="Welkom bij Wittenboer Events"
      preheader="Stel je wachtwoord in en zet je agenda klaar"
    >
      <p style={{ marginTop: 0 }}>Hoi {name},</p>
      <p>
        Je bent toegevoegd als crewlid bij Wittenboer Events. Hieronder vind je twee dingen: je
        inloglink en je persoonlijke agenda-link.
      </p>

      <p style={{ marginTop: 24, marginBottom: 4, fontWeight: 600 }}>1. Inloggen</p>
      <p>
        Stel hieronder je wachtwoord in. Daarna kom je op &ldquo;Mijn klussen&rdquo; terecht, waar
        je al je toegewezen klussen ziet.
      </p>
      <p style={{ marginTop: 16 }}>
        <Button href={loginLink}>Inloggen en wachtwoord instellen</Button>
      </p>
      <p style={{ marginTop: 20, color: '#636466', fontSize: 13 }}>
        De knop werkt niet? Plak deze link in je browser:
      </p>
      <p style={{ wordBreak: 'break-all', fontSize: 12, color: '#636466' }}>{loginLink}</p>

      <p style={{ marginTop: 28, marginBottom: 4, fontWeight: 600 }}>2. Je persoonlijke agenda</p>
      <p>
        Voeg dit toe aan je agenda (Google Agenda: Andere agenda&apos;s -&gt; Toevoegen via URL;
        werkt ook in Apple en Outlook). Je ziet dan automatisch alleen jouw eigen klussen.
      </p>
      <p style={{ marginTop: 12 }}>
        <a href={calendarUrl} style={{ color: '#157A8C', fontWeight: 500 }}>
          {calendarUrl}
        </a>
      </p>
      <p style={{ marginTop: 8, color: '#636466', fontSize: 13 }}>
        Werkt de link hierboven niet als klikbare link? Plak deze tekst dan handmatig in je agenda:
      </p>
      <p style={{ wordBreak: 'break-all', fontSize: 12, color: '#636466' }}>{calendarUrl}</p>

      <p style={{ marginTop: 28, color: '#636466', fontSize: 13 }}>
        Vragen? Neem contact met ons op via{' '}
        <a href="tel:+31627172876" style={{ color: '#157A8C' }}>06 27 17 28 76</a>.
      </p>
    </MailLayout>
  )
}
