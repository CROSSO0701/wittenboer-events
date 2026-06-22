import type { NextConfig } from 'next'

const config: NextConfig = {
  // React Compiler is stable in Next 16 — opt in so we don't hand-write useMemo/useCallback
  reactCompiler: true,

  experimental: {
    // Turbopack is the default in Next 16 for both dev and build — no config needed here.
    // Tree-shake the lucide-react barrel (imported across ~25 files) to per-icon modules.
    optimizePackageImports: ['lucide-react'],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
  },
  turbopack: {
    root: __dirname,
  },

  // Performance: treat this as a statically exportable site where possible
  compress: true,

  // Strict mode on — catches effect bugs early
  reactStrictMode: true,
}

export default config
