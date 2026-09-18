import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

console.log('DATABASE_URL:', process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  console.log('✅ Connected to database');
  
  const result = await client.query('SELECT COUNT(*) FROM tracks');
  console.log(`✅ Total tracks: ${result.rows[0].count}`);
  
  const featured = await client.query('SELECT COUNT(*) FROM tracks WHERE featured = true');
  console.log(`✅ Featured tracks: ${featured.rows[0].count}`);
  
} catch (err) {
  console.error('❌ Error:', err?.message || err);
  process.exit(1);
} finally {
  await client.end();
}
