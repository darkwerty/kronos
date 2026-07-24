import React from 'react';
import { ArrowRightLeft, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SyncGuestModal({ isOpen, onClose, habitIds, onSyncSuccess, showToast }) {
  const { syncGuestHabits } = useAuth();

  if (!isOpen || !habitIds || habitIds.length === 0) return null;

  const handleSync = async () => {
    try {
      const res = await syncGuestHabits(habitIds);
      showToast(`¡Se han vinculado ${res.synced_count} hábitos a tu cuenta!`);
      onSyncSuccess();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '460px' }}
      >
        <div className="modal-header">
          <h2>
            <ArrowRightLeft className="modal-icon" size={22} /> Sincronizar Hábitos
          </h2>
          <button className="icon-btn close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
          <p style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 500, marginBottom: '0.75rem' }}>
            Hemos detectado <strong>{habitIds.length} hábito(s)</strong> creados en modo invitado.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            ¿Deseas guardar estos hábitos en tu nueva cuenta de usuario para no perder tu progreso?
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Mantener en modo local
            </button>
            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={handleSync}
            >
              <CheckCircle2 size={18} /> Vincular a mi cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
