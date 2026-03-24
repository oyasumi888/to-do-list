import { useEffect, useState, useCallback } from 'react';
import type { Toast as ToastType } from '../hooks/useToast.js';

interface Props {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 999,
    }}>
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

  const colors = {
    success: '#22913F',
    error:   '#E83030',
    loading: '#555',
  };

  const color = colors[toast.type];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '14px 16px',
      minWidth: '280px',
      maxWidth: '340px',
      background: '#1A1A1A',
      borderLeft: `3px solid ${color}`,
      position: 'relative',
      animation: removing ? 'fadeOut 0.25s ease forwards' : 'slideIn 0.25s ease',
    }}>

      {toast.type === 'loading' ? (
        <div style={{
          width: '14px', height: '14px',
          border: '2px solid #333',
          borderTopColor: '#888',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginTop: '3px',
          flexShrink: 0,
        }} />
      ) : (
        <div style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: '18px',
          color,
          minWidth: '20px',
          marginTop: '1px',
        }}>
          {toast.type === 'success' ? '[OK]' : '[!!]'}
        </div>
      )}

      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: '14px',
          letterSpacing: '3px',
          color,
          marginBottom: '2px',
        }}>
          {toast.title}
        </div>
        <div style={{
          fontSize: '10px',
          letterSpacing: '1px',
          color: '#999',
          lineHeight: 1.5,
        }}>
          {toast.message}
        </div>
      </div>

      <button onClick={handleRemove} style={{
        background: 'none', border: 'none',
        color: '#444', fontSize: '14px',
        cursor: 'pointer', padding: 0, lineHeight: 1,
      }}>
        &times;
      </button>

      {toast.type !== 'loading' && (
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0,
          height: '2px',
          background: color,
          animation: 'progress 3s linear forwards',
        }} />
      )}
    </div>
  );
}