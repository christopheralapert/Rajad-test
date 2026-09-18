import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
export async function query(text, params) {
    const res = await pool.query(text, params);
    return res.rows;
}
