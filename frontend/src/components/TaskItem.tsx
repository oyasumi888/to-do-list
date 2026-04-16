import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { Category, Task, TaskEstado } from '../services/api.js';
import {
  updateTaskStatus,
  deleteTask,
  uploadFile,
  deleteArchivo,
  postponeTask,
  getCategories,
  setTaskCategories,
} from '../services/api.js';
import { DatePicker } from './DatePicker.js';
import { isDueDateTodayOrFuture, todayYmdLocal } from '../utils/dueDateFormat.js';
import { getDueUrgency } from '../utils/taskDueUrgency.js';
import './TaskItem.css';

const ESTADOS: TaskEstado[] = ['pendiente', 'en_progreso', 'completada'];

const estadoLabels: Record<TaskEstado, string> = {
  pendiente: 'PENDIENTE',
  en_progreso: 'EN PROGRESO',
  completada: 'COMPLETADA',
  expirada: 'EXPIRADA',
};

interface TaskItemProps {
  task: Task;
  showToast: (type: 'success' | 'error' | 'loading', title: string, message: string) => string;
  removeToast: (id: string) => void;
  onChanged: () => void;
  compact?: boolean;
}

function normalizeArchivos(task: Task) {
  return Array.isArray(task.archivos) ? task.archivos : [];
}

function normalizeCategorias(task: Task) {
  return Array.isArray(task.categorias) ? task.categorias : [];
}

const dueBadgeLabel: Record<'yellow' | 'red', string> = {
  yellow: 'PRÓXIMA',
  red: 'URGENTE',
};

