import { pool } from './pool.js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, 'migrations');

async function migrate() {
  const client = await pool.connect();

  try {
    // Crear tabla de control si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migraciones (
        nombre      VARCHAR(255) PRIMARY KEY,
        ejecutada_en TIMESTAMP DEFAULT NOW()
      )
    `);

    // Leer archivos .sql ordenados
    const archivos = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const archivo of archivos) {
      // Verificar si ya fue ejecutada
      const { rows } = await client.query(
        'SELECT nombre FROM _migraciones WHERE nombre = $1',
        [archivo]
      );

      if (rows.length > 0) {
        console.log(`  omitida: ${archivo}`);
        continue;
      }

      // Ejecutar la migración
      const sql = readFileSync(join(migrationsDir, archivo), 'utf8');
      await client.query(sql);
      await client.query(
        'INSERT INTO _migraciones (nombre) VALUES ($1)',
        [archivo]
      );
      console.log(`  aplicada: ${archivo}`);
    }

    console.log('✅ Migraciones completadas');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);