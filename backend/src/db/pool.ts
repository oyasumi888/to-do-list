import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production';

// #region agent log
console.log('[debug-cd3ac2] pool config:', {
  usingDatabaseUrl: !!process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST ?? '(not set)',
  DB_PORT: process.env.DB_PORT ?? '(not set)',
  DB_NAME: process.env.DB_NAME ?? '(not set)',
  NODE_ENV: process.env.NODE_ENV ?? '(not set)',
});
// #endregion

export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: isProduction ? { rejectUnauthorized: false } : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME     || 'to_do_list',
        user:     process.env.DB_USER     || 'list_user',
        password: process.env.DB_PASSWORD || '',
        max:      10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
);

pool.on('error', (err) => {
  console.error('Error inesperado en cliente del pool:', err);
  process.exit(-1);
});