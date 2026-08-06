import axios from 'axios';
import { getTokens } from '../utils/tokenStorage';

const API_URL = 'http://localhost:5000/api/v1';

const getAuthHeaders = () => {
  const { accessToken } = getTokens();
  return { Authorization: `Bearer ${accessToken}` };
};

export const superAdminService = {
  // Get Dashboard Summary
  getDashboardSummary: async () => {
    const response = await axios.get(`${API_URL}/dashboard/super-admin/summary`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get Revenue Stats
  getRevenueStats: async () => {
    const response = await axios.get(`${API_URL}/payments/stats/revenue`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get Active Hospitals
  getActiveHospitals: async () => {
    const response = await axios.get(`${API_URL}/hospitals/active`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get All Hospitals
  getAllHospitals: async () => {
    const response = await axios.get(`${API_URL}/hospitals`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get Pending Admins
  getPendingAdmins: async () => {
    const response = await axios.get(`${API_URL}/auth/pending-admins`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Approve User
  approveUser: async (id) => {
    const response = await axios.patch(`${API_URL}/auth/approve/${id}`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
  
  onboardHospital: async (data) => {
    const response = await axios.post(`${API_URL}/hospitals/onboard`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get Staff (platform wide for super_admin)
  getStaff: async (hospitalId = '') => {
    const query = hospitalId ? `?hospitalId=${hospitalId}` : '';
    const response = await axios.get(`${API_URL}/auth/staff${query}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  }
};
