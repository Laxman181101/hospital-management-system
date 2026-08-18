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
  getStaff: async (params = {}) => {
    let query = '';
    if (typeof params === 'string') {
      query = params ? `?hospitalId=${params}` : '';
    } else if (params && typeof params === 'object') {
      const searchParams = new URLSearchParams();
      if (params.hospitalId) searchParams.append('hospitalId', params.hospitalId);
      if (params.role) searchParams.append('role', params.role);
      if (params.search) searchParams.append('search', params.search);
      const queryString = searchParams.toString();
      if (queryString) query = `?${queryString}`;
    }
    const response = await api.get(`/api/v1/auth/staff${query}`);
    return response.data;
  }
};
