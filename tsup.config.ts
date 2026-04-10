import { defineConfig } from 'tsup'

export default defineConfig([
  // Main entry — web-components barrel + core re-exports
  {
    entry: { index: 'src/web-components/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    splitting: false,
    sourcemap: true,
    outDir: 'dist',
  },
  // Core-only entry (unchanged public contract)
  {
    entry: { index: 'src/core/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    clean: false,
    splitting: false,
    sourcemap: true,
    outDir: 'dist/core',
  },
  // UMD / IIFE for script-tag usage — auto-registers <kal-calendar>
  {
    entry: { index: 'src/web-components/CalendarElement.ts' },
    format: ['iife'],
    globalName: 'Kalendly',
    clean: false,
    splitting: false,
    sourcemap: true,
    outDir: 'dist',
    outExtension: () => ({ js: '.umd.js' }),
    footer: {
      js: `if (typeof customElements !== 'undefined' && !customElements.get('kal-calendar')) { customElements.define('kal-calendar', Kalendly.CalendarElement); }`
    }
  }
])
