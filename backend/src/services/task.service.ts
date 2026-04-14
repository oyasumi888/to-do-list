import path from 'path';
import { pool } from '../db/pool.js';

export type TaskEstado = 'pendiente' | 'en_progreso' | 'completada';

export type AssignCategoryResult =
  | { ok: true; status: 'created'; tarea_id: string; categoria_id: string }
  | { ok: true; status: 'already_assigned'; tarea_id: string; categoria_id: string }
  | { ok: false; status: 'not_found' };

const VALID_ESTADOS = new Set<TaskEstado>(['pendiente', 'en_progreso', 'completada']);

export function isValidEstado(value: string): value is TaskEstado {
  return VALID_ESTADOS.has(value as TaskEstado);
}

const TASK_SELECT_WITH_RELATIONS = `
  SELECT t.*,
    COALESCE(arch.archivos, '[]'::json) AS archivos,
    COALESCE(cat.categorias, '[]'::json) AS categorias
  FROM tareas t
  LEFT JOIN LATERAL (
    SELECT json_agg(
      json_build_object(
        'id', ta.id,
        'url', ta.url,
        'nombre_original', ta.nombre_original,
        'creado_en', ta.creado_en
      ) ORDER BY ta.creado_en ASC
    ) AS archivos
    FROM tarea_archivos ta
    WHERE ta.tarea_id = t.id
  ) arch ON true
  LEFT JOIN LATERAL (
    SELECT json_agg(
      json_build_object(
        'id', c.id,
        'nombre', c.nombre,
        'color_hex', c.color_hex
      ) ORDER BY c.nombre ASC
    ) AS categorias
    FROM tarea_categoria tc
    JOIN categorias c ON c.id = tc.categoria_id
    WHERE tc.tarea_id = t.id
  ) cat ON true
`;

function mapTaskRow(row: Record<string, unknown>): Record<string, unknown> {
  const { archivos, categorias, ...rest } = row;
  return {
    ...rest,
    archivos: Array.isArray(archivos) ? archivos : [],
    categorias: Array.isArray(categorias) ? categorias : [],
  };
}

