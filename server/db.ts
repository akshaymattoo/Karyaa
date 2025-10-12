// import { Pool, neonConfig } from '@neondatabase/serverless';
// import * as schema from '@shared/schema';
// import { drizzle } from 'drizzle-orm/neon-serverless';
// import WebSocket from 'ws';

// // Neon uses WebSockets under the hood; provide the Node WebSocket implementation.
// neonConfig.webSocketConstructor = WebSocket;

// const pool = new Pool({ connectionString: process.env.DATABASE_URL });


// export const db = drizzle(pool, { schema });


import 'dotenv/config';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || "";

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client);


