import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import * as dotenv from 'dotenv';

dotenv.config();

// Global pool to prevent repeated connections on hot reload
declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const isNeonOrCloud = process.env.DATABASE_URL?.includes('neon.tech') || 
                          process.env.DATABASE_URL?.includes('sslmode=require') ||
                          process.env.NODE_ENV === 'production';

    global._postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isNeonOrCloud ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 10000,
    });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
