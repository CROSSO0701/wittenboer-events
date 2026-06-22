// Verplaatst naar app/components/shared/LocationInput.tsx zodat zowel het publieke
// formulier (/klus-doorgeven) als de admin-dialog dezelfde component delen zonder
// dat het publieke formulier uit de (portal)-tree hoeft te importeren.
// Re-export blijft bestaan voor backward-compat van bestaande imports.
export { LocationInput, default } from '../../../../components/shared/LocationInput'
