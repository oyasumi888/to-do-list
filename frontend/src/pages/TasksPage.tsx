import { useState } from 'react';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/Toast.js';
import { TaskForm } from '../components/TaskForm.js';
import { CategoryForm } from '../components/CategoryForm.js';
import { CategoryFilter } from '../components/CategoryFilter.js';
import { TaskDueDateFilter } from '../components/TaskDueDateFilter.js';
import { TaskList } from '../components/TaskList.js';
import './TasksPage.css';

interface TasksPageProps {
  onLogout: () => void;
}

export function TasksPage({ onLogout }: TasksPageProps) {
  const { toasts, showToast, removeToast } = useToast();
  const [listNonce, setListNonce] = useState(0);
  const [categoriesNonce, setCategoriesNonce] = useState(0);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [dueDateFilter, setDueDateFilter] = useState('');

  return (
    <>
      <div className="tasks-page">
        <header className="tasks-header">
          <div className="tasks-header-tag">// PANEL DE TAREAS</div>
          <div className="tasks-header-title">TO-DO LIST</div>
          <div className="tasks-header-bar">
            <span>SESION ACTIVA</span>
            <button type="button" className="tasks-logout" onClick={onLogout}>
              SALIR →
            </button>
          </div>
        </header>

        <main className="tasks-main">
          <TaskForm
            showToast={showToast}
            removeToast={removeToast}
            onCreated={() => setListNonce((n) => n + 1)}
            categoriesRefreshNonce={categoriesNonce}
          />
          <CategoryForm
            showToast={showToast}
            removeToast={removeToast}
            onCategoryCreated={() => setCategoriesNonce((n) => n + 1)}
          />
          <CategoryFilter
            selectedCategoryIds={selectedCategoryIds}
            onChangeSelected={setSelectedCategoryIds}
            categoriesRefreshNonce={categoriesNonce}
            showToast={showToast}
            removeToast={removeToast}
            onCategoryDeleted={(id) => {
              setSelectedCategoryIds((ids) => ids.filter((x) => x !== id));
              setCategoriesNonce((n) => n + 1);
              setListNonce((n) => n + 1);
            }}
          />
          <TaskDueDateFilter value={dueDateFilter} onChange={setDueDateFilter} />
          <TaskList
            refreshNonce={listNonce}
            selectedCategoryIds={selectedCategoryIds}
            dueDateFilter={dueDateFilter}
            showToast={showToast}
            removeToast={removeToast}
          />
        </main>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
