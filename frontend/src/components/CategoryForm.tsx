import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategory } from '../services/api.js';
import './CategoryForm.css';

const categoryFormSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(50, 'Máximo 50 caracteres'),
  color_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido'),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  showToast: (type: 'success' | 'error' | 'loading', title: string, message: string) => string;
  removeToast: (id: string) => void;
  onCategoryCreated: () => void;
}

const DEFAULT_COLOR = '#6366f1';

export function CategoryForm({ showToast, removeToast, onCategoryCreated }: CategoryFormProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      nombre: '',
      color_hex: DEFAULT_COLOR,
    },
  });

  const onSubmit = async (data: CategoryFormValues) => {
    const loadingId = showToast('loading', 'GUARDANDO', 'Creando categoría...');
    try {
      await createCategory({
        nombre: data.nombre.trim(),
        color_hex: data.color_hex,
      });
      removeToast(loadingId);
      showToast('success', 'CATEGORÍA CREADA', 'Ya puedes usarla en tareas y filtros.');
      form.reset({ nombre: '', color_hex: DEFAULT_COLOR });
      onCategoryCreated();
      setOpen(false);
    } catch (e) {
      removeToast(loadingId);
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      showToast('error', 'ERROR', msg);
    }
  };

  return (
    <section className="category-form-section" aria-label="Crear categoría">
      <button
        type="button"
        className="category-form-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? '← CERRAR' : 'CREAR CATEGORÍA [+]'}
      </button>
      {open && (
        <div className="category-form-panel">
          <h3 className="category-form-heading">
            NUEVA CATEGORÍA <span className="category-form-heading-accent">[+]</span>
          </h3>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="category-form-field">
              <label className="category-form-label" htmlFor="category-nombre">
                Nombre
              </label>
              <input
                id="category-nombre"
                type="text"
                maxLength={50}
                className={`category-form-input ${form.formState.errors.nombre ? 'error' : ''}`}
                {...form.register('nombre')}
              />
              {form.formState.errors.nombre && (
                <div className="category-form-error">{form.formState.errors.nombre.message}</div>
              )}
            </div>
            <div className="category-form-field">
              <label className="category-form-label" htmlFor="category-color">
                Color
              </label>
              <div className="category-form-color-row">
                <input
                  id="category-color"
                  type="color"
                  className="category-form-color-input"
                  {...form.register('color_hex')}
                />
                <span className="category-form-hex-value">{form.watch('color_hex')}</span>
              </div>
              {form.formState.errors.color_hex && (
                <div className="category-form-error">{form.formState.errors.color_hex.message}</div>
              )}
            </div>
            <button type="submit" className="category-form-submit">
              GUARDAR CATEGORÍA →
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
