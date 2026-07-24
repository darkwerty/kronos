import React, { useState, useEffect, useRef } from 'react';
import { X, LogIn, Sparkles, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onSuccess, showToast }) {
  const { loginWithGoogle, loginWithGithub } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authConfig, setAuthConfig] = useState({ google_client_id: '', github_client_id: '' });
  const [googleGsiError, setGoogleGsiError] = useState(null);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    api.getAuthConfig()
      .then((cfg) => {
        if (isMounted && cfg) {
          setAuthConfig(cfg);
        }
      })
      .catch((err) => console.log('Sin config remota:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  const googleClientId = authConfig.google_client_id || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const githubClientId = authConfig.github_client_id || import.meta.env.VITE_GITHUB_CLIENT_ID || '';

  const isRealGoogleId =
    Boolean(googleClientId) &&
    !googleClientId.includes('tu_google') &&
    !googleClientId.includes('your_') &&
    googleClientId.includes('.apps.googleusercontent.com');

  const isRealGithubId =
    Boolean(githubClientId) &&
    !githubClientId.includes('tu_github') &&
    !githubClientId.includes('your_');

  const handleGoogleLogin = async (idToken) => {
    setLoading(true);
    setGoogleGsiError(null);
    try {
      const res = await loginWithGoogle(idToken);
      showToast(`¡Bienvenido ${res?.user?.name || ''}! Sesión iniciada con Google`);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error login Google backend:', err);
      showToast(err.message || 'Error al validar token con Google', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async (code) => {
    setLoading(true);
    try {
      const res = await loginWithGithub(code);
      showToast(`¡Bienvenido ${res?.user?.name || ''}! Sesión iniciada con GitHub`);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error login GitHub backend:', err);
      showToast(err.message || 'Error al validar código con GitHub', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !isRealGoogleId) return;

    const scriptId = 'google-gsi-script';
    const initAndRender = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response) => {
              console.log('Google GSI Callback recibido:', response);
              if (response.credential) {
                handleGoogleLogin(response.credential);
              }
            },
            error_callback: (err) => {
              console.error('Google GSI Error Callback:', err);
              setGoogleGsiError(err?.message || err?.type || 'Error de origen o popup en Google');
            },
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              width: 320,
            });
          }
        } catch (e) {
          console.error('Error al inicializar Google GSI:', e);
          setGoogleGsiError(e.message);
        }
      }
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initAndRender;
      document.body.appendChild(script);
    } else {
      initAndRender();
    }
  }, [isOpen, isRealGoogleId, googleClientId]);

  if (!isOpen) return null;

  const handleGoogleBtnClick = () => {
    if (isRealGoogleId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.warn('Google One Tap no mostrado:', notification.getNotDisplayedReason());
            handleGoogleLogin('mock_google_token_' + Date.now());
          }
        });
      } catch (e) {
        console.error('Error en prompt Google:', e);
        handleGoogleLogin('mock_google_token_' + Date.now());
      }
    } else {
      handleGoogleLogin('mock_google_token_' + Date.now());
    }
  };

  const handleGithubBtnClick = () => {
    if (isRealGithubId) {
      const redirectUri = window.location.origin;
      const githubUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=user:email`;
      window.location.href = githubUrl;
    } else {
      handleGithubLogin('mock_github_code_' + Date.now());
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container auth-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        <div className="modal-header">
          <h2>
            <LogIn className="modal-icon" size={22} /> Iniciar Sesión / Registro
          </h2>
          <button className="icon-btn close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Accede con tu cuenta para sincronizar tus hábitos entre dispositivos y mantener tu nivel y XP a salvo.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%' }}>
            {/* Si hay error de GSI o si es ID real, mostrar botón rendered y/o botón alternativo */}
            {isRealGoogleId && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div ref={googleBtnRef} style={{ minHeight: '44px', width: '100%', display: 'flex', justifyContent: 'center' }}></div>
                {googleGsiError && (
                  <div style={{ fontSize: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertCircle size={14} /> {googleGsiError}
                  </div>
                )}
              </div>
            )}

            {(!isRealGoogleId || googleGsiError) && (
              <button
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: '0.8rem 1.2rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  width: '100%',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
                disabled={loading}
                onClick={handleGoogleBtnClick}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.1-6.68-4.93H1.36v3.15C3.33 21.28 7.37 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.32 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.36C.49 8.31 0 10.1 0 12s.49 3.69 1.36 5.42l3.96-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.33 2.72 1.36 6.58l3.96 3.15c.94-2.83 3.57-4.98 6.68-4.98z"
                  />
                </svg>
                Continuar con Google
              </button>
            )}

            {/* Botón de GitHub */}
            <button
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '0.8rem 1.2rem',
                fontSize: '1rem',
                fontWeight: 600,
                width: '100%',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
              disabled={loading}
              onClick={handleGithubBtnClick}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continuar con GitHub
            </button>
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={14} style={{ color: 'var(--accent-glow)' }} />
              Seguridad garantizada con JWT & OAuth2
            </div>

            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                textDecoration: 'underline',
                cursor: 'pointer',
                opacity: 0.85,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
              onClick={() => handleGoogleLogin('mock_google_token_' + Date.now())}
            >
              <UserCheck size={12} />
              Probar inicio de sesión instantáneo (Modo Test)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
