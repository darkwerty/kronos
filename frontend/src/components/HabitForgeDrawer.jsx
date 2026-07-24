import React, { useState } from 'react';
import { X, Plus, Edit2, Pause, Play, Archive, RefreshCw, Wrench, Shield, Filter, FolderPlus, Calendar } from 'lucide-react';
import CategoryIcon, { AVAILABLE_CATEGORY_COLORS, AVAILABLE_CATEGORY_ICONS } from './CategoryIcon';

const WEEK_DAYS = [
  { id: '1', short: 'L', name: 'Lunes' },
  { id: '2', short: 'M', name: 'Martes' },
  { id: '3', short: 'X', name: 'Miércoles' },
  { id: '4', short: 'J', name: 'Jueves' },
  { id: '5', short: 'V', name: 'Viernes' },
  { id: '6', short: 'S', name: 'Sábado' },
  { id: '7', short: 'D', name: 'Domingo' },
];

export function formatTargetDaysLabel(targetDaysStr) {
  if (!targetDaysStr) return 'Todos los días';
  const days = targetDaysStr.split(',').map((d) => d.trim()).filter(Boolean);
  if (days.length === 7) return 'Todos los días';
  if (days.length === 5 && !days.includes('6') && !days.includes('7')) return 'Días laborables (L-V)';
  if (days.length === 2 && days.includes('6') && days.includes('7')) return 'Fines de semana (S-D)';
  if (days.length === 0) return 'Sin días seleccionados';

  const shortNames = { '1': 'L', '2': 'M', '3': 'X', '4': 'J', '5': 'V', '6': 'S', '7': 'D' };
  return days.map((d) => shortNames[d] || d).join(', ');
}

