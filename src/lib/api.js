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
export const updateDriverVehicle = (userId, vehicleIndex, vehicleData) => put(`/api/driver-vehicles/${userId}/${vehicleIndex}`, vehicleData);
export const deleteDriverVehicle = (userId, vehicleIndex) => del(`/api/driver-vehicles/${userId}/${vehicleIndex}`);

export const sendPhoneVerification = (phoneNumber, userId) => post(`/api/phone-verification/send-otp`, { phoneNumber, userId });
export const verifyPhoneOtp = (phoneNumber, otp, userId) => post(`/api/phone-verification/verify-otp`, { phoneNumber, code: otp, userId });
export const updatePhoneOnProfile = (userId, phoneNumber) => put(`/api/driver-profile/${userId}/phone`, { phoneNumber });
export const uploadFile = async ({ dataUrl, filename, folder }) => {
    const result = await post(`/api/files/upload`, { dataUrl, filename, folder });
    if (result?.url?.startsWith("/")) {
        return `${BASE}${result.url}`;
    }
    return result?.url;
};

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
    if (!res.ok) {
        const message = await extractErrorMessage(res);
        throw new Error(message);
    }
    return res.json();
}

// Helper for PUT
async function put(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const message = await extractErrorMessage(res);
        throw new Error(message);
    }
    return res.json();
}

async function del(path) {
    const res = await fetch(`${BASE}${path}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const message = await extractErrorMessage(res);
        throw new Error(message);
    }
    return res.json();
}

async function extractErrorMessage(res) {
    try {
        const data = await res.json();
        if (data?.message) return `${res.status}: ${data.message}`;
    } catch (_) {
        // Ignore JSON parse errors and fallback to status text.
    }
    return `${res.status} ${res.statusText}`;
}
