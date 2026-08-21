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
      connectionString: process.env.DATABASE_URL || undefined,
      ssl: isNeonOrCloud ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 10000,
    });

    global._postgresPool.on('error', (err) => {
      console.warn('Unexpected error on idle SQL pool client:', err?.message || err);
    });
  }
  return global._postgresPool;
};

let dbInstance: any;
try {
  if (process.env.DATABASE_URL) {
    const pool = createPool();
    dbInstance = drizzle(pool, { schema });
  } else {
    throw new Error('DATABASE_URL not set');
  }
} catch {
  console.warn('[AI Studio] Database not connected — using in-memory mock fallback');
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({})
  };
  dbInstance = new Proxy({}, {
    get: (_, prop) => {
      if (prop === 'query') {
        return new Proxy({}, {
          get: () => new Proxy({}, {
            get: () => async () => []
          })
        });
      }
      if (prop === 'execute' || prop === 'select' || prop === 'insert' || prop === 'update' || prop === 'delete') {
        return () => ({
          from: () => ({ where: () => [], orderBy: () => [] }),
          values: () => ({ returning: async () => [] }),
          set: () => ({ where: () => ({ returning: async () => [] }) }),
          where: () => []
        });
      }
      return async () => [];
    },
  });
}

export const db = dbInstance;

