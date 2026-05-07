import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    react(),
    ...(process.env.ELECTRON === 'true'
      ? [
          electron([
            {
              entry: 'electron/main.ts',
              onstart(options) {
                if (options.startup) options.startup();
              },
              vite: {
                build: {
                  outDir: 'dist-electron',
                  rollupOptions: {
                    external: ['better-sqlite3', 'electron', 'electron-store'],
                  },
                },
              },
            },
            {
              entry: 'electron/preload.ts',
              onstart(options) {
                options.reload();
              },
              vite: {
                build: {
                  outDir: 'dist-electron',
                  rollupOptions: {
                    external: ['better-sqlite3', 'electron'],
                  },
                },
              },
            },
          ]),
          renderer(),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/electron': path.resolve(__dirname, './electron')
    }
  },
  base: process.env.ELECTRON === 'true' ? './' : '/',
  server: {
    port: 5173
  }
})

