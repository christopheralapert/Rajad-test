import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  // Mark the first 3 tracks as featured
  const result = await client.query(`
    UPDATE tracks 
    SET featured = true 
    WHERE id IN (
      SELECT id FROM tracks ORDER BY name_et ASC LIMIT 3
    )
  `);

  console.log(`✅ Marked ${result.rowCount} tracks as featured`);
} catch (err) {
  console.error('❌ Error:', err?.message || err);
  process.exit(1);
} finally {
  await client.end();
}
