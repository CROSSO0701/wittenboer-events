import { loadPackages } from '../data'
import { renderBrochurePdf } from '../BrochurePdf'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Genereert de showpakketten-brochure als echte PDF en biedt 'm als download
// aan (Content-Disposition: attachment) — geen print-dialoog.
export async function GET() {
  try {
    const packages = await loadPackages()
    const buf = await renderBrochurePdf(packages)
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Wittenboer-Events-Showpakketten.pdf"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return new Response(
      `Brochure kon niet gegenereerd worden: ${err instanceof Error ? err.message : 'onbekende fout'}`,
      { status: 500 }
    )
  }
}
