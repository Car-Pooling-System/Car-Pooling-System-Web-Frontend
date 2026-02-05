import { useRef, useState } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
    LoadScript,
    GoogleMap,
    Autocomplete,
    DirectionsRenderer,
} from "@react-google-maps/api";

/* ---------- CONSTANTS ---------- */
const MAP_LIBRARIES = ["places"];
const GRID_SIZE = 0.05; // ~5km

const latLngToGrid = (lat, lng) =>
    `${Math.floor(lat / GRID_SIZE)}_${Math.floor(lng / GRID_SIZE)}`;

const decodePolyline = (encoded) => {
    if (!encoded) return [];

    let points = [];
    let index = 0,
        lat = 0,
        lng = 0;

    while (index < encoded.length) {
        let b,
            shift = 0,
            result = 0;
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

        points.push([lng / 1e5, lat / 1e5]);
    }
    return points;
};

export default function CreateRide() {
    const { user } = useUser();
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    /* ---------- ROLE GUARD ---------- */
    if (user?.unsafeMetadata?.role !== "driver") {
        return <Navigate to="/home" />;
    }

    const startRef = useRef(null);
    const endRef = useRef(null);

    /* ---------- STATE ---------- */
    const [directions, setDirections] = useState(null);
    const [routeData, setRouteData] = useState(null);
    const [departureTime, setDepartureTime] = useState("");
    const [baseFare, setBaseFare] = useState("");

    /* ---------- PREFERENCES ---------- */
    const [petsAllowed, setPetsAllowed] = useState(false);
    const [smokingAllowed, setSmokingAllowed] = useState(false);
    const [max2Allowed, setMax2Allowed] = useState(true);

    /* ---------- ROUTE PREVIEW ---------- */
    const previewRoute = async () => {
        const start = startRef.current?.getPlace?.();
        const end = endRef.current?.getPlace?.();

        if (!start?.geometry || !end?.geometry) {
            alert("Select valid locations from autocomplete");
            return;
        }

        const service = new window.google.maps.DirectionsService();
        const result = await service.route({
            origin: start.formatted_address,
            destination: end.formatted_address,
            travelMode: window.google.maps.TravelMode.DRIVING,
        });

        console.log("GOOGLE ROUTES RAW:", result.routes[0]);

        setDirections(result);

        /* ---------- POLYLINE EXTRACTION (ROBUST) ---------- */
        let encoded = null;

        const poly = result.routes[0].overview_polyline;

        if (typeof poly === "string") {
            encoded = poly;
        } else if (typeof poly?.points === "string") {
            encoded = poly.points;
        }

        console.log("EXTRACTED POLYLINE:", encoded);

        if (!encoded) {
            alert("Google did not return route polyline");
            return;
        }

        const decoded = decodePolyline(encoded);
        console.log("DECODED POINT COUNT:", decoded.length);

        if (!decoded.length) {
            alert("Failed to decode polyline");
            return;
        }

        const grids = [...new Set(
            decoded.map(([lng, lat]) => latLngToGrid(lat, lng))
        )];

        console.log("GRIDS COUNT:", grids.length);

        setRouteData({
            start: {
                name: start.name || start.formatted_address,
                location: {
                    type: "Point",
                    coordinates: [
                        start.geometry.location.lng(),
                        start.geometry.location.lat(),
                    ],
                },
                grid: latLngToGrid(
                    start.geometry.location.lat(),
                    start.geometry.location.lng()
                ),
            },
            end: {
                name: end.name || end.formatted_address,
                location: {
                    type: "Point",
                    coordinates: [
                        end.geometry.location.lng(),
                        end.geometry.location.lat(),
                    ],
                },
                grid: latLngToGrid(
                    end.geometry.location.lat(),
                    end.geometry.location.lng()
                ),
            },
            encodedPolyline: encoded, // ✅ NEVER NULL
            gridsCovered: grids,
            metrics: {
                totalDistanceKm:
                    result.routes[0].legs[0].distance.value / 1000,
                durationMinutes:
                    result.routes[0].legs[0].duration.value / 60,
            },
        });
    };


    /* ---------- ETA ---------- */
    const estimatedArrival = () => {
        if (!departureTime || !routeData) return null;
        const start = new Date(departureTime);
        return new Date(
            start.getTime() + routeData.metrics.durationMinutes * 60000
        ).toLocaleString();
    };

    /* ---------- CREATE RIDE ---------- */
    const createRide = async () => {
        if (!routeData) {
            alert("Preview route first");
            return;
        }

        const payload = {
            driver: {
                userId: user.id,
                name: user.fullName,
                profileImage: user.imageUrl,
            },
            route: routeData,
            schedule: { departureTime },
            pricing: { baseFare: Number(baseFare) },
            seats: { total: 4, available: 4, front: 1, back: 2 },
            preferences: {
                petsAllowed,
                smokingAllowed,
                max2Allowed,
            },
            metrics: routeData.metrics,
        };

        console.log("SENDING RIDE PAYLOAD:", payload);

        try {
            const res = await axios.post(`${BACKEND_URL}/api/rides`, payload);

            console.log("CREATED RIDE ID:", res.data._id);

            alert("Ride published 🚗");


            navigate("/driver/rides");

        } catch (error) {
            console.error("AXIOS ERROR DETAILS:", error.response?.data || error.message);
            alert(`Failed to publish ride: ${error.response?.data?.message || error.message}`);
        }
    };

    /* ---------- UI ---------- */
    return (
        <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={MAP_LIBRARIES}
        >
            <div className="max-w-4xl mx-auto p-6 space-y-4">
                <h1 className="text-2xl font-bold">Publish Ride</h1>

                <div className="grid grid-cols-2 gap-4">
                    <Autocomplete onLoad={(a) => (startRef.current = a)}>
                        <input className="border p-2" placeholder="From" />
                    </Autocomplete>
                    <Autocomplete onLoad={(a) => (endRef.current = a)}>
                        <input className="border p-2" placeholder="To" />
                    </Autocomplete>
                </div>

                <button onClick={previewRoute} className="bg-black text-white px-4 py-2">
                    Preview Route
                </button>

                <GoogleMap
                    mapContainerStyle={{ height: 300, width: "100%" }}
                    center={{
                        lat: routeData?.start.location.coordinates[1] || 13.0827,
                        lng: routeData?.start.location.coordinates[0] || 80.2707,
                    }}
                    zoom={6}
                >
                    {directions && <DirectionsRenderer directions={directions} />}
                </GoogleMap>

                {routeData && (
                    <div className="bg-gray-100 p-3 rounded flex gap-6 text-sm">
                        <span>📏 <b>{routeData.metrics.totalDistanceKm.toFixed(1)} km</b></span>
                        <span>⏱ <b>{Math.round(routeData.metrics.durationMinutes)} mins</b></span>
                    </div>
                )}

                <input
                    type="datetime-local"
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="border p-2 w-full"
                />

                {departureTime && routeData && (
                    <p className="text-sm text-gray-600">
                        🕒 Estimated arrival: <b>{estimatedArrival()}</b>
                    </p>
                )}

                <input
                    type="number"
                    placeholder="Base Fare ₹"
                    onChange={(e) => setBaseFare(e.target.value)}
                    className="border p-2 w-full"
                />

                {/* PREFERENCES */}
                <div className="border p-4 rounded space-y-2">
                    <label className="flex gap-2">
                        <input
                            type="checkbox"
                            checked={petsAllowed}
                            onChange={(e) => setPetsAllowed(e.target.checked)}
                        />
                        Pets allowed
                    </label>

                    <label className="flex gap-2">
                        <input
                            type="checkbox"
                            checked={smokingAllowed}
                            onChange={(e) => setSmokingAllowed(e.target.checked)}
                        />
                        Smoking allowed
                    </label>

                    <label className="flex gap-2">
                        <input
                            type="checkbox"
                            checked={max2Allowed}
                            onChange={(e) => setMax2Allowed(e.target.checked)}
                        />
                        Max 2 passengers in back seat
                    </label>
                </div>

                <button
                    onClick={createRide}
                    className="bg-blue-600 text-white p-3 w-full text-lg"
                >
                    Publish Ride
                </button>
            </div>
        </LoadScript>
    );
}
