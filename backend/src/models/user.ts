import { pool } from '../db/pool.js';

export class User {
  // Método para crear un nuevo usuario
    static async create(nombre: string, email: string, password_hash: string) {
        const query = `
        INSERT INTO usuarios (nombre, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, nombre, email, creado_en;
        `;
        const result = await pool.query(query, [nombre, email, password_hash]);
        return result.rows[0];
    }

    // Método para buscar usuario por email (útil para el login)
    static async findByEmail(email: string) {
        const query = `SELECT * FROM usuarios WHERE email = $1;`;
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

  // Método requerido: Actualizar perfil
    static async updateProfile(id: string, nombre: string, email: string) {
        const query = `
        UPDATE usuarios 
        SET nombre = $1, email = $2
        WHERE id = $3
        RETURNING id, nombre, email;
        `;
        const result = await pool.query(query, [nombre, email, id]);
        return result.rows[0];
    }
}