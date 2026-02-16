import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
    Car,
    Calendar,
    ArrowRight,
    Clock,
    MapPin,
    AlertCircle,
    ChevronRight
} from "lucide-react";

export default function RiderRides() {
    const { user } = useUser();
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    /* ---------- ROLE GUARD ---------- */
    if (user?.unsafeMetadata?.role !== "rider") {
        return <Navigate to="/home" />;
    }

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                const res = await axios.get(
                    `${BACKEND_URL}/api/rider/rider-rides/${user.id}`
                );
                console.log("RIDER BOOKINGS:", res.data);
                setBookings(res.data);
            } catch (err) {
                console.error("FETCH BOOKINGS ERROR:", err);
                setError("Failed to load your rides. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchBookings();
        }
    }, [user?.id, BACKEND_URL]);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const calculateArrivalTime = (departureTime, durationMinutes) => {
        if (!durationMinutes) return null;
        const departure = new Date(departureTime);
        const arrival = new Date(departure.getTime() + durationMinutes * 60000);
        return arrival;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your rides...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Rides</h1>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {bookings.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No upcoming rides</h3>
                            <p className="text-gray-500 mb-6">You haven't booked any rides yet.</p>
                            <button
                                onClick={() => navigate("/rides/search")}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition"
                            >
                                Search for a Ride
                            </button>
                        </div>
                    ) : (
                        bookings.map((booking) => (
                            <div
                                key={booking.bookingId}
                                onClick={() => navigate(`/rides/${booking.ride._id}/details`)}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer overflow-hidden"
                            >
                                <div className="p-5 flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                {booking.status === "confirmed" ? "Upcoming" : booking.status}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(booking.ride.schedule.departureTime)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-6">
                                            <div className="space-y-1">
                                                <div className="text-xl font-bold text-gray-900">
                                                    {formatTime(booking.ride.schedule.departureTime)}
                                                </div>
                                                <div className="text-gray-600 text-sm font-medium">
                                                    {booking.ride.route.start.name}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center pt-2">
                                                <ArrowRight className="w-5 h-5 text-gray-300" />
                                            </div>

                                            <div className="space-y-1">
                                                <div className="text-xl font-bold text-gray-900">
                                                    {booking.ride.metrics?.durationMinutes
                                                        ? formatTime(calculateArrivalTime(
                                                            booking.ride.schedule.departureTime,
                                                            booking.ride.metrics.durationMinutes
                                                        ))
                                                        : '---'
                                                    }
                                                </div>
                                                <div className="text-gray-600 text-sm font-medium">
                                                    {booking.ride.route.end.name}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={booking.ride.driver.profileImage}
                                                    alt={booking.ride.driver.name}
                                                    className="w-10 h-10 rounded-full border border-gray-100"
                                                />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{booking.ride.driver.name}</p>
                                                    <p className="text-xs text-gray-500">Driver</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-blue-600">₹{booking.farePaid}.00</p>
                                                <p className="text-xs text-gray-400">Paid Amount</p>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-gray-300 ml-4" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
