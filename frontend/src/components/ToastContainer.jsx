import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function ToastContainer({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item ${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'error' ? (
              <AlertCircle size={18} className="text-red-400" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-400" />
            )}
          </div>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => onClose(toast.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
