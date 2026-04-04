import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTask } from '../services/api.js';
import './TaskForm.css';

const taskFormSchema = z.object({
  titulo: z.string().min(1, 'Título requerido'),
  descripcion: z.string().optional(),
  fecha_limite: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  showToast: (type: 'success' | 'error' | 'loading', title: string, message: string) => string;
  removeToast: (id: string) => void;
  onCreated: () => void;
}

export function TaskForm({ showToast, removeToast, onCreated }: TaskFormProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      fecha_limite: '',
    },
  });

  const onSubmit = async (data: TaskFormValues) => {
    const loadingId = showToast('loading', 'GUARDANDO', 'Creando tarea...');
    try {
      await createTask({
        titulo: data.titulo.trim(),
        descripcion: data.descripcion?.trim() || undefined,
        fecha_limite: data.fecha_limite?.trim() || undefined,
      });
      removeToast(loadingId);
      showToast('success', 'TAREA CREADA', 'La tarea se guardó correctamente.');
      form.reset({ titulo: '', descripcion: '', fecha_limite: '' });
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
            className="task-form-textarea"
            {...form.register('descripcion')}
          />
        </div>

        <div className="task-form-field">
          <label className="task-form-label" htmlFor="task-fecha">
            Fecha límite
          </label>
          <input
            id="task-fecha"
            type="date"
            className="task-form-input"
            {...form.register('fecha_limite')}
          />
        </div>

        <button type="submit" className="task-form-submit">
          CREAR TAREA →
        </button>
      </form>
    </section>
  );
}