export const TaskService = {
  async createTask(
    usuario_id: string,
    titulo: string,
    descripcion?: string,
    fecha_limite?: string | null,
    estado?: TaskEstado,
    categoria_id?: string
  ) {
    if (categoria_id !== undefined && categoria_id !== '') {
      const { rows: catRows } = await pool.query(
        `SELECT 1 FROM categorias WHERE id = $1 AND usuario_id = $2`,
        [categoria_id, usuario_id]
      );
      if (catRows.length === 0) {
        throw new Error('Categoría no válida');
      }
    }

    const estadoFinal = estado ?? 'pendiente';
    const { rows } = await pool.query(
      `INSERT INTO tareas (usuario_id, titulo, descripcion, fecha_limite, estado)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [usuario_id, titulo, descripcion ?? null, fecha_limite ?? null, estadoFinal]
    );
    const taskId = String(rows[0]['id']);

    if (categoria_id !== undefined && categoria_id !== '') {
      await pool.query(
        `INSERT INTO tarea_categoria (tarea_id, categoria_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [taskId, categoria_id]
      );
    }

    const full = await TaskService.getTaskWithArchivos(taskId, usuario_id);
    if (!full) {
      throw new Error('No se pudo cargar la tarea creada');
    }
    return full;
  },

  async getTasksByUser(usuario_id: string) {
    const { rows } = await pool.query(
      `${TASK_SELECT_WITH_RELATIONS}
       WHERE t.usuario_id = $1
       ORDER BY t.creado_en DESC`,
      [usuario_id]
    );
    return rows.map((r) => mapTaskRow(r as Record<string, unknown>));
  },

  async filterByDate(usuario_id: string) {
    const { rows } = await pool.query(
      `${TASK_SELECT_WITH_RELATIONS}
       WHERE t.usuario_id = $1
       ORDER BY t.fecha_limite ASC NULLS LAST, t.creado_en DESC`,
      [usuario_id]
    );
    return rows.map((r) => mapTaskRow(r as Record<string, unknown>));
  },

  async getTaskWithArchivos(id: string, usuario_id: string) {
    const { rows } = await pool.query(
      `${TASK_SELECT_WITH_RELATIONS}
       WHERE t.id = $1 AND t.usuario_id = $2`,
      [id, usuario_id]
    );
    const row = rows[0] as Record<string, unknown> | undefined;
    return row ? mapTaskRow(row) : undefined;
  },

  async updateTaskStatus(id: string, usuario_id: string, estado: string) {
    if (!isValidEstado(estado)) {
      throw new Error('Estado inválido');
    }
    const { rows } = await pool.query(
      `UPDATE tareas SET estado = $1 WHERE id = $2 AND usuario_id = $3 RETURNING id`,
      [estado, id, usuario_id]
    );
    if (rows.length === 0) {
      return undefined;
    }
    return TaskService.getTaskWithArchivos(id, usuario_id);
  },

  async postpone(id: string, usuario_id: string, fecha_limite: string | null) {
    const { rows } = await pool.query(
      `UPDATE tareas SET fecha_limite = $1 WHERE id = $2 AND usuario_id = $3 RETURNING id`,
      [fecha_limite, id, usuario_id]
    );
    if (rows.length === 0) {
      return undefined;
    }
    return TaskService.getTaskWithArchivos(id, usuario_id);
  },

  async deleteTask(id: string, usuario_id: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM tareas WHERE id = $1 AND usuario_id = $2`,
      [id, usuario_id]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async insertTareaArchivo(tarea_id: string, url: string, nombre_original: string) {
    const { rows } = await pool.query(
      `INSERT INTO tarea_archivos (tarea_id, url, nombre_original)
       VALUES ($1, $2, $3)
       RETURNING id, tarea_id, url, nombre_original, creado_en`,
      [tarea_id, url, nombre_original]
    );
    return rows[0] as Record<string, unknown> | undefined;
  },

  /** Returns storage filename (basename under uploads/) for unlink, or null if not matched */
  storageBasenameFromPublicUrl(fileUrl: string): string | null {
    const marker = '/uploads/';
    const i = fileUrl.indexOf(marker);
    if (i === -1) return null;
    const tail = fileUrl.slice(i + marker.length);
    const base = path.basename(tail);
    return base.length > 0 ? base : null;
  },

  async deleteTareaArchivo(
    archivo_id: string,
    tarea_id: string,
    usuario_id: string
  ): Promise<{ url: string } | null> {
    const { rows } = await pool.query(
      `DELETE FROM tarea_archivos ta
       USING tareas t
       WHERE ta.id = $1
         AND ta.tarea_id = $2
         AND t.id = ta.tarea_id
         AND t.usuario_id = $3
       RETURNING ta.url`,
      [archivo_id, tarea_id, usuario_id]
    );
    const row = rows[0] as { url: string } | undefined;
    return row ?? null;
  },

  async taskBelongsToUser(id: string, usuario_id: string): Promise<boolean> {
    const { rows } = await pool.query(
      `SELECT 1 FROM tareas WHERE id = $1 AND usuario_id = $2`,
      [id, usuario_id]
    );
    return rows.length > 0;
  },

  async assignCategory(
    tarea_id: string,
    categoria_id: string,
    usuario_id: string
  ): Promise<AssignCategoryResult> {
    const taskOk = await TaskService.taskBelongsToUser(tarea_id, usuario_id);
    if (!taskOk) {
      return { ok: false, status: 'not_found' };
    }

    const { rows: catRows } = await pool.query(
      `SELECT 1 FROM categorias WHERE id = $1 AND usuario_id = $2`,
      [categoria_id, usuario_id]
    );
    if (catRows.length === 0) {
      return { ok: false, status: 'not_found' };
    }

    const { rows } = await pool.query(
      `INSERT INTO tarea_categoria (tarea_id, categoria_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING tarea_id, categoria_id`,
      [tarea_id, categoria_id]
    );
    const row = rows[0] as { tarea_id: string; categoria_id: string } | undefined;
    if (row) {
      return {
        ok: true,
        status: 'created',
        tarea_id: row.tarea_id,
        categoria_id: row.categoria_id,
      };
    }
    return {
      ok: true,
      status: 'already_assigned',
      tarea_id,
      categoria_id,
    };
  },
};
