const BASE = import.meta.env.VITE_BACKEND_URL;

async function get(path) {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}

// ── Driver ──────────────────────────────────────────────────
export const getDriverProfile  = (userId) => get(`/api/driver-profile/${userId}`);
export const getDriverStats    = (userId) => get(`/api/driver-stats/${userId}`);
export const getDriverRating   = (userId) => get(`/api/driver-rating/${userId}`);
export const getDriverVehicles = (userId) => get(`/api/driver-vehicles/${userId}`);
export const getDriverRides    = (userId) => get(`/api/driver-rides/${userId}`);
export const getDriverPayments = (userId) => get(`/api/payment/driver/${userId}`);

// ── Rider ───────────────────────────────────────────────────
export const getRiderRides = (userId) => get(`/api/rider-rides/${userId}`);
