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
    Star,
    AlertCircle,
    CheckCircle,
    ArrowLeft,
    Users,
    Cigarette,
    PawPrint,
    User as UserIcon,
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

        if (checkIfAlreadyBooked()) {
            alert("❌ You have already booked this ride. Please check 'My Rides' to view your booking.");
            return;
        }

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
                pickup: { lat: pickup.lat, lng: pickup.lng },
                drop: { lat: drop.lat, lng: drop.lng },
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
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
            <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-muted)] flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Car className="w-8 h-8 text-[var(--color-primary)]" />
                </div>
                <div className="w-8 h-8 border-2 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[var(--color-text-secondary)] font-medium">Loading ride details…</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
            <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-[var(--color-text-primary)] font-semibold">{error}</p>
            </div>
        </div>
    );

    if (!ride || !ride.route) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
                <p className="text-red-500 font-semibold">Ride data is malformed or missing</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
                <p className="text-[var(--color-text-secondary)]">Loading map…</p>
            </div>
        );
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
        <div className="min-h-screen font-[var(--font-family)] bg-[var(--color-bg)] antialiased">

            {/* ===== HEADER BAR ===== */}
            <div className="bg-white/80 backdrop-blur-md border-b border-[var(--color-border)] sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[var(--color-primary)] hover:text-[var(--color-primary-light)] font-semibold transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-muted)] flex items-center justify-center group-hover:bg-[var(--color-primary)] transition-colors">
                            <ArrowLeft className="w-4 h-4 text-[var(--color-primary)] group-hover:text-white transition-colors" />
                        </div>
                        Back to search results
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Warnings */}
                {alreadyBooked && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-800 mb-1">Already Booked</h3>
                            <p className="text-red-700 text-sm">You have already booked this ride. Check "My Rides" to view your booking.</p>
                        </div>
                    </div>
                )}

                {!alreadyBooked && clash && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-800 mb-1">Schedule Conflict</h3>
                            <p className="text-amber-700 text-sm">{clash.message}</p>
                            <p className="text-amber-600 text-xs mt-1">Please cancel your existing booking first or choose a different ride.</p>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* ===== LEFT COLUMN ===== */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* ---- Ride Overview Card ---- */}
                        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                            {/* Gradient top bar */}
                            <div className="h-1 bg-gradient-to-r from-[var(--color-primary)] to-[#06b6d4]" />

                            <div className="p-6">
                                {/* Title + Fare */}
                                <div className="flex items-start justify-between mb-5">
                                    <div>
                                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Ride Details</h1>
                                        <div className="flex items-center gap-2 mt-2 text-[var(--color-text-secondary)]">
                                            <div className="w-6 h-6 rounded-md bg-[var(--color-primary-muted)] flex items-center justify-center">
                                                <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                                            </div>
                                            <span className="text-sm font-semibold">{formatDate(schedule.departureTime)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wide mb-1">Estimated Fare</p>
                                        <div className="flex items-baseline gap-0.5 justify-end">
                                            <span className="text-sm font-semibold text-[var(--color-primary)]">₹</span>
                                            <span className="text-4xl font-extrabold text-[var(--color-primary)]">
                                                {estimatedFare || ride.pricing?.baseFare || '---'}
                                            </span>
                                            <span className="text-base text-[var(--color-text-muted)]">.00</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Route Timeline */}
                                <div className="bg-[var(--color-bg)] rounded-xl p-5 space-y-0">

                                    {/* Start */}
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-4 h-4 rounded-full bg-[var(--color-primary)] ring-4 ring-[var(--color-primary)]/15 flex-shrink-0 mt-1" />
                                            <div className="w-0.5 h-14 bg-gradient-to-b from-[var(--color-primary)]/40 to-[var(--color-border)]" />
                                        </div>
                                        <div className="pb-4">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xl font-bold text-[var(--color-text-primary)]">{formatTime(schedule.departureTime)}</span>
                                                <span className="text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary-muted)] px-2 py-0.5 rounded-full">Departure</span>
                                            </div>
                                            <p className="font-semibold text-[var(--color-text-primary)] mt-0.5">{route.start.name}</p>
                                        </div>
                                    </div>

                                    {/* Pickup Point (if different from start) */}
                                    {pickup && pickup.name !== route.start.name && (
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15 flex-shrink-0 mt-1" />
                                                <div className="w-0.5 h-14 bg-gradient-to-b from-emerald-300/40 to-[var(--color-border)]" />
                                            </div>
                                            <div className="pb-4">
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Your Pickup</span>
                                                <p className="font-semibold text-[var(--color-text-primary)] mt-1">{pickup.name}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Drop Point (if different from end) */}
                                    {drop && drop.name !== route.end.name && (
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-500/15 flex-shrink-0 mt-1" />
                                                <div className="w-0.5 h-14 bg-gradient-to-b from-rose-300/40 to-[var(--color-border)]" />
                                            </div>
                                            <div className="pb-4">
                                                <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">Your Drop-off</span>
                                                <p className="font-semibold text-[var(--color-text-primary)] mt-1">{drop.name}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* End */}
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-4 h-4 rounded-full bg-[var(--color-primary)] ring-4 ring-[var(--color-primary)]/15 flex-shrink-0 mt-1" />
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xl font-bold text-[var(--color-text-primary)]">{formatTime(schedule.arrivalTime)}</span>
                                                <span className="text-xs font-semibold text-[var(--color-text-muted)] bg-gray-100 px-2 py-0.5 rounded-full">Arrival</span>
                                            </div>
                                            <p className="font-semibold text-[var(--color-text-primary)] mt-0.5">{route.end.name}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Trip Stats */}
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] p-3 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-muted)] flex items-center justify-center">
                                            <MapPin className="w-4.5 h-4.5 text-[var(--color-primary)]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--color-text-muted)] font-medium">Distance</p>
                                            <p className="font-bold text-[var(--color-text-primary)]">{metrics.totalDistanceKm.toFixed(1)} km</p>
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] p-3 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-muted)] flex items-center justify-center">
                                            <Clock className="w-4.5 h-4.5 text-[var(--color-primary)]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--color-text-muted)] font-medium">Duration</p>
                                            <p className="font-bold text-[var(--color-text-primary)]">{Math.round(metrics.durationMinutes)} mins</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ---- Map Card ---- */}
                        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-[var(--color-primary)] to-[#06b6d4]" />
                            <GoogleMap
                                mapContainerStyle={{ height: 380, width: "100%" }}
                                zoom={6}
                                center={path[0] || { lat: 13.0827, lng: 80.2707 }}
                                options={{
                                    disableDefaultUI: false,
                                    zoomControl: true,
                                    streetViewControl: false,
                                    mapTypeControl: false,
                                    styles: [
                                        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
                                    ]
                                }}
                            >
                                {path.length > 0 && (
                                    <Polyline
                                        path={path}
                                        options={{
                                            strokeColor: "#0f766e",
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
                                            scale: 9,
                                            fillColor: "#10b981",
                                            fillOpacity: 1,
                                            strokeColor: "#ffffff",
                                            strokeWeight: 2.5,
                                        }}
                                    />
                                )}
                                {drop && (
                                    <Marker
                                        position={{ lat: drop.lat, lng: drop.lng }}
                                        icon={{
                                            path: window.google.maps.SymbolPath.CIRCLE,
                                            scale: 9,
                                            fillColor: "#ef4444",
                                            fillOpacity: 1,
                                            strokeColor: "#ffffff",
                                            strokeWeight: 2.5,
                                        }}
                                    />
                                )}
                            </GoogleMap>
                        </div>
                    </div>

                    {/* ===== RIGHT COLUMN ===== */}
                    <div className="space-y-5">

                        {/* ---- Driver Card ---- */}
                        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-[var(--color-primary)] to-[#06b6d4]" />
                            <div className="p-5">
                                <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Driver</h2>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="relative">
                                        <img
                                            src={driver.profileImage}
                                            alt={driver.name}
                                            className="w-14 h-14 rounded-full object-cover border-2 border-[var(--color-primary)]/20"
                                        />
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-400 border-2 border-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[var(--color-text-primary)] text-base">{driver.name}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                            <span className="text-sm font-semibold text-[var(--color-text-primary)]">{driver.rating || '4.9'}</span>
                                            <span className="text-xs text-[var(--color-text-muted)]">· 30 ratings</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                    <span className="text-sm font-semibold text-emerald-700">Verified Profile</span>
                                </div>
                            </div>
                        </div>

                        {/* ---- Passengers Card ---- */}
                        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-[var(--color-primary)] to-[#06b6d4]" />
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Passengers</h2>
                                    <span className="text-sm font-bold text-[var(--color-primary)] bg-[var(--color-primary-muted)] border border-[var(--color-primary)]/20 px-2.5 py-1 rounded-full">
                                        {ride.passengers.filter(p => p.status === "confirmed").length}/{seats.total}
                                    </span>
                                </div>
                                {ride.passengers.filter(p => p.status === "confirmed").length > 0 ? (
                                    <div className="space-y-2">
                                        {ride.passengers
                                            .filter(p => p.status === "confirmed")
                                            .map((passenger, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-[var(--color-bg)] rounded-xl p-3 border border-[var(--color-border)]">
                                                    <img
                                                        src={passenger.profileImage}
                                                        alt={passenger.name}
                                                        className="w-9 h-9 rounded-full object-cover border-2 border-[var(--color-primary)]/20"
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-sm text-[var(--color-text-primary)]">{passenger.name}</p>
                                                        <p className="text-xs text-[var(--color-text-muted)]">Seat booked</p>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-muted)] flex items-center justify-center mx-auto mb-2">
                                            <Users className="w-5 h-5 text-[var(--color-primary)]" />
                                        </div>
                                        <p className="text-[var(--color-text-secondary)] text-sm">No passengers yet.</p>
                                        <p className="text-[var(--color-primary)] text-xs font-semibold mt-0.5">Be the first to book!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ---- Preferences Card ---- */}
                        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-[var(--color-primary)] to-[#06b6d4]" />
                            <div className="p-5">
                                <h2 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Ride Preferences</h2>
                                <div className="space-y-2.5">
                                    {/* Pets */}
                                    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
                                        <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                                            <span className="text-base">🐾</span>
                                            <span className="text-sm font-medium">Pets</span>
                                        </div>
                                        {preferences.petsAllowed ? (
                                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">✓ Allowed</span>
                                        ) : (
                                            <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">✗ Not allowed</span>
                                        )}
                                    </div>
                                    {/* Smoking */}
                                    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
                                        <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                                            <span className="text-base">🚬</span>
                                            <span className="text-sm font-medium">Smoking</span>
                                        </div>
                                        {preferences.smokingAllowed ? (
                                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">✓ Allowed</span>
                                        ) : (
                                            <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">✗ Not allowed</span>
                                        )}
                                    </div>
                                    {/* Max 2 in back */}
                                    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
                                        <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                                            <span className="text-base">👥</span>
                                            <span className="text-sm font-medium">Max 2 in back</span>
                                        </div>
                                        {preferences.max2Allowed ? (
                                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">✓ Yes</span>
                                        ) : (
                                            <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">✗ No</span>
                                        )}
                                    </div>
                                    {/* Seats */}
                                    <div className="flex items-center justify-between py-2">
                                        <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                                            <span className="text-base">💺</span>
                                            <span className="text-sm font-medium">Available seats</span>
                                        </div>
                                        <span className="text-sm font-extrabold text-[var(--color-text-primary)]">
                                            {seats.available} / {seats.total}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ---- Booking / Cancel Button ---- */}
                        {alreadyBooked ? (
                            <button
                                onClick={cancelBooking}
                                disabled={cancelling}
                                className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-base shadow-lg shadow-red-600/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {cancelling ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Cancelling...
                                    </span>
                                ) : "Cancel Booking"}
                            </button>
                        ) : isCancelled ? (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
                                <p className="text-red-700 font-semibold">❌ This booking was cancelled.</p>
                                <p className="text-red-600 text-xs mt-1">Search again from the home page to re-book.</p>
                            </div>
                        ) : pickup && drop ? (
                            <button
                                onClick={bookRide}
                                disabled={booking || seats.available === 0 || !!clash}
                                className="w-full py-4 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-bold text-base shadow-lg shadow-[var(--color-primary)]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {booking ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Booking...
                                    </span>
                                ) : clash ? (
                                    "Booking Blocked — Schedule Conflict"
                                ) : seats.available === 0 ? (
                                    "No Seats Available"
                                ) : (
                                    "Request to Book"
                                )}
                            </button>
                        ) : (
                            <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-5 text-center">
                                <p className="text-[var(--color-text-secondary)] text-sm">
                                    To book this ride, please search from the search page with your pickup and drop locations.
                                </p>
                            </div>
                        )}

                        {(alreadyBooked || clash) && (
                            <p className="text-xs text-center text-red-600 -mt-2">
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
