import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      'server-only': path.resolve(__dirname, './tests/mocks/server-only.ts'),
      '@chaibuilder-config': path.resolve(__dirname, './tests/mocks/chaibuilder-config.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globalSetup: ['./vitest.globalSetup.ts'],
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
    // DB-backed suites share one local SQLite file; run serially so schema push
    // and fixed-slug fixtures don't race across worker processes.
    fileParallelism: false,
    server: {
      // chaipro ships ESM with extensionless lodash-es imports that Node's
      // strict resolver rejects; inline it so Vite resolves those imports.
      deps: { inline: [/chaipro/] },
    },
  },
})
