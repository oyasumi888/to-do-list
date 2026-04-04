import { useState } from 'react';
import type { Toast as ToastType } from '../hooks/useToast.js';
import './Toast.css';

interface Props {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastType; onRemove: (id: string) => void }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => onRemove(toast.id), 250);
  };

  // Generamos clases limpias: ej. "toast success removing"
  const animationClass = removing ? 'removing' : '';

  return (
    <div className={`toast ${toast.type} ${animationClass}`.trim()}>
      {toast.type === 'loading' ? (
        <div className="toast-spinner" />
      ) : (
        <div className="toast-icon">
          {toast.type === 'success' ? '[OK]' : '[!!]'}
        </div>
      )}

      {/* Este contenedor es clave para la forma rectangular */}
      <div className="toast-content">
        <div className="toast-title">
          {toast.title}
        </div>
        <div className="toast-message">
          {toast.message}
        </div>
      </div>

      <button onClick={handleRemove} className="toast-close">
        &times;
      </button>

      {toast.type !== 'loading' && (
        <div className="toast-progress" />
      )}
    </div>
  );
}