import { useState } from 'react';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/Toast.js';
import { TaskForm } from '../components/TaskForm.js';
import { TaskList } from '../components/TaskList.js';
import './TasksPage.css';

interface TasksPageProps {
  onLogout: () => void;
}

export function TasksPage({ onLogout }: TasksPageProps) {
  const { toasts, showToast, removeToast } = useToast();
  const [listNonce, setListNonce] = useState(0);

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
          />
          <TaskList
            refreshNonce={listNonce}
            showToast={showToast}
            removeToast={removeToast}
          />
        </main>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
