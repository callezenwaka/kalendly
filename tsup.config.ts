import { defineConfig } from 'tsup'

export default defineConfig([
  // Main entry point
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    splitting: false,
    sourcemap: true,
    outDir: 'dist',
    external: ['react', 'react-dom', 'vue', 'react-native']
  },
  // Vanilla JavaScript package
  {
    entry: ['src/vanilla/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: false,
    splitting: false,
    sourcemap: true,
    outDir: 'dist/vanilla',
    external: ['react', 'react-dom', 'vue', 'react-native']
  },
  // UMD build for browser globals
  {
    entry: ['src/vanilla/index.ts'],
    format: ['iife'],
    globalName: 'Kalendly',
    clean: false,
    splitting: false,
    sourcemap: true,
    outDir: 'dist/vanilla',
    outExtension: () => ({ js: '.umd.js' }),
    external: ['react', 'react-dom', 'vue', 'react-native']
  },
  // Core package
  {
    entry: ['src/core/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: false,
    splitting: false,
    sourcemap: true,
    outDir: 'dist/core',
    external: ['react', 'react-dom', 'vue', 'react-native']
  },
  // React package
  {
    entry: ['src/react/index.tsx'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: false,
    splitting: false,
    sourcemap: true,
    outDir: 'dist/react',
    external: ['react', 'react-dom', 'vue', 'react-native'],
    esbuildOptions(options) {
      options.jsx = 'automatic'
    }
  },
  // Vue package is built with Vite (see vite.config.ts)
  // React Native package
  {
    entry: ['src/react-native/index.tsx'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: false,
    splitting: false,
    sourcemap: true,
    outDir: 'dist/react-native',
    external: ['react', 'react-dom', 'vue', 'react-native'],
    esbuildOptions(options) {
      options.jsx = 'automatic'
    }
  }
])