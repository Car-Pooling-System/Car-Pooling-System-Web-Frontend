import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { Navigate, useNavigate } from "react-router-dom";
import { MapPin, Clock, Navigation, Users, Edit, Trash2, ArrowRight, Car, AlertCircle } from "lucide-react";

export default function DriverRides() {
    const { user } = useUser();
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-gray-600 font-medium">Loading your rides...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Car className="text-white" size={28} />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-800">My Rides</h1>
                    </div>
                    <p className="text-gray-600 ml-11">Manage and track all your published rides</p>
                </div>

                {/* Empty State */}
                {rides.length === 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-blue-100 p-4 rounded-full">
                                <Navigation className="text-blue-600" size={40} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Rides Yet</h2>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            You haven't created any rides yet. Start by creating your first ride to share with passengers.
                        </p>
                        <button
                            onClick={() => navigate("/driver/create-ride")}
                            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
                        >
                            Create Ride
                        </button>
                    </div>
                )}

                {/* Rides List */}
                <div className="space-y-4">
                    {rides.map((ride) => {
                        const departureDate = new Date(ride.schedule.departureTime);
                        const isUpcoming = departureDate > new Date();

                        return (
                            <div
                                key={ride._id}
                                onClick={() => navigate(`/driver/rides/${ride._id}`)}
                                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer border-l-4 border-blue-600 overflow-hidden"
                            >
                                <div className="p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition">
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                        {/* Route Information */}
                                        <div className="lg:col-span-2">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MapPin className="text-blue-600" size={18} />
                                                        <span className="text-sm text-gray-600">Route</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-semibold text-gray-800 text-lg">
                                                            {ride.route.start.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-gray-500">
                                                            <ArrowRight size={16} />
                                                            <p className="text-sm">{ride.route.end.name}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {isUpcoming && (
                                                    <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                                        Upcoming
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Trip Details */}
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Clock className="text-orange-500" size={16} />
                                                    <span className="text-xs text-gray-600 font-medium">Departure</span>
                                                </div>
                                                <p className="font-semibold text-gray-800">
                                                    {departureDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {departureDate.toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Metrics */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                                                <p className="text-xs text-gray-700 font-medium mb-1">Distance</p>
                                                <p className="text-2xl font-bold text-blue-600">
                                                    {ride.metrics.totalDistanceKm.toFixed(1)}
                                                </p>
                                                <p className="text-xs text-gray-600">km</p>
                                            </div>

                                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                                                <p className="text-xs text-gray-700 font-medium mb-1">Duration</p>
                                                <p className="text-2xl font-bold text-purple-600">
                                                    {Math.round(ride.metrics.durationMinutes)}
                                                </p>
                                                <p className="text-xs text-gray-600">mins</p>
                                            </div>

                                            <div className="col-span-2 bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                                                <div className="flex items-center gap-2">
                                                    <Users className="text-green-600" size={16} />
                                                    <div>
                                                        <p className="text-xs text-gray-700 font-medium">Available Seats</p>
                                                        <p className="text-lg font-bold text-green-600">
                                                            {ride.seats.available}/{ride.seats.total}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div
                                        className="mt-6 pt-6 border-t border-gray-200 flex gap-3 justify-end"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={() => navigate(`/driver/rides/${ride._id}/edit`)}
                                            className="flex items-center gap-2 px-6 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition border-2 border-blue-300"
                                        >
                                            <Edit size={18} />
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => console.log("CANCEL RIDE ID:", ride._id)}
                                            className="flex items-center gap-2 px-6 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition border-2 border-red-300"
                                        >
                                            <Trash2 size={18} />
                                            Cancel
                                        </button>
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
