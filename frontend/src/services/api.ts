const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type TaskEstado = 'pendiente' | 'en_progreso' | 'completada';

export interface TareaArchivo {
  id: string;
  tarea_id: string;
  url: string;
  nombre_original: string;
  creado_en: string;
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
}

export interface CreateTaskBody {
  titulo: string;
  descripcion?: string;
  fecha_limite?: string;
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

export async function getTasks(): Promise<Task[]> {
  return apiFetch<Task[]>('/api/tasks');
}

export async function createTask(body: CreateTaskBody): Promise<Task> {
  const payload: Record<string, string> = { titulo: body.titulo };
  if (body.descripcion !== undefined && body.descripcion !== '') {
    payload.descripcion = body.descripcion;
  }
  if (body.fecha_limite !== undefined && body.fecha_limite !== '') {
    payload.fecha_limite = body.fecha_limite;
  }
  return apiFetch<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTaskStatus(id: string, estado: TaskEstado): Promise<Task> {
  return apiFetch<Task>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ estado }),
  });
}

export async function deleteTask(id: string): Promise<void> {
  await apiFetch<void>(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
}

export async function uploadFile(taskId: string, file: File): Promise<Task> {
  const form = new FormData();
  form.append('archivo', file);
  return apiFetch<Task>(`/api/tasks/${taskId}/upload`, {
    method: 'POST',
    body: form,
  });
}

export async function deleteArchivo(taskId: string, archivoId: string): Promise<void> {
  await apiFetch<void>(`/api/tasks/${taskId}/archivos/${archivoId}`, {
    method: 'DELETE',
  });
}
