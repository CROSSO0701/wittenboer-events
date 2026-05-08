import 'server-only'
import type { ReactElement } from 'react'

export async function renderHtml(element: ReactElement): Promise<string> {
  const { renderToStaticMarkup } = await import('react-dom/server')
  return `<!doctype html>${renderToStaticMarkup(element)}`
}

// Naïeve html→text fallback voor mail-clients zonder HTML.
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h\d>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function renderEmail(element: ReactElement): Promise<{ html: string; text: string }> {
  const html = await renderHtml(element)
  return { html, text: htmlToText(html) }
}
