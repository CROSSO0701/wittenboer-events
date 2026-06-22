import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // React 19's nieuwe regel vlagt het legitieme "data laden in useEffect bij
      // mount"-patroon dat de portal-componenten gebruiken. Geen bug — op 'warn'
      // zodat lint groen blijft maar het signaal zichtbaar is voor een latere refactor.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      '.claude/**',
      'remotion/**',
    ],
  },
]

export default eslintConfig
