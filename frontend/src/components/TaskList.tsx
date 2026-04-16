import { useEffect, useMemo, useState } from 'react';
import { getTasks } from '../services/api.js';
import type { Task } from '../services/api.js';
import { TaskItem } from './TaskItem.js';
import { dueDateToYmd, todayYmdLocal } from '../utils/dueDateFormat.js';
import './TaskList.css';

interface TaskListProps {
  refreshNonce: number;
  selectedCategoryIds: string[];
  /** `YYYY-MM-DD` o vacío: sin filtro en API */
  dueDateFilter: string;
  showToast: (type: 'success' | 'error' | 'loading', title: string, message: string) => string;
  removeToast: (id: string) => void;
}

export function TaskList({
  refreshNonce,
  selectedCategoryIds,
  dueDateFilter,
  showToast,
  removeToast,
}: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    expired: true,
    today: true,
    upcoming: true,
    noDate: true,
    completed: false,
  });

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getTasks(dueDateFilter || undefined);
      setTasks(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudieron cargar las tareas';
      setError(msg);
      showToast('error', 'ERROR', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when listNonce changes
  }, [refreshNonce, dueDateFilter]);

  const visibleTasks =
    selectedCategoryIds.length === 0
      ? tasks
      : tasks.filter((task) =>
          (task.categorias ?? []).some((c) => selectedCategoryIds.includes(c.id))
        );

  const grouped = useMemo(() => {
    const today = todayYmdLocal();
    const addDays = (ymd: string, days: number): string => {
      const [y, m, d] = ymd.split('-').map(Number);
      const dt = new Date(y, m - 1, d + days);
      const yy = String(dt.getFullYear());
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    };
    const upcomingEnd = addDays(today, 7);

    const expired: Task[] = [];
    const todayTasks: Task[] = [];
    const upcoming: Task[] = [];
    const noDate: Task[] = [];
    const completed: Task[] = [];

    for (const task of visibleTasks) {
      if (task.estado === 'completada') {
        completed.push(task);
        continue;
      }
      if (task.estado === 'expirada') {
        expired.push(task);
        continue;
      }
      const ymd = dueDateToYmd(task.fecha_limite);
      if (!ymd) {
        noDate.push(task);
        continue;
      }
      if (ymd === today) {
        todayTasks.push(task);
      } else if (ymd > today && ymd <= upcomingEnd) {
        upcoming.push(task);
      } else if (ymd < today) {
        expired.push(task);
      } else {
        noDate.push(task);
      }
    }

    return { expired, today: todayTasks, upcoming, noDate, completed };
  }, [visibleTasks]);

  const sectionDefs = [
    { key: 'expired', title: 'EXPIRADAS', tasks: grouped.expired, accent: 'task-list-section-block--expired' },
    { key: 'today', title: 'HOY', tasks: grouped.today, accent: '' },
    { key: 'upcoming', title: 'PRÓXIMAS (7 DÍAS)', tasks: grouped.upcoming, accent: '' },
    { key: 'noDate', title: 'SIN FECHA', tasks: grouped.noDate, accent: '' },
    { key: 'completed', title: 'COMPLETADAS', tasks: grouped.completed, accent: '' },
  ] as const;

  const sectionsToRender = showCompleted ? sectionDefs : sectionDefs.filter((s) => s.key !== 'completed');

  if (loading && tasks.length === 0) {
    return (
      <section className="task-list-section">
        <h2 className="task-list-heading">
          TAREAS <span className="task-list-heading-accent">[_]</span>
        </h2>
        <p className="task-list-empty">Cargando...</p>
      </section>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <section className="task-list-section">
        <h2 className="task-list-heading">
          TAREAS <span className="task-list-heading-accent">[_]</span>
        </h2>
        <p className="task-list-error">{error}</p>
        <button type="button" className="task-list-retry" onClick={() => void loadTasks()}>
          REINTENTAR
        </button>
      </section>
    );
  }

  return (
    <section className="task-list-section">
      <h2 className="task-list-heading">
        TAREAS <span className="task-list-heading-accent">[_]</span>
      </h2>
      <div className="task-list-controls">
        <button
          type="button"
          className={`task-list-control-btn ${showCompleted ? 'active' : ''}`}
          onClick={() => setShowCompleted((v) => !v)}
        >
          {showCompleted ? 'OCULTAR COMPLETADAS' : 'MOSTRAR COMPLETADAS'}
        </button>
        <button
          type="button"
          className={`task-list-control-btn ${compactMode ? 'active' : ''}`}
          onClick={() => setCompactMode((v) => !v)}
        >
          {compactMode ? 'VISTA DETALLE' : 'VISTA COMPACTA'}
        </button>
      </div>
      {tasks.length === 0 ? (
        <p className="task-list-empty">
          {dueDateFilter
            ? 'Ninguna tarea con límite en esa fecha.'
            : 'No hay tareas. Crea una arriba.'}
        </p>
      ) : visibleTasks.length === 0 ? (
        <p className="task-list-empty">Ninguna tarea con estas categorías.</p>
      ) : (
        <div className="task-list-grouped">
          {sectionsToRender.map((section) => {
            if (section.tasks.length === 0) return null;
            const expanded = expandedSections[section.key] ?? true;
            return (
              <section
                key={section.key}
                className={`task-list-section-block ${section.accent}`.trim()}
                aria-label={section.title}
              >
                <button
                  type="button"
                  className="task-list-section-toggle"
                  onClick={() =>
                    setExpandedSections((prev) => ({ ...prev, [section.key]: !expanded }))
                  }
                >
                  <span>{section.title}</span>
                  <span className="task-list-section-count">
                    {section.tasks.length} {expanded ? '−' : '+'}
                  </span>
                </button>
                {expanded && (
                  <ul className="task-list">
                    {section.tasks.map((task) => (
                      <li key={task.id} className="task-list-item">
                        <TaskItem
                          task={task}
                          compact={compactMode}
                          showToast={showToast}
                          removeToast={removeToast}
                          onChanged={() => void loadTasks()}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
