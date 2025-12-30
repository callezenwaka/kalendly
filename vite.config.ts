import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
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
