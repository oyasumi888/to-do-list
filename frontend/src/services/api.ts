import { dueDateToYmd } from '../utils/dueDateFormat.js';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
// #region agent log
console.log('[debug-cd3ac2] API_BASE =', API_BASE, '| VITE_API_URL =', import.meta.env.VITE_API_URL);
// #endregion

export type TaskEstado = 'pendiente' | 'en_progreso' | 'completada' | 'expirada';

export interface TareaArchivo {
  id: string;
  tarea_id: string;
  url: string;
  nombre_original: string;
  creado_en: string;
}

export interface Category {
  id: string;
  nombre: string;
  color_hex: string;
  usuario_id?: string;
}

export interface Task {
  id: string;
  usuario_id: string;
  titulo: string;
  descripcion: string | null;
  fecha_limite: string | null;
  estado: TaskEstado;
  creado_en: string;
  archivos: TareaArchivo[];
  categorias: Category[];
}

export interface CreateTaskBody {
  titulo: string;
  descripcion?: string;
  fecha_limite?: string;
  /** Categoría de la tarea (vincula en tarea_categoria); debe pertenecer al usuario */
  categoria_id?: string;
  /** Compatibilidad nueva: asignación múltiple */
  categoria_ids?: string[];
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const body = init?.body;
  if (body && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let data: unknown;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      throw new Error(text || res.statusText);
    }
  } else {
    data = undefined;
  }

  if (!res.ok) {
    const msg =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : res.statusText;
    throw new Error(msg);
  }

  return data as T;
}

export async function getTasks(fechaLimiteEq?: string | null): Promise<Task[]> {
  const q =
    fechaLimiteEq && /^\d{4}-\d{2}-\d{2}$/.test(fechaLimiteEq)
      ? `?fecha_limite=${encodeURIComponent(fechaLimiteEq)}`
      : '';
  const list = await apiFetch<Task[]>(`/api/tasks${q}`);
  return list.map(normalizeTask);
}

function normalizeTask(task: Task): Task {
  return {
    ...task,
    fecha_limite: dueDateToYmd(task.fecha_limite),
    archivos: Array.isArray(task.archivos) ? task.archivos : [],
    categorias: Array.isArray(task.categorias) ? task.categorias : [],
  };
}

export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/api/categories');
}

export interface CreateCategoryBody {
  nombre: string;
  color_hex?: string;
}

export async function createCategory(body: CreateCategoryBody): Promise<Category> {
  const payload: Record<string, string> = { nombre: body.nombre };
  if (body.color_hex !== undefined && body.color_hex !== '') {
    payload.color_hex = body.color_hex;
  }
  return apiFetch<Category>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch<void>(`/api/categories/${id}`, {
    method: 'DELETE',
  });
}

export async function createTask(body: CreateTaskBody): Promise<Task> {
  const payload: Record<string, string | string[]> = { titulo: body.titulo };
  if (body.descripcion !== undefined && body.descripcion !== '') {
    payload.descripcion = body.descripcion;
  }
  if (body.fecha_limite !== undefined && body.fecha_limite !== '') {
    payload.fecha_limite = body.fecha_limite;
  }
  const categoriaIds = Array.from(new Set((body.categoria_ids ?? []).filter((id) => id !== '')));
  if (categoriaIds.length > 0) {
    payload.categoria_ids = categoriaIds;
  } else if (body.categoria_id !== undefined && body.categoria_id !== '') {
    payload.categoria_id = body.categoria_id;
  }
  const task = await apiFetch<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeTask(task);
}

/** Reemplaza el conjunto completo de categorías de una tarea. */
export async function setTaskCategories(id: string, categoria_ids: string[]): Promise<Task> {
  const ids = Array.from(new Set(categoria_ids.filter((c) => c !== '')));
  const task = await apiFetch<Task>(`/api/tasks/${id}/categories`, {
    method: 'PUT',
    body: JSON.stringify({ categoria_ids: ids }),
  });
  return normalizeTask(task);
}

export async function updateTaskStatus(id: string, estado: TaskEstado): Promise<Task> {
  const task = await apiFetch<Task>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ estado }),
  });
  return normalizeTask(task);
}

export async function deleteTask(id: string): Promise<void> {
  await apiFetch<void>(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
}

/** PATCH /api/tasks/:id/postpone — `fecha_limite` YYYY-MM-DD o `null` para quitar límite */
export async function postponeTask(id: string, fecha_limite: string | null): Promise<Task> {
  const task = await apiFetch<Task>(`/api/tasks/${id}/postpone`, {
    method: 'PATCH',
    body: JSON.stringify({ fecha_limite }),
  });
  return normalizeTask(task);
}

export async function uploadFile(taskId: string, file: File): Promise<Task> {
  const form = new FormData();
  form.append('archivo', file);
  const task = await apiFetch<Task>(`/api/tasks/${taskId}/upload`, {
    method: 'POST',
    body: form,
  });
  return normalizeTask(task);
}

export async function deleteArchivo(taskId: string, archivoId: string): Promise<void> {
  await apiFetch<void>(`/api/tasks/${taskId}/archivos/${archivoId}`, {
    method: 'DELETE',
  });
}
