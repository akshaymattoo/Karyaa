import { config as loadEnv } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Ensure local `.env` values override deployment defaults when developing.
loadEnv({ override: true });

const connectionString =
  process.env.SUPABASE_DB_URL ??
  process.env.SUPABASE_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL (or SUPABASE_DB_URL) is not defined');
}

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);

