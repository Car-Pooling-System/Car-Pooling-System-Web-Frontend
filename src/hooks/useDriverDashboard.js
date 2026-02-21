import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
    getDriverProfile,
    getDriverStats,
    getDriverRating,
    getDriverVehicles,
    getDriverRides,
    getDriverPayments,
} from "../lib/api.js";

/**
 * Fetches all data needed for the Driver Dashboard.
 * Returns aggregated earnings, ride stats, vehicles, rating,
 * verification status, and chart-ready data arrays.
 */
export function useDriverDashboard() {
    const { user, isSignedIn, isLoaded } = useUser();
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    useEffect(() => {
        if (!isLoaded || !isSignedIn || !user) return;

        const userId = user.id;

        async function fetchAll() {
            setLoading(true);
            setError(null);
            try {
                const [profileRes, statsRes, ratingRes, vehiclesRes, ridesRes, paymentsRes] =
                    await Promise.allSettled([
                        getDriverProfile(userId),
                        getDriverStats(userId),
                        getDriverRating(userId),
                        getDriverVehicles(userId),
                        getDriverRides(userId),
                        getDriverPayments(userId),
                    ]);

                const profile  = profileRes.status  === "fulfilled" ? profileRes.value   : null;
                const stats    = statsRes.status     === "fulfilled" ? statsRes.value     : null;
                const rating   = ratingRes.status    === "fulfilled" ? ratingRes.value    : null;
                const vehicles = vehiclesRes.status  === "fulfilled" ? (vehiclesRes.value.vehicles ?? []) : [];
                const rides    = ridesRes.status     === "fulfilled" ? ridesRes.value     : [];
                const paymentsData = paymentsRes.status === "fulfilled" ? paymentsRes.value : null;

                const payments        = paymentsData?.payments ?? [];
                const summary         = paymentsData?.summary  ?? { totalEarnings: 0, currentMonthEarnings: 0, pendingPayouts: 0 };

                // ── Earnings Trend (last 30 days) ───────────────────────
                const earningsByDay = buildEarningsTrend(payments);

                // ── Hours vs Distance by weekday ────────────────────────
                const hoursVsDistance = buildHoursVsDistance(rides);

                // ── Recent payouts (last 10 successful) ─────────────────
                const recentPayouts = payments
                    .filter((p) => p.status === "success")
                    .slice(0, 10);

                setData({
                    profile,
                    stats,
                    rating,
                    vehicles,
                    rides,
                    payments,
                    summary,
                    earningsByDay,
                    hoursVsDistance,
                    recentPayouts,
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchAll();
    }, [isLoaded, isSignedIn, user]);

    return { data, loading, error };
}

/* ─── Helpers ───────────────────────────────────────────────────── */

/**
 * Builds an array of { week, earnings } for the last 4 weeks.
 * Falls back to showing week labels even when no payment data exists.
 */
function buildEarningsTrend(payments) {
    const now = new Date();
    const weeks = [];

    for (let w = 3; w >= 0; w--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (w + 1) * 7);
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - w * 7);

        const earnings = payments
            .filter((p) => {
                const d = new Date(p.createdAt);
                return p.status === "success" && d >= weekStart && d < weekEnd;
            })
            .reduce((s, p) => s + p.amount, 0);

        weeks.push({ week: `Week ${4 - w}`, earnings });
    }

    return weeks;
}

/**
 * Builds an array of { day, hours, km } for MON–SUN.
 * Aggregates from completed rides.
 */
function buildHoursVsDistance(rides) {
    const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const map = {};
    days.forEach((d) => (map[d] = { day: d, hours: 0, km: 0 }));

    rides
        .filter((r) => r.status === "completed")
        .forEach((r) => {
            const dow = new Date(r.schedule?.departureTime).getDay(); // 0=Sun
            const key = days[(dow + 6) % 7]; // shift so Mon=0
            map[key].hours += (r.metrics?.durationMinutes ?? 0) / 60;
            map[key].km    += r.metrics?.totalDistanceKm ?? 0;
        });

    return days.map((d) => ({
        day: d,
        hours: parseFloat(map[d].hours.toFixed(1)),
        km:    parseFloat(map[d].km.toFixed(1)),
    }));
}
