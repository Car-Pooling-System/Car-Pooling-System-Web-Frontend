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
export const cancelRide = (rideId) => get(`/api/cancel-ride/${rideId}`); // Assuming GET/POST depending on backend
export const createRide = (rideData) => post(`/api/create-ride`, rideData);

// ── Rider ───────────────────────────────────────────────────
export const getRiderRides = (userId) => get(`/api/rider-rides/${userId}`);
export const bookRide = (rideId, userId) => post(`/api/book-ride`, { rideId, userId });

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
