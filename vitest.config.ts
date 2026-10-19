import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  // Vite 8 uses oxc for transforms. Override jsx so TSX files are transformed
  // correctly during tests (tsconfig sets jsx: "preserve" for Next.js, which
  // would break vitest's import analysis pipeline).
  oxc: {
    jsx: {
      runtime: 'automatic',
      importSource: 'react',
    },
  },
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
