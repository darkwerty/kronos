import React, { useEffect, useState } from 'react';
import { BarChart3, Trophy, Star, Target, CheckCircle, Layers } from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import api from '../services/api';

export default function AnalyticsView({
  historyChecklists,
  loadingHistory,
  past7Days,
  uniqueHabits,
  formatShortDate,
  formatDisplayDate,
}) {
  const [categoryStats, setCategoryStats] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    const fetchCategoryAnalytics = async () => {
      setLoadingCategories(true);
      try {
        const data = await api.getCategoryAnalytics();
        if (data) {
          setCategoryStats(data);
        }
      } catch (err) {
        console.error('Error al obtener analíticas por categoría:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategoryAnalytics();
  }, []);

  if (loadingHistory) {
    return (
      <div className="empty-state" style={{ minHeight: '300px' }}>
        <div className="spinner"></div>
        <h3>Cargando analíticas...</h3>
      </div>
    );
  }

  if (!historyChecklists || historyChecklists.length === 0) {
    return (
      <div className="empty-state" style={{ minHeight: '300px' }}>
        <span>🌌</span>
        <h3>Sin historial registrado</h3>
        <p>Registra progreso en tus hábitos para comenzar a recopilar estadísticas.</p>
      </div>
    );
  }

  // Calculate summaries
  let totalCompletions = 0;
  let totalPossibleLogs = 0;
  let perfectDaysCount = 0;
  let bestDayName = 'N/A';
  let bestDayPercentage = -1;

  historyChecklists.forEach((day) => {
    const count = day.checklist.length;
    const completed = day.checklist.filter((item) => item.progress_state === 'COMPLETED').length;
    const pct = count > 0 ? Math.round((completed / count) * 100) : 0;

    totalCompletions += completed;
    totalPossibleLogs += count;

    if (count > 0 && pct === 100) {
      perfectDaysCount++;
    }

    if (pct > bestDayPercentage && count > 0) {
      bestDayPercentage = pct;
      bestDayName = formatDisplayDate(day.date);
    }
  });

  const avgCompletionRate = totalPossibleLogs > 0 ? Math.round((totalCompletions / totalPossibleLogs) * 100) : 0;

  return (
    <div className="analytics-content animate-fade-in">
      {/* Stat Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon-wrapper cyan">
            <Target size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{avgCompletionRate}%</span>
            <span className="stat-label">Tasa de Completitud Media</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <Trophy size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value text-purple">{perfectDaysCount}</span>
            <span className="stat-label">Días Perfectos (100%)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper emerald">
            <Star size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value text-emerald text-base">{bestDayName}</span>
            <span className="stat-label">Mejor Rendimiento ({bestDayPercentage}%)</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Section */}
      <div className="analytics-section">
        <h3 className="section-subtitle">
          <Layers size={18} className="text-purple-400" /> Desglose por Categorías de Vida
        </h3>
        {loadingCategories ? (
          <div className="empty-state-sm">Cargando categorías...</div>
        ) : categoryStats.length === 0 ? (
          <div className="empty-state-sm">No hay hábitos asignados a categorías.</div>
        ) : (
          <div className="category-stats-grid">
            {categoryStats.map((cat) => (
              <div
                key={cat.category_id}
                className="category-stat-card"
                style={{ borderColor: `${cat.category_color}44` }}
              >
                <div className="category-stat-header">
                  <span
                    className="category-icon-badge"
                    style={{ backgroundColor: `${cat.category_color}22`, color: cat.category_color }}
                  >
                    <CategoryIcon name={cat.category_icon} size={16} />
                  </span>
                  <div className="category-title-meta">
                    <span className="category-stat-name">{cat.category_name}</span>
                    <span className="category-stat-count">{cat.habit_count} hábito(s)</span>
                  </div>
                  <span className="category-xp-pill" style={{ color: cat.category_color }}>
                    {cat.total_xp} XP
                  </span>
                </div>

                <div className="category-stat-body">
                  <div className="flex-between text-xs mb-1">
                    <span className="text-muted">Completitud global</span>
                    <span className="font-semibold" style={{ color: cat.category_color }}>
                      {cat.completion_rate}% ({cat.completed_logs}/{cat.total_logs})
                    </span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: '6px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${cat.completion_rate}%`,
                        backgroundColor: cat.category_color,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Chart */}
      <div className="analytics-section">
        <h3 className="section-subtitle">
          <BarChart3 size={18} className="text-cyan-400" /> Rendimiento Semanal
        </h3>
        <div className="chart-container">
          {historyChecklists.map((day) => {
            const count = day.checklist.length;
            const completed = day.checklist.filter((item) => item.progress_state === 'COMPLETED').length;
            const pct = count > 0 ? Math.round((completed / count) * 100) : 0;

            let barClass = 'primary';
            if (pct === 100) barClass = 'success';
            else if (pct > 0) barClass = 'teal';

            return (
              <div className="chart-column" key={day.date}>
                <div className="chart-bar-wrapper">
                  <span className="chart-bar-value">{pct}%</span>
                  <div
                    className={`chart-bar-fill ${barClass}`}
                    style={{
                      height: `${Math.max(pct, 5)}%`,
                      opacity: count === 0 ? 0.2 : 1,
                    }}
                    title={`${completed}/${count} hábitos completados el ${day.date}`}
                  ></div>
                </div>
                <span className="chart-date-label">{formatShortDate(day.date)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Habit Matrix */}
      <div className="analytics-section">
        <h3 className="section-subtitle">
          <CheckCircle size={18} className="text-purple-400" /> Matriz de Hábitos de los últimos 7 Días
        </h3>

        {uniqueHabits.length === 0 ? (
          <p className="text-muted text-center py-4">No hay hábitos registrados en el historial.</p>
        ) : (
          <div className="matrix-table-container">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th>Hábito</th>
                  {past7Days.map((date) => (
                    <th key={date}>{formatShortDate(date)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uniqueHabits.map((habit) => (
                  <tr key={habit.id}>
                    <td className="matrix-habit-name">
                      {habit.name}
                      <span className="matrix-habit-unit"> ({habit.unit})</span>
                    </td>
                    {past7Days.map((date) => {
                      const dayData = historyChecklists.find((d) => d.date === date);
                      const checklistItem = dayData?.checklist.find((item) => item.id === habit.id);

                      let dotClass = 'none';
                      let titleText = 'Sin registro';

                      if (checklistItem) {
                        if (checklistItem.progress_state === 'COMPLETED') {
                          dotClass = 'completed';
                          titleText = 'Completado (100%)';
                        } else if (checklistItem.progress_state === 'IN_PROGRESS') {
                          dotClass = 'in-progress';
                          titleText = `En Progreso (${checklistItem.percentage}%)`;
                        } else {
                          dotClass = 'not-logged';
                          titleText = 'No completado (0%)';
                        }
                      }

                      return (
                        <td key={date} style={{ textAlign: 'center' }}>
                          <span className={`matrix-dot ${dotClass}`} title={titleText}></span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

