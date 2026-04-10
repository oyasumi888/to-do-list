import { useEffect, useState } from 'react';
import { getTasks } from '../services/api.js';
import type { Task } from '../services/api.js';
import { TaskItem } from './TaskItem.js';
import './TaskList.css';

interface TaskListProps {
  refreshNonce: number;
  selectedCategoryIds: string[];
  showToast: (type: 'success' | 'error' | 'loading', title: string, message: string) => string;
  removeToast: (id: string) => void;
}

export function TaskList({ refreshNonce, selectedCategoryIds, showToast, removeToast }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getTasks();
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
  }, [refreshNonce]);

  const visibleTasks =
    selectedCategoryIds.length === 0
      ? tasks
      : tasks.filter((task) =>
          (task.categorias ?? []).some((c) => selectedCategoryIds.includes(c.id))
        );

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
      {tasks.length === 0 ? (
        <p className="task-list-empty">No hay tareas. Crea una arriba.</p>
      ) : visibleTasks.length === 0 ? (
        <p className="task-list-empty">Ninguna tarea con estas categorías.</p>
      ) : (
        <ul className="task-list">
          {visibleTasks.map((task) => (
            <li key={task.id} className="task-list-item">
              <TaskItem
                task={task}
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
}
