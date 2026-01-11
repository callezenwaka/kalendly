import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist-examples',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        vanilla: 'examples/vanilla/index.html',
        react: 'examples/react/index.html',
        vue: 'examples/vue/index.html'
      }
    }
  },
  server: {
    port: 5173,
    open: '/examples/vanilla/index.html'
  }
})