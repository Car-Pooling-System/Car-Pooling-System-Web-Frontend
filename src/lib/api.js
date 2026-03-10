import axios from 'axios';

const RAW_BASE =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:3000";

const BASE = RAW_BASE.endsWith("/") ? RAW_BASE.slice(0, -1) : RAW_BASE;
export const API_URL = BASE;

const api = axios.create({
    baseURL: BASE,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

// Response interceptor for data extraction
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.message || error.message || "Network error: unable to reach backend";
        return Promise.reject(new Error(message));
    }
);

export default api;

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
    if (result?.url?.startsWith("/")) {
        return `${BASE}${result.url}`;
    }
    return result?.url;
};

// ── Rider ───────────────────────────────────────────────────
export const getRiderRides = (userId) => api.get(`/api/rider-rides/${userId}`);
export const bookRide = (rideId, bookData) => api.post(`/api/rides/${rideId}/book`, bookData);
