const ENV_BASE = String(import.meta.env.VITE_BACKEND_URL || "").trim().replace(/\/+$/, "");
const BASE_CANDIDATES = Array.from(
    new Set(
        [ENV_BASE, "http://localhost:3000", ""]
            .map((base) => String(base || "").trim().replace(/\/+$/, ""))
            .filter((base, index, arr) => arr.indexOf(base) === index),
    ),
);
let activeBase = BASE_CANDIDATES[0] || "";

function buildUrl(base, path) {
    if (!base) return path;
    return `${base}${path}`;
}

async function request(path, options = {}) {
    const basesToTry = Array.from(new Set([activeBase, ...BASE_CANDIDATES]));
    let networkError = null;

    for (const base of basesToTry) {
        try {
            const response = await fetch(buildUrl(base, path), options);
            activeBase = base;
            return response;
        } catch (err) {
            networkError = err;
        }
    }

    throw networkError || new Error("Failed to fetch");
}

async function get(path) {
    const res = await request(path);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}

// Driver
export const getDriverProfile = (userId) => get(`/api/driver-profile/${userId}`);
export const getDriverStats = (userId) => get(`/api/driver-stats/${userId}`);
export const getDriverRating = (userId) => get(`/api/driver-rating/${userId}`);
export const getDriverVehicles = (userId) => get(`/api/driver-vehicles/${userId}`);
export const getDriverRides = (userId) => get(`/api/driver-rides/${userId}`);
export const cancelRide = (rideId, payload) => post(`/api/rides/${rideId}/cancel`, payload);
export const createRide = (rideData) => post(`/api/rides`, rideData);

export const updateRide = async (rideId, rideData) => {
    try {
        return await put(`/api/rides/${rideId}`, rideData);
    } catch (error) {
        if (String(error?.message || "").startsWith("404")) {
            return put(`/api/driver-rides/${rideId}`, rideData);
        }
        throw error;
    }
};

export const searchRides = (params) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/api/rides/search?${qs}`);
};

export const getRideDetails = (rideId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/api/rides/${rideId}${qs ? `?${qs}` : ""}`);
};

export const getRideChatMessages = (rideId) => get(`/api/rides/${rideId}/messages`);
export const sendRideChatMessage = (rideId, payload) => post(`/api/rides/${rideId}/messages`, payload);
export const confirmRideRequest = (rideId, payload) => post(`/api/rides/${rideId}/confirm-request`, payload);
export const rejectRideRequest = (rideId, payload) => post(`/api/rides/${rideId}/reject-request`, payload);

export const getChatConversations = (userId) =>
    get(`/api/chat/conversations?userId=${encodeURIComponent(userId)}`);
export const getChatMessages = (conversationId, page = 1, limit = 50) =>
    get(`/api/chat/messages/${conversationId}?page=${page}&limit=${limit}`);
export const createGroupConversation = (rideId, userId) =>
    post(`/api/chat/conversations/group`, { rideId, userId });
export const createDirectConversation = (participants) =>
    post(`/api/chat/conversations/direct`, { participants });

// Registration and Verification
export const registerDriver = (userId) => post(`/api/driver-register/${userId}`, {});
export const updateDriverProfile = (userId, data) => put(`/api/driver-profile/${userId}`, data);
export const uploadDriverDocs = (userId, data) => put(`/api/driver-docs/${userId}`, data);
export const addDriverVehicle = (userId, vehicleData) => post(`/api/driver-vehicles/${userId}`, vehicleData);
export const updateDriverVehicle = (userId, vehicleIndex, vehicleData) =>
    put(`/api/driver-vehicles/${userId}/${vehicleIndex}`, vehicleData);
export const deleteDriverVehicle = (userId, vehicleIndex) =>
    del(`/api/driver-vehicles/${userId}/${vehicleIndex}`);

export const sendPhoneVerification = (phoneNumber, userId) =>
    post(`/api/phone-verification/send-otp`, { phoneNumber, userId });
export const verifyPhoneOtp = (phoneNumber, otp, userId) =>
    post(`/api/phone-verification/verify-otp`, { phoneNumber, code: otp, userId });
export const updatePhoneOnProfile = (userId, phoneNumber) =>
    put(`/api/driver-profile/${userId}/phone`, { phoneNumber });

export const uploadFile = async ({ dataUrl, filename, folder }) => {
    const result = await post(`/api/files/upload`, { dataUrl, filename, folder });
    if (result?.url?.startsWith("/")) {
        return activeBase ? `${activeBase}${result.url}` : result.url;
    }
    return result?.url;
};

// Rider
export const getRiderRides = async (userId) => {
    try {
        return await get(`/api/rider/rider-rides/${userId}`);
    } catch {
        return get(`/api/rider-rides/${userId}`);
    }
};

export const bookRide = (rideId, bookData) => post(`/api/rides/${rideId}/book`, bookData);
export const getEmission = (type, distances) => post(`/get-emission`, { type, distances });

async function post(path, body) {
    const res = await request(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const message = await extractErrorMessage(res);
        throw new Error(message);
    }
    return res.json();
}

async function put(path, body) {
    const res = await request(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const message = await extractErrorMessage(res);
        throw new Error(message);
    }
    return res.json();
}

async function del(path) {
    const res = await request(path, { method: "DELETE" });
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
    } catch {
        // Ignore JSON parse errors and fallback to status text.
    }
    return `${res.status} ${res.statusText}`;
}
