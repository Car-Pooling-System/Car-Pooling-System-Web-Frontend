import api from '@/lib/api';

export const rideService = {
  getAllRides: async () => api.get('/api/rides'),
  searchRides: async (data) => api.post('/api/rides/search', data),
  getRideById: async (id) => api.get(`/api/rides/${id}`),
  createRide: async (data) => api.post('/api/rides', data),
  bookRide: async (id, data) => api.post(`/api/rides/${id}/book`, data),
  getMyRides: async () => api.get('/api/rides/my-rides'),
  getMyBookings: async () => api.get('/api/bookings/my-bookings'),
};
