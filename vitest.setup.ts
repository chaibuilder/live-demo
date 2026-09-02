// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

// Integration tests must never write to the real (remote) DATABASE_URL from
// .env. Point Payload at a disposable local SQLite file with schema push on so
// tables are created on the fresh file (wiped per run in vitest.globalSetup).
process.env.DATABASE_URL = 'file:./.test.payload.db'
delete process.env.DATABASE_AUTH_TOKEN
process.env.PAYLOAD_DB_PUSH = 'true'
