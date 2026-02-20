import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { Navigate, useNavigate } from "react-router-dom";
import { MapPin, Clock, Navigation, Users, Edit, Trash2, ArrowRight, Car, AlertCircle } from "lucide-react";

export default function DriverRides() {
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
            </div>
        );
    }

    if (user?.unsafeMetadata?.role !== "driver") {
        return <Navigate to="/home" />;
    }

    useEffect(() => {
        const fetchRides = async () => {
            try {
                const res = await axios.get(
                    `${BACKEND_URL}/api/driver-rides/${user.id}`
                );
                setRides(res.data);
            } catch (err) {
                console.error("FAILED TO FETCH RIDES:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRides();
    }, [user.id]);

    /* ---------- UI ---------- */
    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 border-4 border-[var(--color-primary-muted)] border-t-[var(--color-primary)] rounded-full animate-spin" />
                    <p className="text-gray-400 font-bold text-sm tracking-wide uppercase">Loading your rides...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 font-sans relative overflow-x-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-[400px] bg-[var(--color-primary)]/5 rounded-b-[3rem] -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/80" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 fade-in-up">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">My Published Rides</h1>
                        <p className="text-gray-500 text-lg">Manage and track your upcoming journeys</p>
                    </div>
                    <button
                        onClick={() => navigate("/driver/create-ride")}
                        className="group flex items-center gap-2 px-6 py-4 bg-[var(--color-primary)] text-white font-bold rounded-2xl hover:bg-[var(--color-primary-light)] transition-all shadow-xl shadow-[var(--color-primary)]/20 transform hover:-translate-y-1"
                    >
                        <Navigation size={20} className="group-hover:rotate-12 transition-transform" />
                        Publish New Ride
                    </button>
                </div>

                {/* Empty State */}
                {rides.length === 0 && (
                    <div className="bg-white rounded-3xl shadow-xl p-16 text-center border border-gray-100 fade-in-up delay-1">
                        <div className="w-24 h-24 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Car className="text-[var(--color-primary)]" size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">No rides published yet</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                            You haven't listed any rides currently. Share your customized ride and start earning while you travel!
                        </p>
                        <button
                            onClick={() => navigate("/driver/create-ride")}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition shadow-lg"
                        >
                            <Navigation size={18} />
                            Create Your First Ride
                        </button>
                    </div>
                )}

                {/* Rides List */}
                <div className="grid gap-8">
                    {rides.map((ride, index) => {
                        const departureDate = new Date(ride.schedule.departureTime);
                        const isUpcoming = departureDate > new Date();

                        return (
                            <div
                                key={ride._id}
                                className={`bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group fade-in-up delay-${Math.min(index + 1, 3)}`}
                            >
                                <div className="p-8">
                                    <div className="grid lg:grid-cols-12 gap-8 items-center">

                                        {/* Date Box (Col 2) */}
                                        <div className="lg:col-span-2 flex lg:flex-col items-center justify-center lg:justify-start gap-2 bg-gray-50 rounded-2xl p-4 text-center border border-gray-100 group-hover:bg-[var(--color-primary)]/5 transition-colors">
                                            <span className="text-3xl font-extrabold text-[var(--color-primary)]">
                                                {departureDate.getDate()}
                                            </span>
                                            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                                {departureDate.toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-900 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100 mt-1">
                                                {departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {/* Route Info (Col 7) */}
                                        <div className="lg:col-span-7 space-y-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                {isUpcoming ? (
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 uppercase tracking-wide">
                                                        Upcoming
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full border border-gray-200 uppercase tracking-wide">
                                                        Completed
                                                    </span>
                                                )}
                                                <span className="text-gray-300 text-xs font-bold">●</span>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                    ID: {ride._id.slice(-6)}
                                                </span>
                                                <span className="text-gray-300 text-xs font-bold">●</span>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                    ₹{ride.pricing?.baseFare ? Number(ride.pricing.baseFare) + (Number(ride.pricing.pricePerKm) * Number(ride.metrics.totalDistanceKm)) : "0"} Total
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-3 h-3 rounded-full bg-[var(--color-primary)] ring-4 ring-[var(--color-primary)]/10" />
                                                    <h3 className="text-xl font-bold text-gray-900">{ride.route.start.name}</h3>
                                                </div>
                                                <div className="ml-1.5 pl-4 border-l-2 border-dashed border-gray-200 py-2 my-1" />
                                                <div className="flex items-center gap-4">
                                                    <div className="w-3 h-3 rounded-full bg-gray-900 ring-4 ring-gray-100" />
                                                    <h3 className="text-xl font-bold text-gray-900">{ride.route.end.name}</h3>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-3 mt-4">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 group-hover:bg-white transition-colors">
                                                    <Navigation size={14} className="text-gray-400" />
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        {ride.metrics.totalDistanceKm.toFixed(1)} km
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 group-hover:bg-white transition-colors">
                                                    <Clock size={14} className="text-gray-400" />
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        {Math.round(ride.metrics.durationMinutes)} mins
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 group-hover:bg-white transition-colors">
                                                    <Users size={14} className="text-gray-400" />
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        {ride.seats.available}/{ride.seats.total} seats
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions (Col 3) */}
                                        <div className="lg:col-span-3 flex lg:flex-col gap-3 justify-end h-full mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/driver/rides/${ride._id}/edit`); }}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-bold rounded-xl hover:bg-[var(--color-primary)] hover:text-white transition-all border border-[var(--color-primary)]/10"
                                            >
                                                <Edit size={18} /> Edit
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); console.log("Cancel", ride._id); }}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-100"
                                            >
                                                <Trash2 size={18} /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
