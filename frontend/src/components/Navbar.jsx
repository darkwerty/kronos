import React, { useState } from 'react';
import { ShieldCheck, Calendar, BarChart3, Wrench, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab, onOpenForge, onOpenAuthModal }) {
  const { user, isGuest, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="dashboard-header">
      <div className="brand">
        <div className="brand-logo">
          <ShieldCheck size={28} className="text-cyan-400" />
        </div>
        <div className="brand-titles">
          <h1>KRONOS</h1>
          <span className="brand-subtitle">Habit Forge v0.4.0</span>
        </div>
      </div>

      <div className="nav-actions">
        {/* Main Tab Switcher */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'TRACKER' ? 'active' : ''}`}
            onClick={() => setActiveTab('TRACKER')}
          >
            <Calendar size={16} /> Daily Tracker
          </button>
          <button
            className={`tab-btn ${activeTab === 'HISTORY' ? 'active' : ''}`}
            onClick={() => setActiveTab('HISTORY')}
          >
            <BarChart3 size={16} /> History & Analytics
          </button>
        </div>

        {/* Forge & Manage Habits Drawer Trigger Button */}
        <button className="btn btn-primary" onClick={onOpenForge} id="btn-toggle-manager">
          <Wrench size={16} /> Habits Forge
        </button>

        {/* User Auth Profile / Login Button */}
        {isGuest ? (
          <button
            className="btn btn-secondary"
            onClick={onOpenAuthModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderColor: 'var(--accent-cyan)',
              color: 'var(--accent-cyan)',
            }}
          >
            <LogIn size={16} /> Iniciar Sesión
          </button>
        ) : (
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.4rem 0.9rem',
                borderRadius: '20px',
                border: '1px solid #10b981',
                background: 'rgba(16, 185, 129, 0.1)',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.2)',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              ></span>
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || 'User'}
                  style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                />
              ) : (
                <UserIcon size={18} style={{ color: '#10b981' }} />
              )}
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f3f4f6' }}>
                {user?.name ? user.name.split(' ')[0] : 'Mi Cuenta'}
              </span>
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '115%',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '0.75rem 0',
                  minWidth: '220px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                  zIndex: 100,
                }}
              >
                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user?.name || 'Usuario Authenticado'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email}
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: '0.4rem',
                      padding: '0.15rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      borderRadius: '10px',
                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                      color: '#818cf8',
                      textTransform: 'uppercase',
                    }}
                  >
                    Proveedor: {user?.provider || 'JWT'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.7rem 1rem',
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    textAlign: 'left',
                  }}
                >
                  <LogOut size={16} /> Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
