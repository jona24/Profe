import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL no está configurada');
}

export const pool = new Pool({
  connectionString,
  // Railway suele requerir SSL para conexiones externas; dentro de Railway también funciona.
  ssl: process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

export async function healthcheckDb() {
  const res = await pool.query('select 1 as ok');
  return res.rows[0]?.ok === 1;
}

