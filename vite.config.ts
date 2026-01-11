import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/vue/**/*.ts', 'src/vue/**/*.vue'],
      exclude: ['src/core/**/*', 'src/react/**/*', 'src/react-native/**/*', 'src/vanilla/**/*'],
      outDir: 'dist/vue',
      entryRoot: 'src/vue',  // Add this - fixes the nested structure
      staticImport: true,
      insertTypesEntry: true,
      rollupTypes: false,
      copyDtsFiles: false,
      tsconfigPath: './tsconfig.json',
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/vue/index.ts'),
      name: 'Kalendly',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: ['vue', 'react', 'react-dom', 'react-native'],
      output: {
        globals: {
          vue: 'Vue',
        },
        exports: 'named',
      },
    },
    outDir: 'dist/vue',
    emptyOutDir: false,
  },
})