export function TaskItem({ task, showToast, removeToast, onChanged, compact = false }: TaskItemProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [editCategoriesOpen, setEditCategoriesOpen] = useState(false);
  const [draftFecha, setDraftFecha] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);
  const [draftCategoryIds, setDraftCategoryIds] = useState<string[]>([]);
  const archivos = normalizeArchivos(task);
  const categorias = normalizeCategorias(task);
  const dueUrgency = getDueUrgency(task.fecha_limite ?? null, task.estado);
  const isExpired = task.estado === 'expirada';

  useEffect(() => {
    if (postponeOpen) {
      setDraftFecha(task.fecha_limite ?? '');
    }
  }, [postponeOpen, task.fecha_limite]);

  useEffect(() => {
    if (!editCategoriesOpen) return;
    let cancelled = false;
    void getCategories()
      .then((list) => {
        if (!cancelled) {
          setCategoryOptions(list);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategoryOptions([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [editCategoriesOpen]);

  useEffect(() => {
    if (!editCategoriesOpen) return;
    setDraftCategoryIds((task.categorias ?? []).map((c) => c.id));
  }, [editCategoriesOpen, task.categorias]);

  const handleStatus = async (estado: TaskEstado) => {
    if (estado === task.estado) return;
    const loadingId = showToast('loading', 'ACTUALIZANDO', 'Cambiando estado...');
    try {
      await updateTaskStatus(task.id, estado);
      removeToast(loadingId);
      showToast('success', 'ESTADO ACTUALIZADO', '');
      onChanged();
    } catch (e) {
      removeToast(loadingId);
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      showToast('error', 'ERROR', msg);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    const loadingId = showToast('loading', 'ELIMINANDO', '');
    try {
      await deleteTask(task.id);
      removeToast(loadingId);
      showToast('success', 'TAREA ELIMINADA', '');
      onChanged();
    } catch (e) {
      removeToast(loadingId);
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      showToast('error', 'ERROR', msg);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const loadingId = showToast('loading', 'SUBIENDO', 'Adjuntando archivo...');
    try {
      await uploadFile(task.id, file);
      removeToast(loadingId);
      showToast('success', 'ARCHIVO ADJUNTO', 'El archivo se guardó correctamente.');
      onChanged();
    } catch (err) {
      removeToast(loadingId);
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      showToast('error', 'ERROR', msg);
    }
  };

  const handlePostponeSave = async () => {
    const fecha_limite = draftFecha === '' ? null : draftFecha;
    if (fecha_limite !== null && !isDueDateTodayOrFuture(fecha_limite)) {
      showToast('error', 'ERROR', 'La fecha límite no puede ser anterior a hoy.');
      return;
    }
    const loadingId = showToast('loading', 'GUARDANDO', 'Actualizando fecha límite...');
    try {
      await postponeTask(task.id, fecha_limite);
      removeToast(loadingId);
      showToast('success', 'FECHA ACTUALIZADA', '');
      setPostponeOpen(false);
      onChanged();
    } catch (e) {
      removeToast(loadingId);
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      showToast('error', 'ERROR', msg);
    }
  };

  const handleDeleteArchivo = async (archivoId: string) => {
    if (!window.confirm('¿Quitar este archivo?')) return;
    const loadingId = showToast('loading', 'ELIMINANDO', 'Quitando archivo...');
    try {
      await deleteArchivo(task.id, archivoId);
      removeToast(loadingId);
      showToast('success', 'ARCHIVO ELIMINADO', '');
      onChanged();
    } catch (e) {
      removeToast(loadingId);
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      showToast('error', 'ERROR', msg);
    }
  };

  const toggleDraftCategory = (id: string) => {
    setDraftCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSaveCategories = async () => {
    const loadingId = showToast('loading', 'GUARDANDO', 'Actualizando categorías...');
    try {
      await setTaskCategories(task.id, draftCategoryIds);
      removeToast(loadingId);
      showToast('success', 'CATEGORÍAS ACTUALIZADAS', '');
      setEditCategoriesOpen(false);
      onChanged();
    } catch (e) {
      removeToast(loadingId);
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      showToast('error', 'ERROR', msg);
    }
  };

  return (
    <article className={`task-item ${isExpired ? 'task-item--expired' : ''} ${compact ? 'task-item--compact' : ''}`}>
      <div className="task-item-main">
        <div className="task-item-header">
          <h3 className="task-item-title">{task.titulo}</h3>
          {dueUrgency !== 'none' && !isExpired && (
            <span className={`task-due-badge task-due-badge--${dueUrgency}`}>
              {dueBadgeLabel[dueUrgency]}
            </span>
          )}
          <span className={`task-badge task-badge--${task.estado}`}>
            {estadoLabels[task.estado]}
          </span>
        </div>
        {categorias.length > 0 && (
          <ul className="task-item-categorias">
            {categorias.map((cat) => (
              <li key={cat.id} className="task-item-categoria-li">
                <span
                  className="task-item-categoria-pill"
                  style={{ ['--category-accent' as string]: cat.color_hex }}
                >
                  {cat.nombre}
                </span>
              </li>
            ))}
          </ul>
        )}
        {task.descripcion && <p className="task-item-desc">{task.descripcion}</p>}
        {task.fecha_limite && (
          <p
            className={
              isExpired
                ? 'task-item-meta task-item-meta--red'
                : dueUrgency === 'yellow'
                ? 'task-item-meta task-item-meta--yellow'
                : dueUrgency === 'red'
                  ? 'task-item-meta task-item-meta--red'
                  : 'task-item-meta'
            }
          >
            <span className="task-item-meta-label">Límite:</span> {task.fecha_limite}
          </p>
        )}
        {archivos.length > 0 && (
          <ul className="task-item-archivos">
            {archivos.map((a) => (
              <li key={a.id} className="task-item-archivo-row">
                <a href={a.url} target="_blank" rel="noreferrer" className="task-item-link">
                  {a.nombre_original}
                </a>
                <button
                  type="button"
                  className="task-archivo-remove"
                  onClick={() => void handleDeleteArchivo(a.id)}
                  aria-label={`Quitar ${a.nombre_original}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="task-item-actions">
        <div className="task-item-status-btns">
          {ESTADOS.map((s) => (
            <button
              key={s}
              type="button"
              className={`task-status-btn ${task.estado === s ? 'active' : ''}`}
              disabled={isExpired}
              onClick={() => void handleStatus(s)}
            >
              {estadoLabels[s]}
            </button>
          ))}
        </div>
        <div className="task-item-row-btns">
          <input
            ref={fileInputRef}
            type="file"
            className="task-file-input"
            onChange={(ev) => void handleFileChange(ev)}
            aria-label="Adjuntar archivo"
          />
          <button
            type="button"
            className="task-postpone-toggle"
            onClick={() => setPostponeOpen((o) => !o)}
            aria-expanded={postponeOpen}
          >
            {postponeOpen ? 'OCULTAR FECHA' : 'CAMBIAR FECHA'}
          </button>
          <button
            type="button"
            className="task-attach-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            ADJUNTAR
          </button>
          <button
            type="button"
            className="task-edit-categories-toggle"
            onClick={() => setEditCategoriesOpen((o) => !o)}
            aria-expanded={editCategoriesOpen}
          >
            {editCategoriesOpen ? 'OCULTAR CATEGORÍAS' : 'EDITAR CATEGORÍAS'}
          </button>
          <button type="button" className="task-delete-btn" onClick={() => void handleDelete()}>
            ELIMINAR
          </button>
        </div>
        {editCategoriesOpen && (
          <div className="task-item-categories-panel">
            <p className="task-item-categories-title">Selecciona categorías</p>
            <div className="task-item-categories-grid">
              {categoryOptions.map((cat) => {
                const active = draftCategoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`task-item-category-choice ${active ? 'active' : ''}`}
                    onClick={() => toggleDraftCategory(cat.id)}
                    style={{ ['--category-accent' as string]: cat.color_hex }}
                  >
                    {cat.nombre}
                  </button>
                );
              })}
            </div>
            <div className="task-item-categories-actions">
              <button type="button" className="task-postpone-clear" onClick={() => setDraftCategoryIds([])}>
                SIN CATEGORÍAS
              </button>
              <button type="button" className="task-postpone-cancel" onClick={() => setEditCategoriesOpen(false)}>
                CANCELAR
              </button>
              <button type="button" className="task-postpone-save" onClick={() => void handleSaveCategories()}>
                GUARDAR
              </button>
            </div>
          </div>
        )}
        {postponeOpen && (
          <div className="task-item-postpone-panel">
            <DatePicker
              id={`task-postpone-${task.id}`}
              label="Nueva fecha límite"
              className="task-item-postpone-picker"
              value={draftFecha}
              min={todayYmdLocal()}
              onChange={(e) => setDraftFecha(e.target.value)}
            />
            <div className="task-item-postpone-actions">
              <button type="button" className="task-postpone-clear" onClick={() => setDraftFecha('')}>
                SIN LÍMITE
              </button>
              <button type="button" className="task-postpone-cancel" onClick={() => setPostponeOpen(false)}>
                CANCELAR
              </button>
              <button type="button" className="task-postpone-save" onClick={() => void handlePostponeSave()}>
                GUARDAR
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
