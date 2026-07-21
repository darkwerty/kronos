import { useState, useEffect, useRef } from 'react';
import './App.css';
import NeonConfetti from './NeonConfetti';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [habits, setHabits] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - offset * 60 * 1000);
    return localToday.toISOString().split('T')[0];
  });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [habitName, setHabitName] = useState('');
  const [habitAmount, setHabitAmount] = useState('1.0');
  const [habitUnit, setHabitUnit] = useState('check');
  const [editingHabit, setEditingHabit] = useState(null);
  
  // UX State
  const [showManager, setShowManager] = useState(false);
  const [activeTab, setActiveTab] = useState('TRACKER'); // 'TRACKER' or 'HISTORY'

  // Micro-interactions & Smart Input State
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [animatingHabitId, setAnimatingHabitId] = useState(null);
  const [confettiTrigger, setConfettiTrigger] = useState(null);
  const [weekCompletionMap, setWeekCompletionMap] = useState({});
  const [miniHabitsMap, setMiniHabitsMap] = useState({});
  const prevCompletionPctRef = useRef(0);

  const toggleMiniMode = (habitId) => {
    setMiniHabitsMap((prev) => ({
      ...prev,
      [habitId]: !prev[habitId],
    }));
  };

  // History State
  const [historyChecklists, setHistoryChecklists] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');

  const [customLogAmounts, setCustomLogAmounts] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchHabits();
  }, []);

  // Fetch checklist when date changes
  useEffect(() => {
    fetchChecklist();
  }, [selectedDate]);

  // Fetch history when history tab is selected or habits change
  useEffect(() => {
    if (activeTab === 'HISTORY') {
      fetchHistory();
    }
  }, [activeTab, habits]);

  const showNotification = (message, isError = false) => {
    if (isError) {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(''), 5000);
    } else {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const fetchHabits = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/habits`);
      if (!response.ok) throw new Error('Failed to fetch habits');
      const data = await response.json();
      setHabits(data);
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const fetchChecklist = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/habits/checklist?target_date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch checklist');
      const data = await response.json();
      setChecklist(data);
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const getPast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      const offset = d.getTimezoneOffset();
      const localTime = new Date(d.getTime() - offset * 60 * 1000);
      localTime.setDate(localTime.getDate() - i);
      dates.push(localTime.toISOString().split('T')[0]);
    }
    return dates;
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const dates = getPast7Days();
      const requests = dates.map(async (date) => {
        const response = await fetch(`${API_BASE_URL}/habits/checklist?target_date=${date}`);
        if (!response.ok) throw new Error(`Failed to fetch checklist for ${date}`);
        const checklistData = await response.json();
        return { date, checklist: checklistData };
      });
      const results = await Promise.all(requests);
      setHistoryChecklists(results);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!habitName.trim()) {
      showNotification('Habit name cannot be empty', true);
      return;
    }
    const amountNum = parseFloat(habitAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showNotification('Target amount must be a number greater than 0', true);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: habitName.trim(),
          amount: amountNum,
          unit: habitUnit.trim() || 'check',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create habit');
      }

      showNotification(`Created habit: ${data.name}`);
      setHabitName('');
      setHabitAmount('1.0');
      setHabitUnit('check');
      fetchHabits();
      fetchChecklist();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleEditClick = (habit) => {
    setEditingHabit(habit);
    setEditName(habit.name);
    setEditAmount(habit.amount);
    setEditUnit(habit.unit);
    setEditStatus(habit.status);
  };

  const handleUpdateHabit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      showNotification('Habit name cannot be empty', true);
      return;
    }
    const amountNum = parseFloat(editAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showNotification('Target amount must be a number greater than 0', true);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/habits/${editingHabit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          amount: amountNum,
          unit: editUnit.trim(),
          status: editStatus,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update habit');
      }

      showNotification(`Updated habit: ${data.name}`);
      setEditingHabit(null);
      fetchHabits();
      fetchChecklist();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleToggleStatus = async (habit, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/habits/${habit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to change habit status');
      }

      showNotification(`Habit "${data.name}" status set to ${newStatus}`);
      fetchHabits();
      fetchChecklist();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleLogProgress = async (habitId, amount) => {
    try {
      const response = await fetch(`${API_BASE_URL}/habits/${habitId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logged_date: selectedDate,
          amount_done: amount,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to log progress');
      }

      showNotification('Progress logged successfully!');
      fetchChecklist();
      fetchHabits(); // XP and Levels might have updated
      fetchWeekCompletionData(weekDays);
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteLog = async (habitId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/habits/${habitId}/logs/${selectedDate}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to delete log');
      }

      showNotification('Log reset successfully!');
      fetchChecklist();
      fetchHabits();
      fetchWeekCompletionData(weekDays);
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  // 7-Day Week Calculation & Completion Tracking (Fase 2)
  const getWeekDays = (referenceDateStr) => {
    const parts = referenceDateStr.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const ref = new Date(y, m, d);

    const dayOfWeek = ref.getDay();
    const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Mon = 1 ... Sun = 7
    const diffToMon = 1 - isoDay;

    const monday = new Date(y, m, d + diffToMon);

    const days = [];
    const spanishLetters = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - offset * 60 * 1000).toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      const isoStr = `${yyyy}-${mm}-${dd}`;

      days.push({
        date: isoStr,
        dayNum: cur.getDate(),
        dayLetter: spanishLetters[i],
        isToday: isoStr === localToday,
        isSelected: isoStr === referenceDateStr,
      });
    }
    return days;
  };

  const weekDays = getWeekDays(selectedDate);

  const fetchWeekCompletionData = async (days) => {
    try {
      const requests = days.map((d) =>
        fetch(`${API_BASE_URL}/habits/checklist?target_date=${d.date}`).then((res) => (res.ok ? res.json() : []))
      );
      const results = await Promise.all(requests);
      const map = {};
      days.forEach((d, idx) => {
        const dayChecklist = results[idx] || [];
        const total = dayChecklist.length;
        const completed = dayChecklist.filter((item) => item.progress_state === 'COMPLETED').length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        map[d.date] = {
          total,
          completed,
          percentage: pct,
          isCompleted: total > 0 && completed === total,
        };
      });
      setWeekCompletionMap(map);
    } catch (err) {
      console.error('Failed to fetch week completion data:', err);
    }
  };

  // Update week completion data when selectedDate or habits change
  useEffect(() => {
    fetchWeekCompletionData(weekDays);
  }, [selectedDate, habits]);

  const handlePrevWeek = () => {
    const parts = selectedDate.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10) - 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleNextWeek = () => {
    const parts = selectedDate.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10) + 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleSetToday = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - offset * 60 * 1000);
    setSelectedDate(localToday.toISOString().split('T')[0]);
  };

  const handleQuickIncrement = (item, delta) => {
    setAnimatingHabitId(item.id);
    setTimeout(() => setAnimatingHabitId(null), 400);

    const current = item.amount_done || 0;
    const newAmount = Math.max(0, current + delta);
    handleLogProgress(item.id, newAmount);
  };

  const toggleSmartInput = (habitId) => {
    setExpandedLogId((prev) => (prev === habitId ? null : habitId));
  };

  const formatDayName = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  };

  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatShortDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
  };

  // Filtering Habits for the Habits Management Panel
  const filteredHabits = habits.filter((h) => {
    if (statusFilter === 'ALL') return true;
    return h.status === statusFilter;
  });

  // Calculate Quest Stats for today/selected date
  const totalHabitsCount = checklist.length;
  const completedHabitsCount = checklist.filter((item) => item.progress_state === 'COMPLETED').length;
  const completionPercentage = totalHabitsCount > 0 ? Math.round((completedHabitsCount / totalHabitsCount) * 100) : 0;

  // Trigger neon confetti explosion when completing Daily Quest (100%)
  useEffect(() => {
    if (totalHabitsCount > 0 && completionPercentage === 100 && prevCompletionPctRef.current < 100) {
      setConfettiTrigger(Date.now());
    }
    prevCompletionPctRef.current = completionPercentage;
  }, [completionPercentage, totalHabitsCount]);

  // Analytics calculations
  const past7Days = getPast7Days();
  const allHabitKeys = {};
  historyChecklists.forEach((day) => {
    day.checklist.forEach((item) => {
      allHabitKeys[item.id] = { name: item.name, unit: item.unit };
    });
  });
  const uniqueHabits = Object.keys(allHabitKeys).map((id) => ({
    id: parseInt(id),
    name: allHabitKeys[id].name,
    unit: allHabitKeys[id].unit,
  }));

  // Stats summaries
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
    <div className="dashboard">
      <NeonConfetti trigger={confettiTrigger} />

      <header className="dashboard-header">
        <div className="brand">
          <h1>KRONOS</h1>
          <span className="brand-subtitle">Habit Forge v0.2.0</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="system-messages">
            {errorMsg && <div className="badge archived btn-danger animate-fade-in" style={{ padding: '0.5rem 1rem' }}>⚠️ {errorMsg}</div>}
            {successMsg && <div className="badge active btn-success animate-fade-in" style={{ padding: '0.5rem 1rem' }}>✨ {successMsg}</div>}
          </div>
          <button 
            className={`btn ${showManager ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowManager(!showManager)}
            id="btn-toggle-manager"
          >
            {showManager ? 'Close Forge ✕' : '⚙️ Forge & Manage Habits'}
          </button>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'TRACKER' ? 'active' : ''}`}
          onClick={() => setActiveTab('TRACKER')}
        >
          📝 Daily Tracker
        </button>
        <button 
          className={`tab-btn ${activeTab === 'HISTORY' ? 'active' : ''}`}
          onClick={() => setActiveTab('HISTORY')}
        >
          📊 History & Analytics
        </button>
      </div>

      {/* Main layout container, expands layout when manager is open */}
      <main className={`dashboard-grid ${showManager ? 'manager-open' : ''}`}>
        
        {/* LEFT COMPONENT: TAB CONTENT */}
        {activeTab === 'TRACKER' ? (
          /* TAB 1: DAILY TRACKER (Checklist view) */
          <section className="panel checklist-panel animate-fade-in">
            <div className="panel-title-container">
              <h2>⏱️ Daily Checklist</h2>
              <button className="btn btn-secondary btn-sm" onClick={handleSetToday}>Today</button>
            </div>

            {/* Mini-Calendario Semanal Horizontal (Fase 2) */}
            <div className="date-navigator">
              <button className="btn btn-secondary btn-icon-only" onClick={handlePrevWeek} title="Semana anterior">◀</button>
              
              <div className="week-bubbles-row">
                {weekDays.map((d) => {
                  const dayData = weekCompletionMap[d.date];
                  const isCompleted = dayData ? dayData.isCompleted : false;

                  return (
                    <button
                      key={d.date}
                      className={`week-bubble-btn ${d.isSelected ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                      onClick={() => setSelectedDate(d.date)}
                      title={`${formatDisplayDate(d.date)}${isCompleted ? ' - ¡Día completado al 100%! 🌟' : ''}`}
                    >
                      <span className="week-bubble-day">{d.dayLetter}</span>
                      <span className="week-bubble-num">{d.dayNum}</span>
                      <span className="week-bubble-indicator"></span>
                    </button>
                  );
                })}
              </div>

              <button className="btn btn-secondary btn-icon-only" onClick={handleNextWeek} title="Semana siguiente">▶</button>
            </div>

            {/* Gamified Rewards Overview */}
            {totalHabitsCount > 0 && (
              <div className="quest-dashboard animate-fade-in">
                <div className="quest-header-row">
                  <span className="quest-label">🏆 Daily Quest Progress</span>
                  <span className="quest-percentage">{completionPercentage}% Completed</span>
                </div>
                <div className="progress-bar-bg quest-progress-bar">
                  <div 
                    className={`progress-bar-fill ${completionPercentage === 100 ? 'success' : 'violet'}`}
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <div className="quest-summary">
                  {completionPercentage === 100 ? (
                    <span className="quest-completed-msg">🌟 Quest Complete! You've successfully forged today's habits! (+XP rewarded)</span>
                  ) : (
                    <span className="quest-pending-msg">Completed {completedHabitsCount} of {totalHabitsCount} habits for this day. Keep moving forward!</span>
                  )}
                </div>
              </div>
            )}

            {/* Habit Progress Cards List (Fase 1) */}
            <div className="card-list">
              {checklist.length === 0 ? (
                <div className="empty-state">
                  <span>🌌</span>
                  <h3>No active habits for this period</h3>
                  <p>Click the <strong>⚙️ Forge & Manage Habits</strong> button in the header to create and activate your first habits!</p>
                </div>
              ) : (
                checklist.map((item) => {
                  const isMini = !!miniHabitsMap[item.id];
                  const currentProgress = item.amount_done || 0;
                  const rawTarget = item.target_snapshot || item.amount;
                  const miniTarget = rawTarget <= 5 ? 1 : Math.round(rawTarget * 0.2);
                  const effectiveTarget = isMini ? miniTarget : rawTarget;
                  const unit = item.unit_snapshot || item.unit;
                  
                  const percentage = Math.min(100, Math.round((currentProgress / effectiveTarget) * 100));
                  const isCompleted = currentProgress >= effectiveTarget || item.progress_state === 'COMPLETED';
                  const isSpring = animatingHabitId === item.id;
                  const isExpanded = expandedLogId === item.id;

                  return (
                    <div 
                      className={`habit-row-card ${isCompleted ? 'completed' : ''} ${isMini ? 'mini-mode' : ''} ${isSpring ? 'spring-bump' : ''}`}
                      key={item.id}
                      onDoubleClick={() => handleLogProgress(item.id, isCompleted ? 0 : effectiveTarget)}
                      title="Doble clic para completar/reiniciar al 100%"
                    >
                      {/* Fluid Gradient Progress Fill extending behind content */}
                      <div 
                        className="card-progress-bar-fill"
                        style={{ width: `${percentage}%` }}
                      ></div>

                      {/* Top Row: Mini Toggle, Habit Info, Level/XP */}
                      <div className="habit-row-top">
                        <div className="habit-title-group">
                          {/* Mini Version 1-Tap Toggle Icon Button (⚡) */}
                          <button
                            type="button"
                            className={`btn-mini-toggle ${isMini ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMiniMode(item.id);
                            }}
                            title={isMini ? "Desactivar Versión Mini (Restaurar Meta Normal)" : "Activar Versión Mini (Modo Rápido ⚡)"}
                          >
                            ⚡
                          </button>

                          {/* Habit Name & Goal Target */}
                          <div className="habit-name-wrapper">
                            <span className="habit-row-name">
                              {item.name}
                              {isMini && <span className="mini-badge">MINI</span>}
                              {isCompleted && <span className="completed-star"> ✨</span>}
                            </span>
                            <span className="habit-row-target">
                              Meta: {effectiveTarget} {unit} {isMini && <span className="mini-target-note">(Original: {rawTarget})</span>}
                            </span>
                          </div>
                        </div>

                        {/* Level / XP metrics */}
                        <div className="habit-row-level">
                          <span className="level-pill">Lv.{item.level}</span>
                          <span className="xp-pill">{item.current_xp} XP</span>
                        </div>
                      </div>

                      {/* Bottom Controls Row: Checkbox, Counter, Quick Volume Buttons */}
                      <div className="habit-row-bottom">
                        {/* Checkbox button + "Completar" Label */}
                        <button 
                          className={`habit-check-btn-wrapper ${isCompleted ? 'checked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLogProgress(item.id, isCompleted ? 0 : effectiveTarget);
                          }}
                          title={isCompleted ? "Reiniciar progreso" : "Marcar como completado (100%)"}
                        >
                          <div className={`habit-check-btn ${isCompleted ? 'checked' : ''}`}>
                            {isCompleted ? '✓' : ''}
                          </div>
                          <span className="check-btn-text">{isCompleted ? 'Completado' : 'Completar'}</span>
                        </button>

                        {/* Progress Count Badge (Toggle Smart Input) */}
                        <div 
                          className="progress-counter-badge"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSmartInput(item.id);
                          }}
                          title="Haz clic para editar la cifra exacta"
                        >
                          <span className="counter-numbers">{currentProgress} / {effectiveTarget}</span>
                          <span className="edit-icon-sm">✏️</span>
                        </div>

                        {/* Quick Action Volume Buttons */}
                        <div className="quick-volume-actions" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="btn-quick-vol"
                            onClick={() => handleQuickIncrement(item, 1)}
                            title="Añadir +1"
                          >
                            +1
                          </button>
                          {rawTarget >= 5 && (
                            <button 
                              className="btn-quick-vol btn-quick-vol-lg"
                              onClick={() => handleQuickIncrement(item, rawTarget >= 50 ? 10 : 5)}
                              title={`Añadir +${rawTarget >= 50 ? 10 : 5}`}
                            >
                              +{rawTarget >= 50 ? 10 : 5}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Smart Log Input Drawer (Expandable) */}
                      {isExpanded && (
                        <div className="smart-log-drawer" onClick={(e) => e.stopPropagation()}>
                          <form 
                            className="smart-log-form"
                            onSubmit={(e) => {
                              e.preventDefault();
                              const val = parseFloat(customLogAmounts[item.id]);
                              if (!isNaN(val) && val >= 0) {
                                handleLogProgress(item.id, val);
                                setExpandedLogId(null);
                              } else {
                                showNotification('Por favor introduce un número válido', true);
                              }
                            }}
                          >
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Introducir cantidad exacta:</span>
                            <input 
                              type="number"
                              step="any"
                              min="0"
                              autoFocus
                              placeholder={currentProgress.toString()}
                              className="smart-log-input"
                              value={customLogAmounts[item.id] !== undefined ? customLogAmounts[item.id] : ''}
                              onChange={(e) => setCustomLogAmounts({ ...customLogAmounts, [item.id]: e.target.value })}
                            />
                            <button type="submit" className="btn btn-primary btn-sm">Guardar</button>
                          </form>

                          {item.amount_done !== null && (
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                handleDeleteLog(item.id);
                                setExpandedLogId(null);
                              }}
                              title="Reiniciar a 0"
                            >
                              Reset ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        ) : (
          /* TAB 2: HISTORY & ANALYTICS (Charts view) */
          <section className="panel checklist-panel animate-fade-in">
            <h2>📊 History & Analytics</h2>
            
            {loadingHistory ? (
              <div className="empty-state" style={{ minHeight: '300px' }}>
                <span>💫</span>
                <h3>Loading analytics data...</h3>
              </div>
            ) : historyChecklists.length === 0 ? (
              <div className="empty-state" style={{ minHeight: '300px' }}>
                <span>🌌</span>
                <h3>No history logs found</h3>
                <p>Log progress on your checklist to start gathering historical insights.</p>
              </div>
            ) : (
              <div className="analytics-content animate-fade-in">
                {/* 1. Analytics Stats Cards */}
                <div className="stats-row">
                  <div className="stat-card">
                    <span className="stat-value">{avgCompletionRate}%</span>
                    <span className="stat-label">Avg Completion Rate</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value" style={{ color: '#c084fc' }}>{perfectDaysCount}</span>
                    <span className="stat-label">Perfect Days (100%)</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value" style={{ color: '#06b6d4', fontSize: '1.2rem' }}>{bestDayName}</span>
                    <span className="stat-label">Best Performance ({bestDayPercentage}%)</span>
                  </div>
                </div>

                {/* 2. Weekly Performance Chart */}
                <div className="analytics-section">
                  <h3 className="section-subtitle">📈 Weekly Completion Rate</h3>
                  <div className="chart-container">
                    {historyChecklists.map((day) => {
                      const count = day.checklist.length;
                      const completed = day.checklist.filter((item) => item.progress_state === 'COMPLETED').length;
                      const pct = count > 0 ? Math.round((completed / count) * 100) : 0;
                      
                      let barColor = 'var(--grad-primary)';
                      if (pct === 100) barColor = 'var(--grad-success)';
                      else if (pct > 0) barColor = 'var(--grad-teal)';

                      return (
                        <div className="chart-column" key={day.date}>
                          <div className="chart-bar-wrapper">
                            <span className="chart-bar-value">{pct}%</span>
                            <div 
                              className="chart-bar-fill" 
                              style={{ 
                                height: `${Math.max(pct, 5)}%`, 
                                background: barColor,
                                opacity: count === 0 ? 0.2 : 1
                              }}
                              title={`${completed}/${count} habits completed`}
                            ></div>
                          </div>
                          <span className="chart-date-label">{formatShortDate(day.date)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Habit Completion Grid (Weekly Matrix) */}
                <div className="analytics-section">
                  <h3 className="section-subtitle">🗓️ Weekly Habit Matrix</h3>
                  
                  {uniqueHabits.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No habits recorded in checklist history.</p>
                  ) : (
                    <div className="matrix-table-container">
                      <table className="matrix-table">
                        <thead>
                          <tr>
                            <th>Habit Name</th>
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
                                <span className="matrix-habit-unit"> (Goal {habit.unit})</span>
                              </td>
                              {past7Days.map((date) => {
                                const dayData = historyChecklists.find((d) => d.date === date);
                                const checklistItem = dayData?.checklist.find((item) => item.id === habit.id);

                                let dotClass = 'none';
                                let titleText = 'No record';

                                if (checklistItem) {
                                  if (checklistItem.progress_state === 'COMPLETED') {
                                    dotClass = 'completed';
                                    titleText = 'Completed (100%)';
                                  } else if (checklistItem.progress_state === 'IN_PROGRESS') {
                                    dotClass = 'in-progress';
                                    titleText = `In Progress (${checklistItem.percentage}%)`;
                                  } else {
                                    dotClass = 'not-logged';
                                    titleText = 'Not logged (0%)';
                                  }
                                }

                                return (
                                  <td key={date} style={{ textAlign: 'center' }}>
                                    <span 
                                      className={`matrix-dot ${dotClass}`} 
                                      title={titleText}
                                    ></span>
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
            )}
          </section>
        )}

        {/* RIGHT COMPONENT: COLLAPSIBLE HABITS FORGE (Management Panel) */}
        {showManager && (
          <section className="panel management-panel animate-slide-in">
            <div className="panel-title-container">
              <h2>🛠️ Habits Forge</h2>
              <button 
                className="btn btn-secondary btn-sm btn-icon-only" 
                onClick={() => setShowManager(false)}
                title="Hide Forge"
              >
                ✕
              </button>
            </div>

            {/* Form to create/edit a habit */}
            {editingHabit ? (
              <form className="creation-form" onSubmit={handleUpdateHabit}>
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  ✏️ Edit Habit: <span style={{ color: '#22d3ee' }}>{editingHabit.name}</span>
                </h3>
                
                <div className="form-group">
                  <label>Habit Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={50}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Daily Goal</label>
                    <input 
                      type="number" 
                      step="any"
                      min="0.001"
                      className="form-control" 
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      placeholder="e.g., cups, mins"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select 
                    className="form-control" 
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingHabit(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <form className="creation-form" onSubmit={handleCreateHabit}>
                <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  ✨ Create New Habit
                </h3>
                
                <div className="form-group">
                  <label>Habit Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Read Books, Drink Water" 
                    className="form-control" 
                    value={habitName}
                    onChange={(e) => setHabitName(e.target.value)}
                    maxLength={50}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Daily Goal</label>
                    <input 
                      type="number" 
                      step="any"
                      min="0.001"
                      placeholder="1.0" 
                      className="form-control" 
                      value={habitAmount}
                      onChange={(e) => setHabitAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit</label>
                    <input 
                      type="text" 
                      placeholder="e.g., chapters, glass, check" 
                      className="form-control" 
                      value={habitUnit}
                      onChange={(e) => setHabitUnit(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Forging Habit</button>
              </form>
            )}

            {/* Filtering tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter list</span>
              <div className="filter-tabs">
                {['ALL', 'ACTIVE', 'PAUSED', 'ARCHIVED'].map((filter) => (
                  <button 
                    key={filter} 
                    className={`filter-tab ${statusFilter === filter ? 'active' : ''}`}
                    onClick={() => setStatusFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* List of habits for management */}
            <div className="card-list" style={{ maxHeight: '350px' }}>
              {filteredHabits.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <p>No habits found matching filter "{statusFilter}"</p>
                </div>
              ) : (
                filteredHabits.map((habit) => (
                  <div className={`habit-card ${habit.status.toLowerCase()}`} key={habit.id}>
                    <div className="habit-header">
                      <div className="habit-info-main">
                        <span className="habit-name">{habit.name}</span>
                        <span className="habit-target">
                          Goal: {habit.amount} {habit.unit}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        <span className={`badge ${habit.status.toLowerCase()}`}>{habit.status}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a855f7' }}>Level {habit.level} ({habit.current_xp} XP)</span>
                      </div>
                    </div>

                    <div className="habit-actions-row">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEditClick(habit)}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        ✏️ Edit
                      </button>

                      {habit.status === 'ACTIVE' && (
                        <button 
                          className="btn btn-warning btn-sm"
                          onClick={() => handleToggleStatus(habit, 'PAUSED')}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          ⏸️ Pause
                        </button>
                      )}

                      {habit.status === 'PAUSED' && (
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleToggleStatus(habit, 'ACTIVE')}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          ▶️ Activate
                        </button>
                      )}

                      {habit.status !== 'ARCHIVED' && (
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleToggleStatus(habit, 'ARCHIVED')}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          📦 Archive
                        </button>
                      )}

                      {habit.status === 'ARCHIVED' && (
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleToggleStatus(habit, 'ACTIVE')}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          ♻️ Unarchive
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
