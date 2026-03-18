import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'myapp_dev',
  user:     process.env.DB_USER     || 'myapp_user',
  password: process.env.DB_PASSWORD || '',
  max:      10,        // máximo de conexiones simultáneas en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Error inesperado en cliente del pool:', err);
  process.exit(-1);
});