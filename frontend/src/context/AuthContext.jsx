import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_BASE } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('salons_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('salons_token') || '');
  const [authError, setAuthError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogout = useCallback(() => {
    setUser(null);
    setToken('');
    setAuthError('');
    localStorage.removeItem('salons_user');
    localStorage.removeItem('salons_token');
  }, []);

  const getHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  const fetchWithAuth = useCallback(async (url, options = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (response.status === 401 || response.status === 403) {
      handleLogout();
      throw new Error('Session invalide');
    }

    return response;
  }, [token, handleLogout]);

  const handleLogin = async (email, password) => {
    setLoginLoading(true);
    setAuthError('');

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setAuthError(body?.detail || `Erreur ${response.status} : email ou mot de passe invalide`);
        return false;
      }

      const payload = await response.json().catch(() => null);
      if (!payload?.access_token || !payload?.user) {
        setAuthError('Réponse du serveur invalide.');
        return false;
      }

      setUser(payload.user);
      setToken(payload.access_token);
      localStorage.setItem('salons_user', JSON.stringify(payload.user));
      localStorage.setItem('salons_token', payload.access_token);
      setAuthError('');
      return true;
    } catch {
      setAuthError('Impossible de se connecter au serveur.');
      return false;
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchWithAuth(`${API_BASE}/auth/profile`)
      .then((response) => response.json())
      .then((currentUser) => {
        setUser(currentUser);
        localStorage.setItem('salons_user', JSON.stringify(currentUser));
      })
      .catch(() => {
        setAuthError('Session expirée ou invalide. Veuillez vous reconnecter.');
      });
  }, [token, fetchWithAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        authError,
        setAuthError,
        loginLoading,
        handleLogin,
        handleLogout,
        fetchWithAuth,
        getHeaders,
        isAuthenticated: Boolean(user && token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
