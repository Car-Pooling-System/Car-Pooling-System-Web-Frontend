import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
    // Assuming clerk_token is stored in localStorage as per user instruction
    // In a real Clerk app, you'd typically use useAuth().getToken()
    const token = localStorage.getItem('clerk_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.message || error.message || "API Error";
        console.error('API Error:', error.response?.status, message);
        return Promise.reject(new Error(message));
    }
);

export default api;
export { BASE as API_URL };

// ── Driver ──────────────────────────────────────────────────
export const getDriverProfile = (userId) => api.get(`/api/driver-profile/${userId}`);
export const getDriverStats = (userId) => api.get(`/api/driver-stats/${userId}`);
export const getDriverRating = (userId) => api.get(`/api/driver-rating/${userId}`);
export const getDriverVehicles = (userId) => api.get(`/api/driver-vehicles/${userId}`);
export const getDriverRides = (userId) => api.get(`/api/driver-rides/${userId}`);
export const cancelRide = (rideId, payload) => api.post(`/api/rides/${rideId}/cancel`, payload);
export const createRide = (rideData) => api.post(`/api/rides`, rideData);

export const updateRide = async (rideId, rideData) => {
    try {
        return await api.put(`/api/rides/${rideId}`, rideData);
    } catch (error) {
        if (String(error?.message || "").startsWith("404")) {
            return api.put(`/api/driver-rides/${rideId}`, rideData);
        }
        throw error;
    }
};

export const searchRides = (params) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/api/rides/search?${qs}`);
};

// ── Registration & Verification ──
export const registerDriver = (userId) => api.post(`/api/driver-register/${userId}`, {});
export const updateDriverProfile = (userId, data) => api.put(`/api/driver-profile/${userId}`, data);
export const uploadDriverDocs = (userId, data) => api.put(`/api/driver-docs/${userId}`, data);
export const addDriverVehicle = (userId, vehicleData) => api.post(`/api/driver-vehicles/${userId}`, vehicleData);
export const updateDriverVehicle = (userId, vehicleIndex, vehicleData) => api.put(`/api/driver-vehicles/${userId}/${vehicleIndex}`, vehicleData);
export const deleteDriverVehicle = (userId, vehicleIndex) => api.delete(`/api/driver-vehicles/${userId}/${vehicleIndex}`);

export const sendPhoneVerification = (phoneNumber, userId) => api.post(`/api/phone-verification/send-otp`, { phoneNumber, userId });
export const verifyPhoneOtp = (phoneNumber, otp, userId) => api.post(`/api/phone-verification/verify-otp`, { phoneNumber, code: otp, userId });
export const updatePhoneOnProfile = (userId, phoneNumber) => api.put(`/api/driver-profile/${userId}/phone`, { phoneNumber });

export const uploadFile = async ({ dataUrl, filename, folder }) => {
    const result = await api.post(`/api/files/upload`, { dataUrl, filename, folder });
    // result is already response.data due to interceptor
    if (result?.url?.startsWith("/")) {
        return `${BASE}${result.url}`;
    }
    return result?.url;
};

// ── Rider ───────────────────────────────────────────────────
export const getRiderRides = async (userId) => {
    try {
        // Current backend mount: app.use("/api/rider", riderRouter)
        // and inside rider router: router.use("/rider-rides", ...)
        return await api.get(`/api/rider/rider-rides/${userId}`);
    } catch (error) {
        // Backward compatibility for older deployments.
        if (String(error?.message || "").startsWith("404")) {
            return api.get(`/api/rider-rides/${userId}`);
        }
        throw error;
    }
};

export const bookRide = (rideId, bookData) => api.post(`/api/rides/${rideId}/book`, bookData);
