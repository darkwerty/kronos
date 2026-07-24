import React, { useState, useEffect } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';

export default function SmartLogModal({ item, isOpen, onClose, onSave, onDelete }) {
  const [val, setVal] = useState('');

  useEffect(() => {
    if (item) {
      setVal(item.amount_done !== null ? item.amount_done.toString() : '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const rawTarget = item.target_snapshot || item.amount;
  const unit = item.unit_snapshot || item.unit;

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      onSave(item.id, num);
      onClose();
    }
  };

  const handleQuickSet = (num) => {
    setVal(num.toString());
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Registar cantidad: <span className="highlight">{item.name}</span></h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            <div className="target-info-pill">
              Objetivo diario: <strong>{rawTarget} {unit}</strong>
            </div>

            <div className="form-group">
              <label>Cantidad efectuada hoy:</label>
              <div className="input-group">
                <input
                  type="number"
                  step="any"
                  min="0"
                  autoFocus
                  className="form-control text-lg"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  placeholder="0.0"
                  required
                />
                <span className="input-addon">{unit}</span>
              </div>
            </div>

            {/* Presets */}
            <div className="preset-buttons">
              <button type="button" className="btn-preset" onClick={() => handleQuickSet(Math.round(rawTarget * 0.25))}>
                25%
              </button>
              <button type="button" className="btn-preset" onClick={() => handleQuickSet(Math.round(rawTarget * 0.5))}>
                50%
              </button>
              <button type="button" className="btn-preset" onClick={() => handleQuickSet(Math.round(rawTarget * 0.75))}>
                75%
              </button>
              <button type="button" className="btn-preset active" onClick={() => handleQuickSet(rawTarget)}>
                100% ({rawTarget})
              </button>
            </div>
          </div>

          <div className="modal-footer">
            {item.amount_done !== null && (
              <button
                type="button"
                className="btn btn-danger-soft"
                onClick={() => {
                  onDelete(item.id);
                  onClose();
                }}
              >
                <RotateCcw size={15} /> Reset a 0
              </button>
            )}
            <div style={{ flex: 1 }}></div>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} /> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
