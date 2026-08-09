import api from './api';

export const superAdminService = {
  // Get Dashboard Summary
  getDashboardSummary: async () => {
    const response = await api.get('/api/v1/dashboard/super-admin/summary');
    return response.data;
  },

  // Get Revenue Stats
  getRevenueStats: async () => {
    const response = await api.get('/api/v1/payments/stats/revenue');
    return response.data;
  },

  // Get Active Hospitals
  getActiveHospitals: async () => {
    const response = await api.get('/api/v1/hospitals/active');
    return response.data;
  },

  // Get All Hospitals
  getAllHospitals: async () => {
    const response = await api.get('/api/v1/hospitals');
    return response.data;
  },

  // Get Pending Admins
  getPendingAdmins: async () => {
    const response = await api.get('/api/v1/auth/pending-admins');
    return response.data;
  },

  // Approve User
  approveUser: async (id) => {
    const response = await api.patch(`/api/v1/auth/approve/${id}`);
    return response.data;
  },
  
  onboardHospital: async (data) => {
    const response = await api.post('/api/v1/hospitals/onboard', data);
    return response.data;
  },

  // Get Staff (platform wide for super_admin)
  getStaff: async (hospitalId = '') => {
    const query = hospitalId ? `?hospitalId=${hospitalId}` : '';
    const response = await api.get(`/api/v1/auth/staff${query}`);
    return response.data;
  }
};
