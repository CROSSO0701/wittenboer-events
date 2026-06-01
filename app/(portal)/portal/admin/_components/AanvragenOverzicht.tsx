'use client'

// "Aanvragen" is samengevoegd met "Te doen" op /portal/admin (chunk 3/5).
// Het to-do-blok leeft nu als de herbruikbare <WachtOpJou>; het volledige
// aanvragen-archief verhuisde naar /portal/admin/archief.
// Deze component blijft als dunne wrapper bestaan voor backwards-compat;
// de route /portal/admin/aanvragen redirect inmiddels naar /portal/admin.

import { WachtOpJou } from './WachtOpJou'

export function AanvragenOverzicht() {
  return <WachtOpJou />
}
