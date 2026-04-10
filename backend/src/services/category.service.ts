import { pool } from '../db/pool.js';

const DEFAULT_COLOR_HEX = '#6366f1';

export function isValidColorHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export const CategoryManager = {
  async createCategory(usuario_id: string, nombre: string, color_hex?: string) {
    const color = color_hex ?? DEFAULT_COLOR_HEX;
    const { rows } = await pool.query(
      `INSERT INTO categorias (usuario_id, nombre, color_hex)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [usuario_id, nombre, color]
    );
    return rows[0] as Record<string, unknown>;
  },

  async getCategoriesByUser(usuario_id: string) {
    const { rows } = await pool.query(
      `SELECT * FROM categorias WHERE usuario_id = $1 ORDER BY nombre ASC`,
      [usuario_id]
    );
    return rows as Record<string, unknown>[];
  },
};
