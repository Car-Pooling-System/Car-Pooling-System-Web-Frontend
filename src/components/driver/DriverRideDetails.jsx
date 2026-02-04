import {
    GoogleMap,
    Polyline,
    useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useState, useMemo } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";

/* ---------- CONFIG ---------- */
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

/* ---------- SEAT ---------- */
function Seat({ booked }) {
    return (
        <div
            className={`w-8 h-8 rounded transition-all duration-500 ${booked ? "bg-red-500 animate-pulse" : "bg-green-500"
                }`}
        />
    );
}

export default function DriverRideDetails() {
    const { rideId } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    /* ---------- GOOGLE MAPS LOADER ---------- */
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: MAP_LIBRARIES,
    });

    /* ---------- STATE ---------- */
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* ---------- FETCH RIDE ---------- */
    useEffect(() => {
        const fetchRide = async () => {
            try {
                console.log("FETCHING RIDE DETAILS:", rideId);

                const res = await axios.get(
                    `${BACKEND_URL}/api/rides/${rideId}`
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
    }, [rideId]);

    /* ---------- DERIVED ---------- */
    const path = useMemo(() => {
        if (!ride?.route?.encodedPolyline) return [];
        return decodePolyline(ride.route.encodedPolyline);
    }, [ride]);

    const canEdit = ride?.passengers?.length === 0;

    /* ---------- ROLE GUARD ---------- */
    if (user?.unsafeMetadata?.role !== "driver") {
        return <Navigate to="/home" />;
    }

    /* ---------- UI STATES ---------- */
    if (loading) return <p className="p-6">Loading ride details…</p>;
    if (error) return <p className="p-6 text-red-500">{error}</p>;
    if (!ride || !ride.route) {
        return (
            <p className="p-6 text-red-500">
                Ride data is malformed or missing
            </p>
        );
    }

    if (!isLoaded) {
        return <p className="p-6">Loading map…</p>;
    }

    const { route, schedule, metrics, seats, preferences, passengers } = ride;

    /* ---------- CANCEL ---------- */
    const cancelRide = async () => {
        if (!canEdit) {
            alert("Cannot cancel a ride with passengers");
            return;
        }

        if (!confirm("Are you sure you want to cancel this ride?")) return;

        try {
            console.log("CANCELLING RIDE:", ride._id);

            await axios.patch(
                `${BACKEND_URL}/api/rides/${ride._id}/cancel`
            );

            alert("Ride cancelled");
            navigate("/driver/rides");
        } catch (err) {
            console.error("CANCEL FAILED:", err);
            alert("Failed to cancel ride");
        }
    };

    /* ---------- RENDER ---------- */
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* HEADER */}
            <h1 className="text-2xl font-bold">
                {route.start.name} → {route.end.name}
            </h1>

            {/* META */}
            <div className="bg-gray-100 p-4 rounded space-y-1">
                <p>🕒 {new Date(schedule.departureTime).toLocaleString()}</p>
                <p>📏 {metrics.totalDistanceKm.toFixed(1)} km</p>
                <p>⏱ {Math.round(metrics.durationMinutes)} mins</p>
            </div>

            {/* MAP */}
            <GoogleMap
                mapContainerStyle={{ height: 350, width: "100%" }}
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
            </GoogleMap>

            {/* SEATS */}
            <div>
                <h3 className="font-semibold mb-2">Seats</h3>
                <div className="flex gap-4">
                    {[...Array(seats.total)].map((_, i) => (
                        <Seat key={i} booked={i >= seats.available} />
                    ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                    🟢 Available · 🔴 Booked
                </p>
            </div>

            {/* PREFERENCES */}
            <div>
                <h3 className="font-semibold">Preferences</h3>
                <ul className="list-disc ml-6 text-sm">
                    <li>Pets: {preferences.petsAllowed ? "Allowed" : "Not allowed"}</li>
                    <li>Smoking: {preferences.smokingAllowed ? "Allowed" : "Not allowed"}</li>
                    <li>Max 2 in back: {preferences.max2Allowed ? "Yes" : "No"}</li>
                </ul>
            </div>

            {/* PASSENGERS */}
            <div>
                <h3 className="font-semibold">Passengers</h3>
                {passengers.length === 0 ? (
                    <p className="text-sm text-gray-500">No passengers yet</p>
                ) : (
                    passengers.map((p, i) => (
                        <div key={i} className="border p-3 rounded mb-2">
                            <p className="font-medium">{p.name}</p>
                            <p className="text-sm">₹{p.farePaid}</p>
                            <p className="text-sm">{p.status}</p>
                        </div>
                    ))
                )}
            </div>

            {/* ACTIONS */}
            <div className="flex gap-4 pt-6">
                <button
                    disabled={!canEdit}
                    className={`px-4 py-2 rounded ${canEdit
                        ? "bg-gray-800 text-white"
                        : "bg-gray-300 cursor-not-allowed"
                        }`}
                >
                    Edit Route
                </button>

                <button
                    onClick={cancelRide}
                    className="px-4 py-2 bg-red-600 text-white rounded"
                >
                    Cancel Ride
                </button>
            </div>
        </div>
    );
}
