import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import NeonConfetti from './NeonConfetti';

import Navbar from './components/Navbar';
import ToastContainer from './components/ToastContainer';
import WeekCalendar from './components/WeekCalendar';
import HabitCard from './components/HabitCard';
import HabitForgeDrawer from './components/HabitForgeDrawer';
import SmartLogModal from './components/SmartLogModal';
import AnalyticsView from './components/AnalyticsView';
import CategoryIcon from './components/CategoryIcon';
import AuthModal from './components/AuthModal';
import SyncGuestModal from './components/SyncGuestModal';
import { useAuth } from './context/AuthContext';
import api from './services/api';

function App() {
  const { user, isGuest } = useAuth();
  const [habits, setHabits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [checklist, setChecklist] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - offset * 60 * 1000);
    return localToday.toISOString().split('T')[0];
  });

  const [activeTab, setActiveTab] = useState('TRACKER'); // 'TRACKER' | 'HISTORY'
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [guestHabitsToSync, setGuestHabitsToSync] = useState([]);


  // Smart Log Modal state
  const [activeLogModalItem, setActiveLogModalItem] = useState(null);

  // Micro-interactions
  const [confettiTrigger, setConfettiTrigger] = useState(null);
  const [weekCompletionMap, setWeekCompletionMap] = useState({});
  const [miniHabitsMap, setMiniHabitsMap] = useState({});
  const prevCompletionPctRef = useRef(0);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  // Analytics history
  const [historyChecklists, setHistoryChecklists] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleMiniMode = (habitId) => {
    setMiniHabitsMap((prev) => ({
      ...prev,
      [habitId]: !prev[habitId],
    }));
  };

  // Fetch habits and categories when user changes or on mount
  useEffect(() => {
    fetchHabits();
    fetchCategories();
  }, [user]);

  // Fetch checklist on date change or user change
  useEffect(() => {
    fetchChecklist();
  }, [selectedDate, user]);

  // Process GitHub OAuth redirect callback if present in URL
  const { loginWithGithub } = useAuth();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      loginWithGithub(code)
        .then(() => {
          showToast('¡Sesión iniciada con GitHub!');
          handleLoginSuccess();
        })
        .catch((err) => {
          showToast(err.message, 'error');
        });
    }
  }, []);

  const handleLoginSuccess = async () => {
    // If there were habits in the guest checklist prior to login, prompt to sync
    if (checklist && checklist.length > 0) {
      setGuestHabitsToSync(checklist.map((h) => h.id));
      setIsSyncModalOpen(true);
    }
    fetchHabits();
    fetchCategories();
    fetchChecklist();
  };

  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const fetchHabits = async () => {
    try {
      const data = await api.getHabits();
      setHabits(data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const [showUnscheduled, setShowUnscheduled] = useState(false);

  const fetchChecklist = async () => {
    try {
      const data = await api.getChecklist(selectedDate, showUnscheduled);
      setChecklist(data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  useEffect(() => {
    fetchChecklist();
  }, [selectedDate, showUnscheduled]);


  const handleCreateCategory = async (catData) => {
    try {
      const data = await api.createCategory(catData);
      showToast(`Categoría creada: ${data.name}`);
      fetchCategories();
      return data;
    } catch (err) {
      showToast(err.message, 'error');
      return null;
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
      const requests = dates.map(async (d) => {
        const data = await api.getChecklist(d, true);
        return { date: d, checklist: data };
      });
      const results = await Promise.all(requests);
      setHistoryChecklists(results);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreateHabit = async (habitData) => {
    try {
      const data = await api.createHabit(habitData);
      showToast(`Hábito creado: ${data.name}`);
      fetchHabits();
      fetchChecklist();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateHabit = async (habitId, updateData) => {
    try {
      const data = await api.updateHabit(habitId, updateData);
      showToast(`Hábito actualizado: ${data.name}`);
      fetchHabits();
      fetchChecklist();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleStatus = async (habit, newStatus) => {
    try {
      const data = await api.updateHabit(habit.id, { status: newStatus });
      showToast(`Hábito "${data.name}" pasa a ${newStatus}`);
      fetchHabits();
      fetchChecklist();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleLogProgress = async (habitId, amount) => {
    try {
      await api.logHabitProgress(habitId, selectedDate, amount);
      showToast('¡Progreso registrado correctamente!');
      fetchChecklist();
      fetchHabits();
      fetchWeekCompletionData(weekDays);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteLog = async (habitId) => {
    try {
      await api.deleteHabitLog(habitId, selectedDate);
      showToast('¡Progreso reiniciado!');
      fetchChecklist();
      fetchHabits();
      fetchWeekCompletionData(weekDays);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleQuickIncrement = (item, delta) => {
    const current = item.amount_done || 0;
    const newAmount = Math.max(0, current + delta);
    handleLogProgress(item.id, newAmount);
  };

  // Week days calculation
  const getWeekDays = (referenceDateStr) => {
    const parts = referenceDateStr.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const ref = new Date(y, m, d);

    const dayOfWeek = ref.getDay();
    const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek;
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
        api.getChecklist(d.date).catch(() => [])
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
      console.error('Error al obtener datos semanales:', err);
    }
  };

  useEffect(() => {
    fetchWeekCompletionData(weekDays);
  }, [selectedDate, habits]);

  const handlePrevWeek = () => {
    const parts = selectedDate.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10) - 7);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const parts = selectedDate.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10) + 7);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - offset * 60 * 1000);
    setSelectedDate(localToday.toISOString().split('T')[0]);
  };

  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatShortDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
  };

  const filteredChecklist = checklist.filter((item) => {
    if (selectedCategoryFilter === 'ALL') return true;
    return item.category_id === parseInt(selectedCategoryFilter, 10);
  });

  const scheduledChecklist = checklist.filter((item) => item.is_scheduled !== false);
  const totalHabitsCount = scheduledChecklist.length;
  const completedHabitsCount = scheduledChecklist.filter((item) => item.progress_state === 'COMPLETED').length;
  const completionPercentage = totalHabitsCount > 0 ? Math.round((completedHabitsCount / totalHabitsCount) * 100) : 0;
  const unscheduledBonusCount = checklist.filter((item) => !item.is_scheduled && item.progress_state === 'COMPLETED').length;

  // Trigger confetti explosion on 100% daily quest completion
  useEffect(() => {
    if (totalHabitsCount > 0 && completionPercentage === 100 && prevCompletionPctRef.current < 100) {
      setConfettiTrigger(Date.now());
    }
    prevCompletionPctRef.current = completionPercentage;
  }, [completionPercentage, totalHabitsCount]);


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

  return (
    <div className="dashboard">
      <NeonConfetti trigger={confettiTrigger} />
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenForge={() => setIsForgeOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Auth Modal for Google & GitHub Login */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
        showToast={showToast}
      />

      {/* Sync Guest Habits Modal */}
      <SyncGuestModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        habitIds={guestHabitsToSync}
        onSyncSuccess={() => {
          fetchHabits();
          fetchChecklist();
        }}
        showToast={showToast}
      />

      {/* Offcanvas Drawer for Habit Management */}
      <HabitForgeDrawer
        isOpen={isForgeOpen}
        onClose={() => setIsForgeOpen(false)}
        habits={habits}
        categories={categories}
        onCreateHabit={handleCreateHabit}
        onUpdateHabit={handleUpdateHabit}
        onToggleStatus={handleToggleStatus}
        onCreateCategory={handleCreateCategory}
      />

      {/* Smart Log Modal */}
      <SmartLogModal
        isOpen={!!activeLogModalItem}
        item={activeLogModalItem}
        onClose={() => setActiveLogModalItem(null)}
        onSave={handleLogProgress}
        onDelete={handleDeleteLog}
      />

      {/* Main Panel Content */}
      <main className="dashboard-grid">
        {activeTab === 'TRACKER' ? (
          <section className="panel checklist-panel animate-fade-in">
            {/* Week Calendar Component */}
            <WeekCalendar
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              weekDays={weekDays}
              weekCompletionMap={weekCompletionMap}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
              onSetToday={handleSetToday}
            />

            {/* Daily Quest Gamified Banner */}
            {totalHabitsCount > 0 && (
              <div className="quest-dashboard animate-fade-in">
                <div className="quest-header-row">
                  <span className="quest-label">🏆 Misión Diaria</span>
                  <span className="quest-percentage">{completionPercentage}% Completado</span>
                </div>
                <div className="progress-bar-bg quest-progress-bar">
                  <div
                    className={`progress-bar-fill ${completionPercentage === 100 ? 'success' : 'violet'}`}
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <div className="quest-summary">
                  {completionPercentage === 100 ? (
                    <span className="quest-completed-msg">🌟 ¡Misión Diaria Cumplida! Has forjado todos tus hábitos de hoy (+XP Recompensada)</span>
                  ) : (
                    <span className="quest-pending-msg">Completados {completedHabitsCount} de {totalHabitsCount} hábitos para este día. ¡Mantén la racha!</span>
                  )}
                </div>
              </div>
            )}

            {/* Category Chips & Unscheduled Toggle Bar */}
            <div className="category-filter-row">
              {categories.length > 0 && (
                <div className="category-filter-chips-wrapper flex-1 mb-0">
                  <div className="category-chips-scroll">
                    <button
                      type="button"
                      className={`category-chip ${selectedCategoryFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => setSelectedCategoryFilter('ALL')}
                    >
                      <span className="chip-icon-badge">✨</span>
                      <span>Todas</span>
                      <span className="chip-count">{checklist.length}</span>
                    </button>
                    {categories.map((cat) => {
                      const countInCat = checklist.filter((item) => item.category_id === cat.id).length;
                      const isSelected = selectedCategoryFilter === cat.id.toString();
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className={`category-chip ${isSelected ? 'active' : ''}`}
                          style={{
                            '--chip-color': cat.color,
                          }}
                          onClick={() => setSelectedCategoryFilter(cat.id.toString())}
                        >
                          <span
                            className="chip-icon-badge"
                            style={{
                              backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${cat.color}25`,
                              color: isSelected ? '#ffffff' : cat.color,
                            }}
                          >
                            <CategoryIcon name={cat.icon} size={13} />
                          </span>
                          <span>{cat.name}</span>
                          <span className="chip-count">{countInCat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="button"
                className={`btn-unscheduled-toggle ${showUnscheduled ? 'active' : ''}`}
                onClick={() => setShowUnscheduled(!showUnscheduled)}
                title={showUnscheduled ? 'Ocultar hábitos no agendados hoy' : 'Ver hábitos no agendados hoy para ganar Bonus XP'}
              >
                <span>🌟</span>
                <span>{showUnscheduled ? 'Ocultar no agendados' : '+ Hábitos no agendados'}</span>
              </button>
            </div>


            {/* Habit Cards List */}
            <div className="card-list">
              {filteredChecklist.length === 0 ? (
                <div className="empty-state">
                  <span>🌌</span>
                  <h3>No hay hábitos para mostrar</h3>
                  <p>
                    {selectedCategoryFilter !== 'ALL'
                      ? 'No tienes hábitos asociados a esta categoría.'
                      : 'Haz clic en el botón 🛠️ Habits Forge en el menú superior para forjar tu primer hábito.'}
                  </p>
                </div>
              ) : (
                filteredChecklist.map((item) => (
                  <HabitCard
                    key={item.id}
                    item={item}
                    isMini={!!miniHabitsMap[item.id]}
                    onToggleMini={toggleMiniMode}
                    onLogProgress={handleLogProgress}
                    onQuickIncrement={handleQuickIncrement}
                    onOpenSmartModal={(itm) => setActiveLogModalItem(itm)}
                  />
                ))
              )}
            </div>
          </section>
        ) : (
          <section className="panel checklist-panel animate-fade-in">
            <h2>📊 Historial y Analíticas</h2>
            <AnalyticsView
              historyChecklists={historyChecklists}
              loadingHistory={loadingHistory}
              past7Days={past7Days}
              uniqueHabits={uniqueHabits}
              formatShortDate={formatShortDate}
              formatDisplayDate={formatDisplayDate}
            />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;

