import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTask, getCategories } from '../services/api.js';
import type { Category } from '../services/api.js';
import { DatePicker } from './DatePicker.js';
import './TaskForm.css';

const taskFormSchema = z.object({
  titulo: z.string().min(1, 'Título requerido').max(200, 'Máximo 200 caracteres'),
  descripcion: z.string().max(300, 'Máximo 300 caracteres').optional(),
  fecha_limite: z.string().optional(),
  categoria_id: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  showToast: (type: 'success' | 'error' | 'loading', title: string, message: string) => string;
  removeToast: (id: string) => void;
  onCreated: () => void;
  categoriesRefreshNonce: number;
}

export function TaskForm({ showToast, removeToast, onCreated, categoriesRefreshNonce }: TaskFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getCategories().then((list) => {
      if (!cancelled) setCategories(list);
    });
    return () => {
      cancelled = true;
    };
  }, [categoriesRefreshNonce]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      fecha_limite: '',
      categoria_id: '',
    },
  });

  const onSubmit = async (data: TaskFormValues) => {
    const loadingId = showToast('loading', 'GUARDANDO', 'Creando tarea...');
    try {
      await createTask({
        titulo: data.titulo.trim(),
        descripcion: data.descripcion?.trim() || undefined,
        fecha_limite: data.fecha_limite?.trim() || undefined,
        categoria_id: data.categoria_id?.trim() || undefined,
      });
      removeToast(loadingId);
      showToast('success', 'TAREA CREADA', 'La tarea se guardó correctamente.');
      form.reset({ titulo: '', descripcion: '', fecha_limite: '', categoria_id: '' });
      onCreated();
    } catch (e) {
      removeToast(loadingId);
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      showToast('error', 'ERROR', msg);
    }
  };

  return (
    <section className="task-form-section">
      <h2 className="task-form-heading">
        NUEVA TAREA <span className="task-form-heading-accent">[+]</span>
      </h2>
      <form className="task-form" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="task-form-field">
          <label className="task-form-label" htmlFor="task-titulo">
            Título
          </label>
          <input
            id="task-titulo"
            type="text"
            maxLength={200}
            className={`task-form-input ${form.formState.errors.titulo ? 'error' : ''}`}
            {...form.register('titulo')}
          />
          {form.formState.errors.titulo && (
            <div className="task-form-error">{form.formState.errors.titulo.message}</div>
          )}
        </div>

        <div className="task-form-field">
          <label className="task-form-label" htmlFor="task-descripcion">
            Descripción
          </label>
          <textarea
            id="task-descripcion"
            rows={3}
            maxLength={300}
            className="task-form-textarea"
            {...form.register('descripcion')}
          />
          {form.formState.errors.descripcion && (
            <div className="task-form-error">{form.formState.errors.descripcion.message}</div>
          )}
        </div>

        <div className="task-form-field">
          <DatePicker
            id="task-fecha"
            label="Fecha límite"
            error={!!form.formState.errors.fecha_limite}
            {...form.register('fecha_limite')}
          />
        </div>

        <div className="task-form-field">
          <label className="task-form-label" htmlFor="task-categoria">
            Categoría de la tarea
          </label>
          <select
            id="task-categoria"
            className="task-form-input task-form-select"
            {...form.register('categoria_id')}
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="task-form-submit">
          CREAR TAREA →
        </button>
      </form>
    </section>
  );
}
