import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // The retained APK is treated as a public release asset. Vite copies it into
  // the deploy output, while the source APK remains in ../releases.
  publicDir: fileURLToPath(new URL('../releases', import.meta.url)),
  server: {
    // Arena's live preview uses a proxied host name.
    allowedHosts: true,
    fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] },
  },
})
