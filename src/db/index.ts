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

  // Universal chainable promise proxy that supports any Drizzle ORM call chain
  const createMockChain = (defaultVal: any = []) => {
    const targetPromise = Promise.resolve(defaultVal);
    const chainHandler: ProxyHandler<any> = {
      get: (_target, prop) => {
        if (prop === 'then') return (onFulfilled?: any, onRejected?: any) => targetPromise.then(onFulfilled, onRejected);
        if (prop === 'catch') return (onRejected?: any) => targetPromise.catch(onRejected);
        if (prop === 'finally') return (onFinally?: any) => targetPromise.finally(onFinally);
        if (prop === Symbol.toStringTag) return 'Promise';
        return (..._args: any[]) => new Proxy(targetPromise, chainHandler);
      },
      apply: (_target, _thisArg, _argList) => {
        return new Proxy(targetPromise, chainHandler);
      }
    };
    return new Proxy(targetPromise, chainHandler);
  };

  dbInstance = new Proxy({}, {
    get: (_, prop) => {
      if (prop === 'query') {
        return new Proxy({}, {
          get: () => new Proxy({}, {
            get: (__, method) => {
              if (method === 'findFirst' || method === 'findUnique') {
                return async () => null;
              }
              return async () => [];
            }
          })
        });
      }
      if (prop === 'execute') {
        return async () => ({ rows: [] });
      }
      if (prop === 'select' || prop === 'insert' || prop === 'update' || prop === 'delete') {
        return () => createMockChain([]);
      }
      return createMockChain([]);
    },
  });
}

export const db = dbInstance;