export default function HabitForgeDrawer({
  isOpen,
  onClose,
  habits,
  categories = [],
  onCreateHabit,
  onUpdateHabit,
  onToggleStatus,
  onCreateCategory,
}) {
  const [editingHabit, setEditingHabit] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form states
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('1.0');
  const [unit, setUnit] = useState('check');
  const [categoryId, setCategoryId] = useState('');
  const [targetDays, setTargetDays] = useState(['1', '2', '3', '4', '5', '6', '7']);

  // Edit form states
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editTargetDays, setEditTargetDays] = useState(['1', '2', '3', '4', '5', '6', '7']);

  // New Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [newCatIcon, setNewCatIcon] = useState('Tag');

  if (!isOpen) return null;

  const toggleDayCreate = (dayId) => {
    setTargetDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort()
    );
  };

  const toggleDayEdit = (dayId) => {
    setEditTargetDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort()
    );
  };

  const handleStartEdit = (habit) => {
    setEditingHabit(habit);
    setEditName(habit.name);
    setEditAmount(habit.amount.toString());
    setEditUnit(habit.unit);
    setEditStatus(habit.status);
    setEditCategoryId(habit.category_id ? habit.category_id.toString() : '');
    setEditTargetDays(
      habit.target_days ? habit.target_days.split(',') : ['1', '2', '3', '4', '5', '6', '7']
    );
  };

  const handleCancelEdit = () => {
    setEditingHabit(null);
  };

  const handleFormCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const catIdNum = categoryId ? parseInt(categoryId, 10) : undefined;
    onCreateHabit({
      name: name.trim(),
      amount: parseFloat(amount) || 1,
      unit: unit.trim() || 'check',
      category_id: catIdNum,
      target_days: targetDays.join(','),
    });
    setName('');
    setAmount('1.0');
    setUnit('check');
    setCategoryId('');
    setTargetDays(['1', '2', '3', '4', '5', '6', '7']);
  };

  const handleFormUpdate = (e) => {
    e.preventDefault();
    if (!editName.trim() || !editingHabit) return;
    const catIdNum = editCategoryId ? parseInt(editCategoryId, 10) : undefined;
    onUpdateHabit(editingHabit.id, {
      name: editName.trim(),
      amount: parseFloat(editAmount) || 1,
      unit: editUnit.trim(),
      status: editStatus,
      category_id: catIdNum,
      target_days: editTargetDays.join(','),
    });
    setEditingHabit(null);
  };

  const handleCreateCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const created = await onCreateCategory({
      name: newCatName.trim(),
      color: newCatColor,
      icon: newCatIcon,
    });
    if (created) {
      setCategoryId(created.id.toString());
      setNewCatName('');
      setShowCategoryForm(false);
    }
  };

  const filteredHabits = habits.filter((h) => {
    if (statusFilter === 'ALL') return true;
    return h.status === statusFilter;
  });

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title">
            <Wrench size={20} className="text-cyan-400" />
            <h2>Habits Forge & Gestor</h2>
          </div>
          <button className="btn-icon" onClick={onClose} title="Cerrar Gestor">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Create Category Modal / Inline Box */}
          {showCategoryForm && (
            <form onSubmit={handleCreateCategorySubmit} className="drawer-form category-form animate-fade-in">
              <div className="flex-between">
                <h3>
                  <FolderPlus size={16} /> Crear Nueva Categoría
                </h3>
                <button type="button" className="btn-icon" onClick={() => setShowCategoryForm(false)}>
                  <X size={16} />
                </button>
              </div>

              <div className="form-group">
                <label>Nombre de la Categoría</label>
                <input
                  type="text"
                  placeholder="ej. Creatividad, Deporte"
                  className="form-control"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>

              <div className="form-group">
                <label>Color</label>
                <div className="color-picker-grid">
                  {AVAILABLE_CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-swatch ${newCatColor === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setNewCatColor(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Icono</label>
                <div className="icon-picker-grid">
                  {AVAILABLE_CATEGORY_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      className={`icon-swatch ${newCatIcon === iconName ? 'active' : ''}`}
                      onClick={() => setNewCatIcon(iconName)}
                    >
                      <CategoryIcon name={iconName} size={16} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Categoría
                </button>
              </div>
            </form>
          )}

          {/* Creation or Edition Form */}
          {editingHabit ? (
            <form onSubmit={handleFormUpdate} className="drawer-form edit-mode">
              <h3>
                <Edit2 size={16} /> Editando: <span className="highlight">{editingHabit.name}</span>
              </h3>

              <div className="form-group">
                <label>Nombre del hábito</label>
                <input
                  type="text"
                  className="form-control"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Meta diaria</label>
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
                  <label>Unidad</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Categoría</label>
                <div className="visual-category-selector">
                  {categories.map((cat) => {
                    const isSelected = editCategoryId === cat.id.toString();
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`category-pill-choice ${isSelected ? 'selected' : ''}`}
                        style={{
                          '--cat-color': cat.color,
                        }}
                        onClick={() => setEditCategoryId(cat.id.toString())}
                      >
                        <CategoryIcon name={cat.icon} size={12} style={{ color: isSelected ? '#ffffff' : cat.color }} />
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Google Alarm Style Day Selector (Edit Form) */}
              <div className="form-group">
                <div className="flex-between mb-1">
                  <label className="flex-align-gap">
                    <Calendar size={13} className="text-cyan-400" /> Días programados
                  </label>
                  <span className="scheduler-summary-badge">
                    {formatTargetDaysLabel(editTargetDays.join(','))}
                  </span>
                </div>
                <div className="google-alarm-day-picker">
                  {WEEK_DAYS.map((d) => {
                    const isSelected = editTargetDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        className={`alarm-day-circle ${isSelected ? 'active' : ''}`}
                        onClick={() => toggleDayEdit(d.id)}
                        title={d.name}
                      >
                        {d.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>Estado del hábito</label>
                <select
                  className="form-control"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="ACTIVE">ACTIVE (Activo en tracker)</option>
                  <option value="PAUSED">PAUSED (Pausado sin borrar XP)</option>
                  <option value="ARCHIVED">ARCHIVED (Archivado)</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleFormCreate} className="drawer-form">
              <h3>
                <Plus size={16} /> Forjar Nuevo Hábito
              </h3>

              <div className="form-group">
                <label>Nombre del hábito</label>
                <input
                  type="text"
                  placeholder="ej. Hacer flexiones, Leer libro"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Meta diaria</label>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    placeholder="1.0"
                    className="form-control"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Unidad</label>
                  <input
                    type="text"
                    placeholder="ej. Reps, mins, check"
                    className="form-control"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="flex-between">
                  <label>Categoría</label>
                  <button
                    type="button"
                    className="btn-text-link"
                    onClick={() => setShowCategoryForm(!showCategoryForm)}
                  >
                    + Nueva Categoría
                  </button>
                </div>
                <div className="visual-category-selector">
                  {categories.map((cat) => {
                    const isSelected = categoryId === cat.id.toString();
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`category-pill-choice ${isSelected ? 'selected' : ''}`}
                        style={{
                          '--cat-color': cat.color,
                        }}
                        onClick={() => setCategoryId(cat.id.toString())}
                      >
                        <CategoryIcon name={cat.icon} size={12} style={{ color: isSelected ? '#ffffff' : cat.color }} />
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Google Alarm Style Day Selector (Create Form) */}
              <div className="form-group">
                <div className="flex-between mb-1">
                  <label className="flex-align-gap">
                    <Calendar size={13} className="text-cyan-400" /> Días programados
                  </label>
                  <span className="scheduler-summary-badge">
                    {formatTargetDaysLabel(targetDays.join(','))}
                  </span>
                </div>
                <div className="google-alarm-day-picker">
                  {WEEK_DAYS.map((d) => {
                    const isSelected = targetDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        className={`alarm-day-circle ${isSelected ? 'active' : ''}`}
                        onClick={() => toggleDayCreate(d.id)}
                        title={d.name}
                      >
                        {d.short}
                      </button>
                    );
                  })}
                </div>
              </div>

            </form>
          )}

          {/* Filter Bar */}
          <div className="drawer-filter-bar">
            <span className="filter-label">
              <Filter size={14} /> Filtro:
            </span>
            <div className="filter-pills">
              {['ALL', 'ACTIVE', 'PAUSED', 'ARCHIVED'].map((f) => (
                <button
                  key={f}
                  className={`filter-pill ${statusFilter === f ? 'active' : ''}`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Habits Management List */}
          <div className="drawer-habit-list">
            {filteredHabits.length === 0 ? (
              <div className="empty-state-sm">Sin hábitos en filtro "{statusFilter}"</div>
            ) : (
              filteredHabits.map((habit) => (
                <div className={`drawer-habit-card ${habit.status.toLowerCase()}`} key={habit.id}>
                  <div className="drawer-habit-main">
                    <div className="drawer-habit-info">
                      <div className="flex-align-gap">
                        {habit.category && (
                          <span
                            className="category-pill-sm"
                            style={{
                              backgroundColor: `${habit.category.color}22`,
                              color: habit.category.color,
                            }}
                          >
                            <CategoryIcon name={habit.category.icon} size={11} />
                            {habit.category.name}
                          </span>
                        )}
                        <span className="habit-name">{habit.name}</span>
                      </div>
                      <span className="habit-target">
                        Meta: {habit.amount} {habit.unit} · <Calendar size={11} className="inline-icon" /> {formatTargetDaysLabel(habit.target_days)}
                      </span>
                    </div>


                    <div className="drawer-habit-meta">
                      <span className={`badge ${habit.status.toLowerCase()}`}>{habit.status}</span>
                      <span className="rank-text">
                        {habit.rank_title || 'Novato 🥉'} · Lv.{habit.level} ({habit.current_xp} XP)
                      </span>
                    </div>
                  </div>

                  <div className="drawer-habit-actions">
                    <button
                      className="btn btn-secondary-sm"
                      onClick={() => handleStartEdit(habit)}
                      title="Editar"
                    >
                      <Edit2 size={13} /> Editar
                    </button>

                    {habit.status === 'ACTIVE' && (
                      <button
                        className="btn btn-warning-sm"
                        onClick={() => onToggleStatus(habit, 'PAUSED')}
                        title="Pausar"
                      >
                        <Pause size={13} /> Pausar
                      </button>
                    )}

                    {habit.status === 'PAUSED' && (
                      <button
                        className="btn btn-success-sm"
                        onClick={() => onToggleStatus(habit, 'ACTIVE')}
                        title="Activar"
                      >
                        <Play size={13} /> Activar
                      </button>
                    )}

                    {habit.status !== 'ARCHIVED' ? (
                      <button
                        className="btn btn-danger-sm"
                        onClick={() => onToggleStatus(habit, 'ARCHIVED')}
                        title="Archivar"
                      >
                        <Archive size={13} /> Archivar
                      </button>
                    ) : (
                      <button
                        className="btn btn-success-sm"
                        onClick={() => onToggleStatus(habit, 'ACTIVE')}
                        title="Restaurar"
                      >
                        <RefreshCw size={13} /> Restaurar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

