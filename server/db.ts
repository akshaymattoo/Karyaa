import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import { drizzle } from 'drizzle-orm/neon-serverless';
import WebSocket from 'ws';

// Neon uses WebSockets under the hood; provide the Node WebSocket implementation.
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });


export const db = drizzle(pool, { schema });
