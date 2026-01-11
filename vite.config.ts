import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/vue/**/*.ts', 'src/vue/**/*.vue'],
      outDir: 'dist/vue',
      staticImport: true,
      insertTypesEntry: true,
      rollupTypes: true, // Merge all .d.ts into single file
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
      // Externalize deps that shouldn't be bundled
      external: ['vue', 'react', 'react-dom', 'react-native'],
      output: {
        // Provide global variables to use in the UMD build
        globals: {
          vue: 'Vue',
        },
        exports: 'named',
      },
    },
    outDir: 'dist/vue',
    emptyOutDir: false, // Don't empty - other builds might be there
  },
})