import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTask, getCategories } from '../services/api.js';
import type { Category } from '../services/api.js';
import { DatePicker } from './DatePicker.js';
import { isDueDateTodayOrFuture, todayYmdLocal } from '../utils/dueDateFormat.js';
import './TaskForm.css';

const taskFormSchema = z.object({
  titulo: z.string().min(1, 'Título requerido').max(200, 'Máximo 200 caracteres'),
  descripcion: z.string().max(300, 'Máximo 300 caracteres').optional(),
  fecha_limite: z
    .string()
    .optional()
    .refine((v) => !v || isDueDateTodayOrFuture(v), 'La fecha límite no puede ser anterior a hoy'),
  categoria_ids: z.array(z.string()).optional(),
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
  const [categoryToAdd, setCategoryToAdd] = useState('');

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
      categoria_ids: [],
    },
  });

  const onSubmit = async (data: TaskFormValues) => {
    const loadingId = showToast('loading', 'GUARDANDO', 'Creando tarea...');
    try {
      await createTask({
        titulo: data.titulo.trim(),
        descripcion: data.descripcion?.trim() || undefined,
        fecha_limite: data.fecha_limite?.trim() || undefined,
        categoria_ids: Array.from(new Set((data.categoria_ids ?? []).filter((id) => id !== ''))),
      });
      removeToast(loadingId);
      showToast('success', 'TAREA CREADA', 'La tarea se guardó correctamente.');
      form.reset({ titulo: '', descripcion: '', fecha_limite: '', categoria_ids: [] });
      onCreated();
    } catch (e) {
      removeToast(loadingId);
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      showToast('error', 'ERROR', msg);
    }
  };

  const selectedCategoryIds = form.watch('categoria_ids') ?? [];

  const addCategory = () => {
    if (!categoryToAdd) return;
    if (selectedCategoryIds.includes(categoryToAdd)) {
      setCategoryToAdd('');
      return;
    }
    form.setValue('categoria_ids', [...selectedCategoryIds, categoryToAdd], { shouldDirty: true });
    setCategoryToAdd('');
  };

  const removeCategory = (categoryId: string) => {
    form.setValue(
      'categoria_ids',
      selectedCategoryIds.filter((id) => id !== categoryId),
      { shouldDirty: true }
    );
  };

  const selectedCategories = categories.filter((c) => selectedCategoryIds.includes(c.id));

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
            min={todayYmdLocal()}
            {...form.register('fecha_limite')}
          />
          {form.formState.errors.fecha_limite && (
            <div className="task-form-error">{form.formState.errors.fecha_limite.message}</div>
          )}
        </div>

        <div className="task-form-field">
          <label className="task-form-label" htmlFor="task-categoria">
            Categorías de la tarea
          </label>
          <div className="task-form-categories-layout">
            <div className="task-form-categories-left">
              <div className="task-form-categories-picker-row">
                <select
                  id="task-categoria"
                  className="task-form-input task-form-select"
                  value={categoryToAdd}
                  onChange={(e) => setCategoryToAdd(e.target.value)}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <button type="button" className="task-form-add-category-btn" onClick={addCategory}>
                  AGREGAR
                </button>
              </div>
            </div>

            <div className="task-form-categories-right">
              {selectedCategories.length === 0 ? (
                <p className="task-form-selected-empty">Sin categorías seleccionadas</p>
              ) : (
                <ul className="task-form-selected-list">
                  {selectedCategories.map((c) => (
                    <li key={c.id} className="task-form-selected-item">
                      <span className="task-form-selected-name">{c.nombre}</span>
                      <button
                        type="button"
                        className="task-form-selected-remove"
                        onClick={() => removeCategory(c.id)}
                        aria-label={`Quitar categoría ${c.nombre}`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="task-form-help">Selecciona en la lista y agrégala. Puedes quitar categorías desde la lista derecha.</div>
        </div>

        <button type="submit" className="task-form-submit">
          CREAR TAREA →
        </button>
      </form>
    </section>
  );
}
