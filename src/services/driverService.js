import api from '@/lib/api';

export const driverService = {
  getProfile: async (userId) => api.get(`/api/driver-profile/${userId}`),
  updateProfile: async (userId, data) => api.put(`/api/driver-profile/${userId}`, data),
  register: async (userId) => api.post(`/api/driver-register/${userId}`, {}),
  getVehicles: async (userId) => api.get(`/api/driver-vehicles/${userId}`),
  addVehicle: async (userId, data) => api.post(`/api/driver-vehicles/${userId}`, data),
};
