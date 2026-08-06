import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { getTokens, setTokens, clearTokens } from '../utils/tokenStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      // Typically, you'd fetch the user profile here.
      // If there's no endpoint, we can decode the token or wait for login data.
      // Assuming a generic /api/v1/auth/profile for now, or just parsing token.
      // For simplicity, we'll try to get it if there's a token.
      
      // Let's decode the token manually since jwt-decode isn't installed
      const { accessToken } = getTokens();
      if (accessToken) {
        const cachedUser = localStorage.getItem('user_data');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        } else {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          setUser({ id: payload.sub || payload.id, role: payload.role, email: payload.email, profilePicture: payload.profilePicture, ...payload });
        }
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Failed to load user profile', error);
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = (userData, accessToken, refreshToken) => {
    setTokens(accessToken, refreshToken);
    setUser(userData);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (error) {
      console.error('Logout failed on server', error);
    } finally {
      clearTokens();
      localStorage.removeItem('user_data');
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/login';
    }
  };

  const updateUserSession = (data) => {
    setUser(prev => {
      const updatedUser = { ...prev, ...data };
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, updateUserSession }}>
      {!loading ? children : <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
