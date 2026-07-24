import React from 'react';
import { Check, Flame, Edit3, Zap, Shield, Plus, Calendar } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import { formatTargetDaysLabel } from './HabitForgeDrawer';

export default function HabitCard({
  item,
  isMini,
  onToggleMini,
  onLogProgress,
  onQuickIncrement,
  onOpenSmartModal,
}) {
  const currentProgress = item.amount_done || 0;
  const rawTarget = item.target_snapshot || item.amount;
  const miniTarget = rawTarget <= 5 ? 1 : Math.round(rawTarget * 0.2);
  const effectiveTarget = isMini ? miniTarget : rawTarget;
  const unit = item.unit_snapshot || item.unit;

  const percentage = Math.min(100, Math.round((currentProgress / effectiveTarget) * 100));
  const isCompleted = currentProgress >= effectiveTarget || item.progress_state === 'COMPLETED';
  const streak = item.streak || 0;
  const rankTitle = item.rank_title || 'Novato 🥉';
  const category = item.category;

  return (
    <div className={`habit-row-card ${isCompleted ? 'completed' : ''} ${isMini ? 'mini-mode' : ''}`}>
      {/* Background progress fill */}
      <div className="card-progress-bar-fill" style={{ width: `${percentage}%` }}></div>

      {/* Main card content wrapper */}
      <div className="habit-card-inner">
        {/* Top Header */}
        <div className="habit-row-top">
          <div className="habit-title-group">
            {/* Quick Mini Toggle Button */}
            <button
              type="button"
              className={`btn-mini-toggle ${isMini ? 'active' : ''}`}
              onClick={() => onToggleMini(item.id)}
              title={isMini ? 'Desactivar Modo Mini (Meta Completa)' : 'Activar Modo Mini (⚡ Rápido)'}
            >
              <Zap size={14} />
            </button>

            {/* Habit Name & Target Goal */}
            <div className="habit-name-wrapper">
              <div className="name-streak-row">
                {category && (
                  <span
                    className="category-badge"
                    style={{
                      backgroundColor: `${category.color}22`,
                      color: category.color,
                      borderColor: `${category.color}55`,
                    }}
                    title={`Categoría: ${category.name}`}
                  >
                    <CategoryIcon name={category.icon} size={12} />
                    <span>{category.name}</span>
                  </span>
                )}

                <span className="habit-row-name">
                  {item.name}
                  {isMini && <span className="mini-badge">MINI ⚡</span>}
                </span>

                {/* Streak Badge */}
                {streak > 0 && (
                  <span className="streak-badge" title={`${streak} días consecutivos completados`}>
                    <Flame size={13} className="flame-icon" />
                    <span>{streak}d</span>
                  </span>
                )}

                {/* Unscheduled Bonus Badge */}
                {item.is_scheduled === false && (
                  <span className="bonus-day-badge" title="¡Este hábito no estaba agendado para hoy! Complétalo para ganar Bonus XP.">
                    🌟 Esfuerzo Extra (+XP)
                  </span>
                )}
              </div>


              <span className="habit-row-target">
                Meta: <strong>{effectiveTarget} {unit}</strong>{' '}
                {isMini && <span className="mini-target-note">(Original: {rawTarget})</span>}
                {item.target_days && item.target_days !== '1,2,3,4,5,6,7' && (
                  <span className="schedule-badge" title={`Programación: ${formatTargetDaysLabel(item.target_days)}`}>
                    <Calendar size={11} /> {formatTargetDaysLabel(item.target_days)}
                  </span>
                )}
              </span>
            </div>
          </div>




          {/* Rank & Level Badges */}
          <div className="habit-row-level">
            <span className="rank-badge" title={`Rango por nivel: ${rankTitle}`}>
              <Shield size={12} /> {rankTitle}
            </span>
            <span className="level-pill">Lv.{item.level}</span>
            <span className="xp-pill">{item.current_xp} XP</span>
          </div>
        </div>

        {/* Bottom Actions Row */}
        <div className="habit-row-bottom">
          {/* Main One-Tap Checkmark Button */}
          <button
            className={`habit-check-btn-wrapper ${isCompleted ? 'checked' : ''}`}
            onClick={() => onLogProgress(item.id, isCompleted ? 0 : effectiveTarget)}
            title={isCompleted ? 'Marcar como incompleto' : 'Completar al 100%'}
          >
            <div className={`habit-check-btn ${isCompleted ? 'checked' : ''}`}>
              {isCompleted && <Check size={16} strokeWidth={3} />}
            </div>
            <span className="check-btn-text">{isCompleted ? 'Completado' : 'Completar'}</span>
          </button>

          {/* Counter Display & Smart Modal Trigger */}
          <button
            className="progress-counter-badge"
            onClick={() => onOpenSmartModal(item)}
            title="Ingresar cantidad exacta"
          >
            <span className="counter-numbers">
              {currentProgress} / {effectiveTarget} {unit}
            </span>
            <Edit3 size={13} className="edit-icon" />
          </button>

          {/* Quick Increment Buttons */}
          <div className="quick-volume-actions">
            <button
              className="btn-quick-vol"
              onClick={() => onQuickIncrement(item, 1)}
              title="Añadir +1"
            >
              +1
            </button>
            {rawTarget >= 5 && (
              <button
                className="btn-quick-vol btn-quick-vol-lg"
                onClick={() => onQuickIncrement(item, rawTarget >= 50 ? 10 : 5)}
                title={`Añadir +${rawTarget >= 50 ? 10 : 5}`}
              >
                +{rawTarget >= 50 ? 10 : 5}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
