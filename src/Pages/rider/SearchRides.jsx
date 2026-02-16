import { useRef, useState } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
    LoadScript,
    Autocomplete,
} from "@react-google-maps/api";
import { Car, User, MapPin, Calendar } from "lucide-react";

const MAP_LIBRARIES = ["places"];

export default function SearchRides() {
    const { user } = useUser();
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    /* ---------- ROLE GUARD ---------- */
    if (user?.unsafeMetadata?.role !== "rider") {
        return <Navigate to="/home" />;
    }

    const pickupRef = useRef(null);
    const dropRef = useRef(null);

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pickupLocation, setPickupLocation] = useState(null);
    const [dropLocation, setDropLocation] = useState(null);

    const searchRides = async () => {
        const pickup = pickupRef.current?.getPlace?.();
        const drop = dropRef.current?.getPlace?.();

        if (!pickup?.geometry || !drop?.geometry) {
            alert("Select valid locations");
            return;
        }

        // Store locations for passing to details page
        setPickupLocation({
            lat: pickup.geometry.location.lat(),
            lng: pickup.geometry.location.lng(),
            name: pickup.name || pickup.formatted_address,
        });

        setDropLocation({
            lat: drop.geometry.location.lat(),
            lng: drop.geometry.location.lng(),
            name: drop.name || drop.formatted_address,
        });

        const params = {
            pickupLat: pickup.geometry.location.lat(),
            pickupLng: pickup.geometry.location.lng(),
            dropLat: drop.geometry.location.lat(),
            dropLng: drop.geometry.location.lng(),
        };

        console.log("SEARCHING RIDES WITH PARAMS:", params);

        try {
            setLoading(true);
            const res = await axios.get(
                `${BACKEND_URL}/api/rides/search`,
                { params }
            );
            console.log("SEARCH RESULTS FROM BACKEND:", res.data);
            setResults(res.data);
        } catch (error) {
            console.error("SEARCH ERROR:", error.response?.data || error.message);
            alert("Failed to search rides. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    return (
        <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={MAP_LIBRARIES}
        >
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Search Header */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <h1 className="text-3xl font-bold mb-6">Find a Ride</h1>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                <Autocomplete
                                    onLoad={(a) => (pickupRef.current = a)}
                                    className="flex-1"
                                >
                                    <input
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Leaving from..."
                                    />
                                </Autocomplete>
                            </div>

                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-green-600" />
                                <Autocomplete
                                    onLoad={(a) => (dropRef.current = a)}
                                    className="flex-1"
                                >
                                    <input
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Going to..."
                                    />
                                </Autocomplete>
                            </div>

                            <button
                                onClick={searchRides}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Searching..." : "Search"}
                            </button>
                        </div>
                    </div>

                    {/* Results Header */}
                    {results.length > 0 && (
                        <div className="mb-4">
                            <p className="text-lg font-semibold text-gray-700">
                                {results.length} ride{results.length !== 1 ? 's' : ''} available
                            </p>
                        </div>
                    )}

                    {/* Results List */}
                    <div className="space-y-4">
                        {results.map((ride) => (
                            <div
                                key={ride.id}
                                onClick={() => navigate(`/rides/${ride.id}/details`, {
                                    state: {
                                        pickup: pickupLocation,
                                        drop: dropLocation,
                                        estimatedFare: ride.estimate.fare
                                    }
                                })}
                                className="bg-white rounded-xl shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden"
                            >
                                <div className="p-6">
                                    {/* Date Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm font-medium">
                                                {formatDate(ride.schedule.departureTime)}
                                            </span>
                                        </div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            ₹{ride.estimate.fare}<span className="text-sm font-normal">.00</span>
                                        </div>
                                    </div>

                                    {/* Route Timeline */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl font-bold">
                                                    {formatTime(ride.schedule.departureTime)}
                                                </span>
                                                <div className="flex-1 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                                    <div className="flex-1 h-px bg-gray-300"></div>
                                                    <Car className="w-4 h-4 text-gray-400" />
                                                    <div className="flex-1 h-px bg-gray-300"></div>
                                                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                                </div>
                                                <span className="text-xl font-bold">
                                                    {formatTime(ride.schedule.arrivalTime)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {pickupLocation?.name || 'Pickup'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {ride.estimate.distanceKm?.toFixed(1) || '---'} km
                                                </span>
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {dropLocation?.name || 'Drop-off'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Driver Info & Details */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={ride.driver.profileImage}
                                                alt={ride.driver.name}
                                                className="w-12 h-12 rounded-full border-2 border-gray-200"
                                            />
                                            <div>
                                                <p className="font-semibold text-gray-800">{ride.driver.name}</p>
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    <span>⭐ {ride.driver.rating || '4.9'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            {ride.preferences.petsAllowed && (
                                                <span className="flex items-center gap-1">
                                                    🐾 Pets OK
                                                </span>
                                            )}
                                            {ride.preferences.max2Allowed && (
                                                <span className="flex items-center gap-1">
                                                    👥 Max 2 in back
                                                </span>
                                            )}
                                            <span className="font-semibold text-gray-700">
                                                💺 {ride.seatsAvailable} seat{ride.seatsAvailable !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {!loading && results.length === 0 && pickupLocation && (
                        <div className="bg-white rounded-xl shadow-md p-12 text-center">
                            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                No rides found
                            </h3>
                            <p className="text-gray-500">
                                Try adjusting your search criteria or check back later
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </LoadScript>
    );
}