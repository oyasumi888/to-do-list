import { pool } from '../db/pool.js';

    export class Task {
    // Crear una tarea básica
    static async create(usuario_id: string, titulo: string, descripcion?: string, fecha_limite?: string) {
        const query = `
        INSERT INTO tareas (usuario_id, titulo, descripcion, fecha_limite)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
        `;
        const result = await pool.query(query, [usuario_id, titulo, descripcion, fecha_limite]);
        return result.rows[0];
    }

  // Obtener las tareas de un usuario, incluyendo sus categorías mediante un JOIN
    static async findByUserId(usuario_id: string) {
        const query = `
        SELECT t.*, 
                COALESCE(json_agg(c.*) FILTER (WHERE c.id IS NOT NULL), '[]') as categorias
        FROM tareas t
        LEFT JOIN tarea_categoria tc ON t.id = tc.tarea_id
        LEFT JOIN categorias c ON tc.categoria_id = c.id
        WHERE t.usuario_id = $1
        GROUP BY t.id
        ORDER BY t.creado_en DESC;
        `;
        const result = await pool.query(query, [usuario_id]);
        return result.rows;
    }

    // Método requerido: Marcar como completada
    static async markAsDone(id: string, usuario_id: string) {
        const query = `
        UPDATE tareas 
        SET estado = 'completada'
        WHERE id = $1 AND usuario_id = $2
        RETURNING *;
        `;
        const result = await pool.query(query, [id, usuario_id]);
        return result.rows[0];
    }

  // Método extra esencial: Asignar una categoría a una tarea
    static async addCategory(tarea_id: string, categoria_id: string) {
        const query = `
        INSERT INTO tarea_categoria (tarea_id, categoria_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING -- Evita errores si ya estaba asignada
        RETURNING *;
        `;
        const result = await pool.query(query, [tarea_id, categoria_id]);
        return result.rows[0];
    }
}