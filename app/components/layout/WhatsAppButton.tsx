// Zwevende WhatsApp-contactknop voor de publieke site.
// Linkt naar Wittenboers WhatsApp (06-27172876) met een vriendelijke openingszin.
// WhatsApp-groen is bewust aangehouden voor herkenbaarheid (platform-affordance),
// niet als merkkleur. Respecteert prefers-reduced-motion en verbergt zich bij printen.

const WHATSAPP_HREF =
  'https://wa.me/31627172876?text=' +
  encodeURIComponent('Hallo Wittenboer Events, ik heb een vraag over een evenement.')

export default function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Stuur ons een WhatsApp-bericht"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/25 transition-transform duration-200 ease-out hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#25D366] motion-reduce:transition-none print:hidden"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.244-.73.244-1.088 0-.058 0-.144-.03-.215-.1-.172-2.434-1.39-2.678-1.39zm-2.908 7.593c-1.747 0-3.48-.484-4.985-1.39l-.358-.214-3.703.973.99-3.617-.232-.372a9.94 9.94 0 0 1-1.519-5.286c0-5.486 4.47-9.956 9.97-9.956a9.93 9.93 0 0 1 7.044 2.921 9.86 9.86 0 0 1 2.92 7.05c-.013 5.486-4.483 9.956-9.94 9.956zm8.474-18.426A11.815 11.815 0 0 0 16.196 3C9.65 3 4.32 8.33 4.305 14.877c0 2.092.545 4.126 1.59 5.932L4.2 27l6.344-1.662a11.94 11.94 0 0 0 5.673 1.446h.005c6.544 0 11.875-5.33 11.889-11.877a11.8 11.8 0 0 0-3.48-8.418z" />
      </svg>
    </a>
  )
}
