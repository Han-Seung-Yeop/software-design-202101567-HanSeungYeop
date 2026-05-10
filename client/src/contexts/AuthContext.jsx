import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const { user: meUser, profile } = res.data.data;
      const merged = { ...meUser, profile };
      setUser(merged);
      return { user: merged, profile };
    } catch (err) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      throw err;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const saveTokens = (accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // 서버 응답 실패해도 로컬 정리
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('originalToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, saveTokens, fetchUser, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
