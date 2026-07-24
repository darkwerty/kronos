const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Helper genérico para realizar peticiones HTTP a la API REST de Kronos
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('kronos_token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = `Error (${response.status}): ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        errorMessage =
          typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      // Ignorar si el cuerpo de respuesta no es JSON
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return await response.json();
}

export const api = {
  // --- Autenticación & Usuarios ---
  getAuthConfig: () => request('/auth/config'),
  loginWithGoogle: (idToken) =>
    request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
    }),
  loginWithGithub: (code) =>
    request('/auth/github', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  getCurrentUser: () => request('/auth/me'),
  syncGuestHabits: (habitIds) =>
    request('/auth/sync-guest-habits', {
      method: 'POST',
      body: JSON.stringify({ habit_ids: habitIds }),
    }),

  // --- Categorías ---
  getCategories: () => request('/categories'),
  createCategory: (categoryData) =>
    request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    }),
  getCategoryAnalytics: () => request('/categories/analytics'),

  // --- Hábitos ---
  getHabits: () => request('/habits'),
  getChecklist: (targetDate, includeUnscheduled = true) =>
    request(
      `/habits/checklist?target_date=${encodeURIComponent(targetDate)}&include_unscheduled=${includeUnscheduled}`
    ),
  createHabit: (habitData) =>
    request('/habits', {
      method: 'POST',
      body: JSON.stringify(habitData),
    }),
  updateHabit: (habitId, habitData) =>
    request(`/habits/${habitId}`, {
      method: 'PATCH',
      body: JSON.stringify(habitData),
    }),
  archiveHabit: (habitId) =>
    request(`/habits/${habitId}/archive`, {
      method: 'PATCH',
    }),

  // --- Logs de Progreso ---
  logHabitProgress: (habitId, loggedDate, amountDone) =>
    request(`/habits/${habitId}/logs`, {
      method: 'POST',
      body: JSON.stringify({ logged_date: loggedDate, amount_done: amountDone }),
    }),
  deleteHabitLog: (habitId, loggedDate) =>
    request(`/habits/${habitId}/logs/${encodeURIComponent(loggedDate)}`, {
      method: 'DELETE',
    }),
};

export default api;
