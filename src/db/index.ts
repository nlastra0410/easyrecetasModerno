import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

// Global pool to prevent repeated connections on hot reload / serverless warm containers
declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL;
    const isNeon = Boolean(connectionString && connectionString.includes('neon.tech'));
    const isSsl = isNeon || Boolean(connectionString && connectionString.includes('sslmode=require')) || process.env.NODE_ENV === 'production';

    global._postgresPool = new Pool({
      connectionString: connectionString || undefined,
      max: process.env.NODE_ENV === 'production' ? 5 : 10,
      connectionTimeoutMillis: 10000,
      ssl: (isSsl && connectionString) ? { rejectUnauthorized: false } : undefined,
    });

    global._postgresPool.on('error', (err) => {
      console.warn('PostgreSQL Pool notice:', err?.message || err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
