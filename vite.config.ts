import { defineConfig } from 'vitest/config'
import logseqSafeDevPlugin from './vite-logseq-safe-plugin'

const LOGSEQ_ORIGINS = ['http://localhost:3001', 'http://127.0.0.1:3001']

export default defineConfig({
  plugins: [logseqSafeDevPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    minify: 'terser',
    sourcemap: false,
  },
  server: {
    port: 8080,
    cors: { origin: LOGSEQ_ORIGINS },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // The adapter talks to the live SDK and is covered by the manual checklist.
      exclude: ['src/index.ts', 'src/__sdk_guard__.ts', 'src/**/*.test.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
