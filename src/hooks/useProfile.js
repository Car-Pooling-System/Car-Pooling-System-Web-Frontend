import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
    getDriverProfile,
    getDriverStats,
    getDriverRating,
    getDriverVehicles,
    getRiderRides,
} from "../lib/api.js";

/**
 * Fetches all backend profile data for the signed-in user.
 * Automatically picks driver or rider endpoints based on unsafeMetadata.role.
 */
export function useProfile() {
    const { user, isSignedIn, isLoaded } = useUser();
    const [data, setData]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState(null);

    useEffect(() => {
        if (!isLoaded || !isSignedIn || !user) return;

        const role   = user.unsafeMetadata?.role ?? "rider";
        const userId = user.id;

        async function fetchAll() {
            setLoading(true);
            setError(null);
            try {
                if (role === "driver") {
                    const [profile, stats, rating, vehiclesRes] = await Promise.allSettled([
                        getDriverProfile(userId),
                        getDriverStats(userId),
                        getDriverRating(userId),
                        getDriverVehicles(userId),
                    ]);

                    setData({
                        role: "driver",
                        profile:  profile.status  === "fulfilled" ? profile.value  : null,
                        stats:    stats.status    === "fulfilled" ? stats.value    : null,
                        rating:   rating.status   === "fulfilled" ? rating.value   : null,
                        vehicles: vehiclesRes.status === "fulfilled" ? vehiclesRes.value.vehicles ?? [] : [],
                    });
                } else {
                    // rider
                    const ridesResult = await Promise.allSettled([getRiderRides(userId)]);
                    const bookings = ridesResult[0].status === "fulfilled" ? ridesResult[0].value : [];

                    // Compute stats client-side from bookings
                    const completed  = bookings.filter((b) => b.status === "confirmed").length;
                    const cancelled  = bookings.filter((b) => b.status === "cancelled").length;
                    const totalFare  = bookings.reduce((s, b) => s + (b.farePaid ?? 0), 0);

                    setData({
                        role: "rider",
                        bookings,
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
    }, [isLoaded, isSignedIn, user]);

    return { data, loading, error, role: user?.unsafeMetadata?.role ?? "rider" };
}
