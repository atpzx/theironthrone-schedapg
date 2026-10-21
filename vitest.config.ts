import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/codec.ts', 'src/lib/sheetLinks.ts', 'src/lib/sheetHistory.ts', 'src/lib/sheetWorkspace.ts'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: { lines: 90, statements: 90, functions: 95, branches: 80 },
    },
  },
})
