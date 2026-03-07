const BASE = import.meta.env.VITE_BACKEND_URL;

async function get(path) {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}

// ── Driver ──────────────────────────────────────────────────
export const getDriverProfile = (userId) => get(`/api/driver-profile/${userId}`);
export const getDriverStats = (userId) => get(`/api/driver-stats/${userId}`);
export const getDriverRating = (userId) => get(`/api/driver-rating/${userId}`);
export const getDriverVehicles = (userId) => get(`/api/driver-vehicles/${userId}`);
export const getDriverRides = (userId) => get(`/api/driver-rides/${userId}`);
export const cancelRide = (rideId) => get(`/api/rides/${rideId}/cancel`); // Or post based on backend
export const createRide = (rideData) => post(`/api/rides`, rideData);
export const searchRides = (params) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/api/rides/search?${qs}`);
};

// ── Registration & Verification ──
export const registerDriver = (userId) => post(`/api/driver-register/${userId}`, {});
export const updateDriverProfile = (userId, data) => put(`/api/driver-profile/${userId}`, data);
export const uploadDriverDocs = (userId, data) => put(`/api/driver-docs/${userId}`, data);
export const addDriverVehicle = (userId, vehicleData) => post(`/api/driver-vehicles/${userId}`, vehicleData);

export const sendPhoneVerification = (phoneNumber) => post(`/api/phone-verification/send`, { phoneNumber });
export const verifyPhoneOtp = (phoneNumber, otp) => post(`/api/phone-verification/verify`, { phoneNumber, otp });
export const updatePhoneOnProfile = (userId, phoneNumber) => put(`/api/driver-profile/${userId}/phone`, { phoneNumber });

// ── Rider ───────────────────────────────────────────────────
export const getRiderRides = (userId) => get(`/api/rider-rides/${userId}`);
export const bookRide = (rideId, bookData) => post(`/api/rides/${rideId}/book`, bookData);

// Helper for POST
async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}

// Helper for PUT
async function put(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}
