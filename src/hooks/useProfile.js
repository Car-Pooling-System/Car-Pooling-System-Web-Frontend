import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
    getDriverProfile,
    getDriverRides,
    getDriverStats,
    getDriverRating,
    getDriverVehicles,
    getRiderRides,
} from "../lib/api.js";

function getEffectiveBookingStatus(booking) {
    const bookingStatus = String(booking?.status || "").toLowerCase();
    const rideStatus = String(booking?.ride?.status || "").toLowerCase();

    if (bookingStatus === "cancelled" || rideStatus === "cancelled") return "cancelled";
    if (bookingStatus === "completed" || rideStatus === "completed") return "completed";
    if (bookingStatus === "confirmed") return "confirmed";
    if (bookingStatus === "requested" || bookingStatus === "pending") return "requested";
    return bookingStatus || "requested";
}

/**
 * Fetches all backend profile data for the signed-in user.
 * Automatically picks driver or rider endpoints based on unsafeMetadata.role.
 */
export function useProfile() {
    const { user, isSignedIn, isLoaded } = useUser();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!isLoaded || !isSignedIn || !user) return;

        const role = user.unsafeMetadata?.role ?? "rider";
        const userId = user.id;

        async function fetchAll() {
            setLoading(true);
            setError(null);
            try {
                if (role === "driver") {
                    const [profile, stats, rating, vehiclesRes, ridesRes] = await Promise.allSettled([
                        getDriverProfile(userId),
                        getDriverStats(userId),
                        getDriverRating(userId),
                        getDriverVehicles(userId),
                        getDriverRides(userId),
                    ]);

                    setData({
                        role: "driver",
                        profile: profile.status === "fulfilled" ? profile.value : null,
                        stats: stats.status === "fulfilled" ? stats.value : null,
                        rating: rating.status === "fulfilled" ? rating.value : null,
                        rides: ridesRes.status === "fulfilled" ? ridesRes.value : [],
                        vehicles: vehiclesRes.status === "fulfilled" ? vehiclesRes.value.vehicles ?? [] : [],
                    });
                } else {
                    // rider
                    const ridesResult = await Promise.allSettled([getRiderRides(userId)]);
                    const res = ridesResult[0].status === "fulfilled" ? ridesResult[0].value : { bookings: [], co2Saved: 0 };

                    const bookings = Array.isArray(res) ? res : (res.bookings || []);
                    const co2Saved = res.co2Saved || 0;

                    // Compute rider stats using both booking.status and ride.status.
                    const completed = bookings.filter((b) => getEffectiveBookingStatus(b) === "completed").length;
                    const cancelled = bookings.filter((b) => getEffectiveBookingStatus(b) === "cancelled").length;
                    const totalFare = bookings
                        .filter((b) => {
                            const status = getEffectiveBookingStatus(b);
                            return status === "confirmed" || status === "completed";
                        })
                        .reduce((sum, b) => sum + Number(b?.farePaid || 0), 0);

                    setData({
                        role: "rider",
                        bookings,
                        co2Saved,
                        computed: { completed, cancelled, totalFare },
                    });
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchAll();
    }, [isLoaded, isSignedIn, user, refreshKey]);

    return {
        data,
        loading,
        error,
        role: user?.unsafeMetadata?.role ?? "rider",
        refresh: () => setRefreshKey((value) => value + 1),
    };
}
