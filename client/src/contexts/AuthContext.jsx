import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          const { user, profile } = res.data.data;
          setUser({ ...user, profile });
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (login_id, password) => {
    const { data } = await api.post('/auth/login', { login_id, password });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    // Fetch full user info including profile
    const meRes = await api.get('/auth/me');
    const { user: meUser, profile } = meRes.data.data;
    setUser({ ...meUser, profile });
    return data.data;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
