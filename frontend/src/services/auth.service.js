import axios from 'axios';
import { getTokens, setTokens, clearTokens } from '../utils/tokenStorage';

const API_URL = 'http://localhost:5000/api/v1/auth';

const api = axios.create({
  baseURL: API_URL,
});

export const authService = {
  // Register a new user (multipart/form-data)
  register: async (formData) => {
    const response = await api.post('/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Login with Email/Mobile and Password
  login: async (loginId, password) => {
    const response = await api.post('/login', { loginId, password });
    if (response.data.tokens) {
      setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Request OTP for Mobile Login
  requestOtp: async (mobile) => {
    const response = await api.post('/request-otp', { mobile });
    return response.data;
  },

  // Login with Mobile and OTP
  loginWithOtp: async (mobile, otp) => {
    const response = await api.post('/login-with-otp', { mobile, otp });
    if (response.data.tokens) {
      setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Forgot Password
  forgotPassword: async (email) => {
    const response = await api.post('/forgot-password', { email });
    return response.data;
  },

  // Logout
  logout: async () => {
    const { accessToken: token, refreshToken } = getTokens();
    if (token && refreshToken) {
      try {
        await api.post('/logout', { refreshToken }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {
        console.error("Logout API failed", e);
      }
    }
    clearTokens();
    localStorage.removeItem('user');
  },

  // Get current user from local storage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  }
};
