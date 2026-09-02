import { rmSync } from 'node:fs'
import path from 'node:path'

// Integration tests run against a disposable local SQLite file (see
// vitest.setup.ts). Wipe it once per run so fixed-slug fixtures start clean
// and tests never touch the real DATABASE_URL from .env.
export default function globalSetup() {
  const base = path.resolve(__dirname, './.test.payload.db')
  for (const suffix of ['', '-wal', '-shm']) {
    rmSync(`${base}${suffix}`, { force: true })
  }
}
