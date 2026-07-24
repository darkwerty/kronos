import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('kronos_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const userData = await api.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Error al cargar sesión:', err);
        // Token invalido o expirado
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const loginWithGoogle = async (idToken) => {
    const data = await api.loginWithGoogle(idToken);
    localStorage.setItem('kronos_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const loginWithGithub = async (code) => {
    const data = await api.loginWithGithub(code);
    localStorage.setItem('kronos_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('kronos_token');
    setToken(null);
    setUser(null);
  };

  const syncGuestHabits = async (habitIds) => {
    return await api.syncGuestHabits(habitIds);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isGuest: !user,
        loginWithGoogle,
        loginWithGithub,
        logout,
        syncGuestHabits,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
