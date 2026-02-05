import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
    GoogleMap,
    Polyline,
    Marker,
    useJsApiLoader,
} from "@react-google-maps/api";
import {
    Car,
    MapPin,
    Calendar,
    Clock,
    User as UserIcon,
    Phone,
    Star,
    AlertCircle,
    CheckCircle,
    ArrowLeft
} from "lucide-react";

const MAP_LIBRARIES = [];

/* ---------- POLYLINE DECODER ---------- */
const decodePolyline = (encoded) => {
    let points = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lat += result & 1 ? ~(result >> 1) : result >> 1;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lng += result & 1 ? ~(result >> 1) : result >> 1;

        points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return points;
};

export default function RiderRideDetails() {
    const { rideId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useUser();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    /* ---------- ROLE GUARD ---------- */
    if (user?.unsafeMetadata?.role !== "rider") {
        return <Navigate to="/home" />;
    }

    /* ---------- GOOGLE MAPS LOADER ---------- */
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: MAP_LIBRARIES,
    });

    /* ---------- STATE ---------- */
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [booking, setBooking] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [clashWarning, setClashWarning] = useState(null);
    const [existingRides, setExistingRides] = useState([]);

    // Get pickup/drop from navigation state
    const pickup = location.state?.pickup;
    const drop = location.state?.drop;
    const estimatedFare = location.state?.estimatedFare;

    /* ---------- FETCH RIDE ---------- */
    useEffect(() => {
        const fetchRide = async () => {
            try {
                console.log("FETCHING RIDE DETAILS:", rideId);

                const params = {};
                if (pickup) {
                    params.pickupLat = pickup.lat;
                    params.pickupLng = pickup.lng;
                }
                if (drop) {
                    params.dropLat = drop.lat;
                    params.dropLng = drop.lng;
                }

                const res = await axios.get(
                    `${BACKEND_URL}/api/rides/${rideId}`,
                    { params }
                );

                console.log("RAW RIDE RESPONSE:", res.data);
                setRide(res.data.ride);
                // Also update estimate if returned from backend
                if (res.data.estimate) {
                    // Update state or just rely on the ride object
                }
            } catch (err) {
                console.error("FETCH FAILED:", err);
                setError("Failed to load ride details");
            } finally {
                setLoading(false);
            }
        };

        fetchRide();
    }, [rideId, BACKEND_URL]);

    /* ---------- FETCH EXISTING RIDER BOOKINGS ---------- */
    useEffect(() => {
        const fetchExistingRides = async () => {
            try {
                const res = await axios.get(
                    `${BACKEND_URL}/api/rider/rider-rides/${user.id}`
                );
                setExistingRides(res.data);
                console.log("EXISTING RIDER BOOKINGS:", res.data);
            } catch (err) {
                console.error("FETCH EXISTING RIDES ERROR:", err);
            }
        };

        if (user?.id) {
            fetchExistingRides();
        }
    }, [user?.id, BACKEND_URL]);

    /* ---------- CHECK FOR CLASHES ---------- */
    const checkForClashes = () => {
        if (!ride || existingRides.length === 0) return null;

        const newRideStart = new Date(ride.schedule.departureTime);
        const newRideEnd = new Date(ride.schedule.arrivalTime);

        for (const booking of existingRides) {
            if (!booking.ride || booking.status !== "confirmed") continue;

            const existingStart = new Date(booking.ride.schedule.departureTime);
            const existingEnd = new Date(booking.ride.schedule.arrivalTime);

            // Check if times overlap
            if (
                (newRideStart >= existingStart && newRideStart <= existingEnd) ||
                (newRideEnd >= existingStart && newRideEnd <= existingEnd) ||
                (newRideStart <= existingStart && newRideEnd >= existingEnd)
            ) {
                return {
                    clashing: true,
                    ride: booking.ride,
                    message: `This ride conflicts with your existing booking from ${booking.ride.route.start.name} to ${booking.ride.route.end.name} on ${new Date(booking.ride.schedule.departureTime).toLocaleString()}`
                };
            }
        }

        return null;
    };

    /* ---------- CHECK IF ALREADY BOOKED ---------- */
    const checkIfAlreadyBooked = () => {
        if (!ride || existingRides.length === 0) return false;

        return existingRides.some(booking =>
            booking.ride && booking.ride._id === ride._id && booking.status === "confirmed"
        );
    };

    const checkIfCancelled = () => {
        if (!ride || existingRides.length === 0) return false;

        return existingRides.some(booking =>
            booking.ride && booking.ride._id === ride._id && booking.status === "cancelled"
        );
    };

    const bookRide = async () => {
        if (!pickup || !drop) {
            alert("Pickup and drop locations are required");
            return;
        }

        // Check if already booked
        if (checkIfAlreadyBooked()) {
            alert("❌ You have already booked this ride. Please check 'My Rides' to view your booking.");
            return;
        }

        // Check for clashes
        const clash = checkForClashes();
        if (clash) {
            alert(`❌ BOOKING BLOCKED\n\n${clash.message}\n\nPlease cancel your existing booking first or choose a different ride.`);
            return;
        }

        try {
            setBooking(true);

            const payload = {
                user: {
                    userId: user.id,
                    name: user.fullName,
                    profileImage: user.imageUrl,
                },
                pickup: {
                    lat: pickup.lat,
                    lng: pickup.lng,
                },
                drop: {
                    lat: drop.lat,
                    lng: drop.lng,
                },
            };

            console.log("BOOKING RIDE:", payload);

            const res = await axios.post(
                `${BACKEND_URL}/api/rides/${rideId}/book`,
                payload
            );

            console.log("BOOKING RESPONSE:", res.data);

            alert(`✅ Ride booked successfully! Fare: ₹${res.data.farePaid}`);
            navigate("/home");
        } catch (err) {
            console.error("BOOKING ERROR:", err);
            alert(err.response?.data?.message || "Failed to book ride");
        } finally {
            setBooking(false);
        }
    };

    /* ---------- CANCEL BOOKING ---------- */
    const cancelBooking = async () => {
        const confirmCancel = window.confirm(
            "Are you sure you want to cancel this booking?\n\nYour seat will be released and made available to other riders."
        );

        if (!confirmCancel) return;

        try {
            setCancelling(true);

            const res = await axios.post(
                `${BACKEND_URL}/api/rides/${rideId}/cancel`,
                { userId: user.id }
            );

            console.log("CANCEL RESPONSE:", res.data);

            alert(`✅ Booking cancelled successfully!\nRefund amount: ₹${res.data.refundAmount}`);

            // Refresh the page to update the booking status
            window.location.reload();
        } catch (err) {
            console.error("CANCEL ERROR:", err);
            alert(err.response?.data?.message || "Failed to cancel booking");
        } finally {
            setCancelling(false);
        }
    };

    /* ---------- DERIVED ---------- */
    const path = ride?.route?.encodedPolyline ? decodePolyline(ride.route.encodedPolyline) : [];

    /* ---------- UI STATES ---------- */
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg text-gray-600">Loading ride details…</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-red-500 text-lg">{error}</p>
        </div>
    );

    if (!ride || !ride.route) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-500 text-lg">
                    Ride data is malformed or missing
                </p>
            </div>
        );
    }

    if (!isLoaded) {
        return <p className="p-6">Loading map…</p>;
    }

    const { route, schedule, metrics, seats, preferences, driver } = ride;
    const clash = checkForClashes();
    const alreadyBooked = checkIfAlreadyBooked();
    const isCancelled = checkIfCancelled();

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to search results
                </button>

                {/* Already Booked Warning */}
                {alreadyBooked && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-red-800 mb-1">
                                    ❌ Already Booked
                                </h3>
                                <p className="text-red-700 text-sm">
                                    You have already booked this ride. Check "My Rides" to view your booking.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Clash Warning */}
                {!alreadyBooked && clash && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-red-800 mb-1">
                                    ❌ Schedule Conflict
                                </h3>
                                <p className="text-red-700 text-sm">
                                    {clash.message}
                                </p>
                                <p className="text-red-600 text-xs mt-2">
                                    Please cancel your existing booking first or choose a different ride.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Ride Overview */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-2xl font-bold text-gray-800">Ride Details</h1>
                                <div className="text-3xl font-bold text-blue-600">
                                    ₹{estimatedFare || ride.pricing?.baseFare || '---'}<span className="text-lg font-normal">.00</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600 mb-6">
                                <Calendar className="w-5 h-5" />
                                <span className="font-medium">{formatDate(schedule.departureTime)}</span>
                            </div>

                            {/* Route Timeline */}
                            <div className="space-y-6">
                                {/* Start Point */}
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                                        <div className="w-0.5 h-16 bg-gray-300"></div>
                                    </div>
                                    <div className="flex-1 -mt-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xl font-bold">{formatTime(schedule.departureTime)}</span>
                                            <span className="text-sm text-gray-500">Departure</span>
                                        </div>
                                        <p className="font-semibold text-gray-800">{route.start.name}</p>
                                    </div>
                                </div>

                                {/* Pickup Point (if different from start) */}
                                {pickup && pickup.name !== route.start.name && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow"></div>
                                            <div className="w-0.5 h-16 bg-gray-300"></div>
                                        </div>
                                        <div className="flex-1 -mt-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-green-600">Your Pickup</span>
                                            </div>
                                            <p className="font-medium text-gray-700">{pickup.name}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Drop Point (if different from end) */}
                                {drop && drop.name !== route.end.name && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow"></div>
                                            <div className="w-0.5 h-16 bg-gray-300"></div>
                                        </div>
                                        <div className="flex-1 -mt-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-red-600">Your Drop-off</span>
                                            </div>
                                            <p className="font-medium text-gray-700">{drop.name}</p>
                                        </div>
                                    </div>
                                )}

                                {/* End Point */}
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                                    </div>
                                    <div className="flex-1 -mt-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xl font-bold">{formatTime(schedule.arrivalTime)}</span>
                                            <span className="text-sm text-gray-500">Arrival</span>
                                        </div>
                                        <p className="font-semibold text-gray-800">{route.end.name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Trip Info */}
                            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="w-5 h-5" />
                                    <span>{metrics.totalDistanceKm.toFixed(1)} km</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-5 h-5" />
                                    <span>{Math.round(metrics.durationMinutes)} mins</span>
                                </div>
                            </div>
                        </div>

                        {/* Map */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <GoogleMap
                                mapContainerStyle={{ height: 400, width: "100%" }}
                                zoom={6}
                                center={path[0] || { lat: 13.0827, lng: 80.2707 }}
                            >
                                {path.length > 0 && (
                                    <Polyline
                                        path={path}
                                        options={{
                                            strokeColor: "#2563eb",
                                            strokeOpacity: 0.9,
                                            strokeWeight: 5,
                                        }}
                                    />
                                )}
                                {pickup && (
                                    <Marker
                                        position={{ lat: pickup.lat, lng: pickup.lng }}
                                        icon={{
                                            path: window.google.maps.SymbolPath.CIRCLE,
                                            scale: 8,
                                            fillColor: "#10b981",
                                            fillOpacity: 1,
                                            strokeColor: "#ffffff",
                                            strokeWeight: 2,
                                        }}
                                    />
                                )}
                                {drop && (
                                    <Marker
                                        position={{ lat: drop.lat, lng: drop.lng }}
                                        icon={{
                                            path: window.google.maps.SymbolPath.CIRCLE,
                                            scale: 8,
                                            fillColor: "#ef4444",
                                            fillOpacity: 1,
                                            strokeColor: "#ffffff",
                                            strokeWeight: 2,
                                        }}
                                    />
                                )}
                            </GoogleMap>
                        </div>
                    </div>

                    {/* Right Column - Driver & Booking */}
                    <div className="space-y-6">
                        {/* Driver Info */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-lg font-bold mb-4">Driver</h2>
                            <div className="flex items-center gap-4 mb-4">
                                <img
                                    src={driver.profileImage}
                                    alt={driver.name}
                                    className="w-16 h-16 rounded-full border-2 border-gray-200"
                                />
                                <div>
                                    <p className="font-bold text-lg">{driver.name}</p>
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        <span>{driver.rating || '4.9'} · 30 ratings</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span>Verified Profile</span>
                                </div>
                            </div>
                        </div>


                        {/* Passengers List */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-lg font-bold mb-4">
                                Passengers ({ride.passengers.filter(p => p.status === "confirmed").length}/{seats.total})
                            </h2>
                            {ride.passengers.filter(p => p.status === "confirmed").length > 0 ? (
                                <div className="space-y-3">
                                    {ride.passengers
                                        .filter(p => p.status === "confirmed")
                                        .map((passenger, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <img
                                                    src={passenger.profileImage}
                                                    alt={passenger.name}
                                                    className="w-10 h-10 rounded-full border border-gray-200"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm">{passenger.name}</p>
                                                    <p className="text-xs text-gray-500">Seat booked</p>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No passengers yet. Be the first to book!</p>
                            )}
                        </div>

                        {/* Preferences */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-lg font-bold mb-4">Ride Preferences</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Pets</span>
                                    <span className="font-semibold">
                                        {preferences.petsAllowed ? "✅ Allowed" : "❌ Not allowed"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Smoking</span>
                                    <span className="font-semibold">
                                        {preferences.smokingAllowed ? "✅ Allowed" : "❌ Not allowed"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Max 2 in back</span>
                                    <span className="font-semibold">
                                        {preferences.max2Allowed ? "✅ Yes" : "❌ No"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t">
                                    <span className="text-gray-600">Available seats</span>
                                    <span className="font-bold text-lg">
                                        {seats.available} / {seats.total}
                                    </span>
                                </div>
                            </div>
                        </div>


                        {/* Booking/Cancel Button Section */}
                        {alreadyBooked ? (
                            <button
                                onClick={cancelBooking}
                                disabled={cancelling}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                {cancelling ? "Cancelling..." : "Cancel Booking"}
                            </button>
                        ) : isCancelled ? (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                                <p className="text-red-700 font-semibold italic">
                                    ❌ This booking was cancelled.
                                </p>
                                <p className="text-red-600 text-xs mt-1">
                                    If you want to re-book, please search again from the home page.
                                </p>
                            </div>
                        ) : pickup && drop ? (
                            <button
                                onClick={bookRide}
                                disabled={booking || seats.available === 0 || !!clash}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                {booking
                                    ? "Booking..."
                                    : clash
                                        ? "Booking Blocked - Schedule Conflict"
                                        : seats.available === 0
                                            ? "No Seats Available"
                                            : "Request to Book"
                                }
                            </button>
                        ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                                <p className="text-gray-600 text-sm">
                                    To book this ride, please search from the search page with your pickup and drop locations.
                                </p>
                            </div>
                        )}

                        {(alreadyBooked || clash) && (
                            <p className="text-xs text-center text-red-600 mt-2">
                                {alreadyBooked
                                    ? "✓ You've already booked this ride"
                                    : "⚠️ This ride conflicts with your existing booking"
                                }
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
