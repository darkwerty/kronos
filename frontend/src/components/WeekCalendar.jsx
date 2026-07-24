import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';

export default function WeekCalendar({
  selectedDate,
  setSelectedDate,
  weekDays,
  weekCompletionMap,
  onPrevWeek,
  onNextWeek,
  onSetToday,
}) {
  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="date-navigator-container">
      <div className="date-navigator-header">
        <div className="current-date-info">
          <CalendarIcon size={18} className="text-cyan-400" />
          <span className="current-date-text">{formatDisplayDate(selectedDate)}</span>
          <input
            type="date"
            className="date-picker-hidden"
            id="date-picker-input"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
          />
          <label htmlFor="date-picker-input" className="btn-date-picker" title="Seleccionar cualquier fecha en el calendario">
            Cambiar 📅
          </label>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={onSetToday}>
          Hoy
        </button>
      </div>

      <div className="date-navigator">
        <button className="btn btn-secondary btn-icon-only" onClick={onPrevWeek} title="Semana anterior">
          <ChevronLeft size={18} />
        </button>

        <div className="week-bubbles-row">
          {weekDays.map((d) => {
            const dayData = weekCompletionMap[d.date];
            const isCompleted = dayData ? dayData.isCompleted : false;

            return (
              <button
                key={d.date}
                className={`week-bubble-btn ${d.isSelected ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => setSelectedDate(d.date)}
                title={`${formatDisplayDate(d.date)}${isCompleted ? ' - ¡Día completado 100%! 🌟' : ''}`}
              >
                <span className="week-bubble-day">{d.dayLetter}</span>
                <span className="week-bubble-num">{d.dayNum}</span>
                <span className="week-bubble-indicator">
                  {isCompleted && <Sparkles size={8} />}
                </span>
              </button>
            );
          })}
        </div>

        <button className="btn btn-secondary btn-icon-only" onClick={onNextWeek} title="Semana siguiente">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
