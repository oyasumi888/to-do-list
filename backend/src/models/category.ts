import { pool } from '../db/pool.js';

    export class Category {
    // Crear una nueva categoría
    static async create(usuario_id: string, nombre: string, color_hex: string) {
        const query = `
        INSERT INTO categorias (usuario_id, nombre, color_hex)
        VALUES ($1, $2, $3)
        RETURNING *;
        `;
        const result = await pool.query(query, [usuario_id, nombre, color_hex]);
        return result.rows[0];
    }

    // Obtener todas las categorías de un usuario
    static async findByUserId(usuario_id: string) {
        const query = `SELECT * FROM categorias WHERE usuario_id = $1 ORDER BY nombre ASC;`;
        const result = await pool.query(query, [usuario_id]);
        return result.rows;
    }

    // Método requerido: Actualizar el color de la categoría
    static async updateColor(id: string, usuario_id: string, nuevo_color: string) {
        const query = `
        UPDATE categorias 
        SET color_hex = $1
        WHERE id = $2 AND usuario_id = $3
        RETURNING *;
        `;
        // Se incluye usuario_id por seguridad, para que un usuario no modifique categorías de otros
        const result = await pool.query(query, [nuevo_color, id, usuario_id]);
        return result.rows[0];
    }
}