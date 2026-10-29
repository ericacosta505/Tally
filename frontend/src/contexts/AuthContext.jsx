import React, { createContext, useState, useContext, useEffect } from 'react';
import { signup, login as loginApi, setSessionToken } from '../services/api';
const AuthContext = createContext();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const parsed = JSON.parse(localStorage.getItem('user') || 'null');
      if (
        storedToken &&
        parsed &&
        typeof parsed.first_name === 'string' &&
        typeof parsed.last_name === 'string'
      ) {
        setToken(storedToken);
        setSessionToken(storedToken);
        setUser(parsed);
      }
    } catch (_) {
      /* An invalid or unavailable cache must not block the demo. */
    }
    setLoading(false);
  }, []);
  const authenticate = async (request) => {
    try {
      const response = await request();
      if (!response?.token || !response?.user) throw new Error('Invalid server response');
      setSessionToken(response.token);
      setToken(response.token);
      setUser(response.user);
      try {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      } catch (_) {
        /* Keep the session in memory if persistence is unavailable. */
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          'We couldn’t reach the account server. Please try again, or explore the demo.',
      };
    }
  };
  const logout = () => {
    setToken(null);
    setSessionToken(null);
    setUser(null);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (_) {}
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        signup: (data) => authenticate(() => signup(data)),
        login: (email, password) => authenticate(() => loginApi(email, password)),
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
