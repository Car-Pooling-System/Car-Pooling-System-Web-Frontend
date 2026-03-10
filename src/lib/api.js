const RAW_BASE =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.EXPO_PUBLIC_BACKEND_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.EXPO_PUBLIC_API_BASE_URL ||
    "http://localhost:3000";

const BASE = RAW_BASE.endsWith("/") ? RAW_BASE.slice(0, -1) : RAW_BASE;

function buildUrl(path) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (BASE.endsWith("/api") && normalizedPath.startsWith("/api/")) {
        return `${BASE}${normalizedPath.slice(4)}`;
    }
    return `${BASE}${normalizedPath}`;
}

function wrapNetworkError(error) {
    if (error instanceof TypeError) {
        return new Error(`Network error: unable to reach backend at ${BASE}`);
    }
    return error;
}

async function get(path) {
    try {
        const res = await fetch(buildUrl(path));
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
    } catch (error) {
        throw wrapNetworkError(error);
    }
}

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
export const getRiderRides = (userId) => get(`/api/rider-rides/${userId}`);
export const bookRide = (rideId, bookData) => post(`/api/rides/${rideId}/book`, bookData);

// Helper for POST
async function post(path, body) {
    try {
        const res = await fetch(buildUrl(path), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
    } catch (error) {
        throw wrapNetworkError(error);
    }
}

// Helper for PUT
async function put(path, body) {
    try {
        const res = await fetch(buildUrl(path), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
    } catch (error) {
        throw wrapNetworkError(error);
    }
}
