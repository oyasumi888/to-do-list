import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const client = await pool.connect();
try {
  const result = await client.query('SELECT NOW() as now, current_database() as db');
  console.log('✅ Conectado a PostgreSQL');
  console.log('   Base de datos:', result.rows[0].db);
  console.log('   Hora del servidor:', result.rows[0].now);
} finally {
  client.release();
  await pool.end();
}