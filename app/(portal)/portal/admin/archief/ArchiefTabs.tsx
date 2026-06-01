'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { InquiriesPanel } from '../_components/InquiriesPanel'
import { ArchiveBoard } from './ArchiveBoard'

/**
 * Archief in twee tabs:
 *  - "Boekingen": het bestaande boekingen-archief (datum in het verleden).
 *  - "Losse aanvragen": het volledige aanvragen-archief per type (verplaatst
 *    vanaf het admin-dashboard, zodat dat dagscherm alleen nog het to-do toont).
 */
export function ArchiefTabs() {
  return (
    <Tabs defaultValue="bookings">
      <TabsList>
        <TabsTrigger value="bookings">Boekingen</TabsTrigger>
        <TabsTrigger value="inquiries">Losse aanvragen</TabsTrigger>
      </TabsList>

      <TabsContent value="bookings">
        <ArchiveBoard />
      </TabsContent>

      <TabsContent value="inquiries">
        <InquiriesPanel />
      </TabsContent>
    </Tabs>
  )
}
