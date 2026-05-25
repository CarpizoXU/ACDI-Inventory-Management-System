import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const storedUser = window.localStorage.getItem('acdi_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem('acdi_token');
  });

  const login = (userData, tokenValue) => {
    setUser(userData);
    setToken(tokenValue);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('acdi_user', JSON.stringify(userData));
      window.localStorage.setItem('acdi_token', tokenValue);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('acdi_user');
      window.localStorage.removeItem('acdi_token');
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAdmin: user?.role === 'admin',
      login,
      logout,
    }),
    [user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
