import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const schemaPath = path.join(root, 'sql', 'schema.sql');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const schemaSql = fs.readFileSync(schemaPath, 'utf8');

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(schemaSql);
  console.log('✅ Database initialized');
} finally {
  await client.end();
}
