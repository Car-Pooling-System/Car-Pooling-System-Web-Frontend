import { useRef, useState, useEffect } from "react";
import axios from "axios";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
    LoadScript,
    GoogleMap,
    Autocomplete,
    DirectionsRenderer,
} from "@react-google-maps/api";
import { MapPin, Clock, DollarSign, Users, Cigarette, PawPrint, Calendar } from "lucide-react";

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

export default function EditRide() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { rideId } = useParams();
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
    const [pricePerKm, setPricePerKm] = useState(10);
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState("09:00");
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    /* ---------- PREFERENCES ---------- */
    const [petsAllowed, setPetsAllowed] = useState(false);
    const [smokingAllowed, setSmokingAllowed] = useState(false);
    const [max2Allowed, setMax2Allowed] = useState(true);

    /* ---------- FETCH RIDE DATA ---------- */
    useEffect(() => {
        const fetchRide = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/api/rides/${rideId}`);
                const ride = res.data.ride;

                // Pre-populate form fields
                setBaseFare(ride.pricing?.baseFare || "");
                setPricePerKm(ride.pricing?.pricePerKm || 10);
                setPetsAllowed(ride.preferences?.petsAllowed || false);
                setSmokingAllowed(ride.preferences?.smokingAllowed || false);
                setMax2Allowed(ride.preferences?.max2Allowed ?? true);

                // Set departure time
                if (ride.schedule?.departureTime) {
                    const depDate = new Date(ride.schedule.departureTime);
                    setSelectedDate(depDate);
                    setSelectedTime(
                        `${String(depDate.getHours()).padStart(2, "0")}:${String(
                            depDate.getMinutes()
                        ).padStart(2, "0")}`
                    );
                    setDepartureTime(ride.schedule.departureTime);
                }

                // Set route data
                setRouteData(ride.route);

                // Create directions object for map preview
                if (ride.route?.encodedPolyline) {
                    setDirections({
                        routes: [
                            {
                                overview_polyline: ride.route.encodedPolyline,
                                legs: [
                                    {
                                        distance: { value: ride.metrics.totalDistanceKm * 1000 },
                                        duration: { value: ride.metrics.durationMinutes * 60 },
                                    },
                                ],
                            },
                        ],
                    });
                }
            } catch (err) {
                console.error("FAILED TO FETCH RIDE:", err);
                alert("Failed to load ride details");
                navigate("/driver/rides");
            } finally {
                setPageLoading(false);
            }
        };

        if (rideId) {
            fetchRide();
        }
    }, [rideId]);

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

        setDirections(result);

        /* ---------- POLYLINE EXTRACTION ---------- */
        let encoded = null;
        const poly = result.routes[0].overview_polyline;

        if (typeof poly === "string") {
            encoded = poly;
        } else if (typeof poly?.points === "string") {
            encoded = poly.points;
        }

        if (!encoded) {
            alert("Google did not return route polyline");
            return;
        }

        const decoded = decodePolyline(encoded);

        if (!decoded.length) {
            alert("Failed to decode polyline");
            return;
        }

        const grids = [...new Set(
            decoded.map(([lng, lat]) => latLngToGrid(lat, lng))
        )];

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
            encodedPolyline: encoded,
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

    /* ---------- CALCULATE TOTAL FARE ---------- */
    const calculateTotalFare = () => {
        if (!routeData) return 0;
        const km = routeData.metrics.totalDistanceKm;
        const base = Number(baseFare) || 0;
        const perKm = Number(pricePerKm) || 0;
        return (base + km * perKm).toFixed(2);
    };

    /* ---------- UPDATE DEPARTURE TIME ---------- */
    const updateDepartureTime = () => {
        if (!selectedDate || !selectedTime) return;
        const [hours, minutes] = selectedTime.split(":");
        const dateTime = new Date(selectedDate);
        dateTime.setHours(parseInt(hours), parseInt(minutes));
        setDepartureTime(dateTime.toISOString());
    };

    /* ---------- CALENDAR HELPERS ---------- */
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(selectedDate);
        const firstDay = getFirstDayOfMonth(selectedDate);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const formatDateDisplay = () => {
        return selectedDate.toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    /* ---------- UPDATE RIDE ---------- */
    const updateRide = async () => {
        if (!routeData) {
            alert("Preview route first");
            return;
        }

        const payload = {
            route: routeData,
            schedule: { departureTime },
            pricing: {
                baseFare: Number(baseFare),
                pricePerKm: Number(pricePerKm),
            },
            preferences: {
                petsAllowed,
                smokingAllowed,
                max2Allowed,
            },
            metrics: routeData.metrics,
        };

        try {
            setLoading(true);
            await axios.put(`${BACKEND_URL}/api/rides/${rideId}`, payload);
            alert("Ride updated successfully! 🚗");
            navigate("/driver/rides");
        } catch (error) {
            console.error("UPDATE ERROR:", error);
            alert(`Failed to update ride: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-gray-600 font-medium">Loading ride details...</p>
                </div>
            </div>
        );
    }

    /* ---------- UI ---------- */
    return (
        <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={MAP_LIBRARIES}
        >
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">Edit Your Ride</h1>
                        <p className="text-gray-600">Update ride details and preferences</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Left Column - Form */}
                        <div className="space-y-6">
                            {/* Route Section */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <MapPin className="text-blue-600" size={24} />
                                    Trip Details
                                </h2>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                From <span className="text-red-500">*</span>
                                            </label>
                                            <Autocomplete onLoad={(a) => (startRef.current = a)}>
                                                <input
                                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
                                                    placeholder={routeData?.start.name || "Starting location"}
                                                />
                                            </Autocomplete>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                To <span className="text-red-500">*</span>
                                            </label>
                                            <Autocomplete onLoad={(a) => (endRef.current = a)}>
                                                <input
                                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
                                                    placeholder={routeData?.end.name || "Destination"}
                                                />
                                            </Autocomplete>
                                        </div>
                                    </div>

                                    <button
                                        onClick={previewRoute}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-md"
                                    >
                                        Preview Route
                                    </button>
                                </div>
                            </div>

                            {/* Map Section */}
                            {routeData && (
                                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                                    <GoogleMap
                                        mapContainerStyle={{ height: 300, width: "100%" }}
                                        center={{
                                            lat: routeData?.start.location.coordinates[1] || 13.0827,
                                            lng: routeData?.start.location.coordinates[0] || 80.2707,
                                        }}
                                        zoom={10}
                                    >
                                        {directions && <DirectionsRenderer directions={directions} />}
                                    </GoogleMap>

                                    {/* Route Stats */}
                                    <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                                        <div className="text-center">
                                            <p className="text-gray-600 text-sm mb-1">Distance</p>
                                            <p className="text-2xl font-bold text-blue-600">
                                                {routeData.metrics.totalDistanceKm.toFixed(1)} km
                                            </p>
                                        </div>
                                        <div className="text-center border-l border-r border-gray-300">
                                            <p className="text-gray-600 text-sm mb-1">Duration</p>
                                            <p className="text-2xl font-bold text-blue-600">
                                                {Math.round(routeData.metrics.durationMinutes)} min
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-gray-600 text-sm mb-1">Estimated Fare</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                ₹{calculateTotalFare()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Schedule Section */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Clock className="text-blue-600" size={24} />
                                    Schedule
                                </h2>

                                {/* Date Picker */}
                                <div className="mb-4">
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Departure Date
                                    </label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowCalendar(!showCalendar)}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-left font-medium text-gray-800 hover:border-blue-500 transition flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50"
                                        >
                                            {formatDateDisplay()}
                                            <Calendar size={20} className="text-blue-600" />
                                        </button>

                                        {/* Custom Calendar */}
                                        {showCalendar && (
                                            <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-20 p-4">
                                                <div className="w-72">
                                                    {/* Month/Year Header */}
                                                    <div className="flex items-center justify-between mb-4">
                                                        <button
                                                            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                                        >
                                                            ←
                                                        </button>
                                                        <p className="font-bold text-gray-800">
                                                            {selectedDate.toLocaleDateString("en-US", {
                                                                month: "long",
                                                                year: "numeric",
                                                            })}
                                                        </p>
                                                        <button
                                                            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                                        >
                                                            →
                                                        </button>
                                                    </div>

                                                    {/* Weekday Headers */}
                                                    <div className="grid grid-cols-7 gap-2 mb-2">
                                                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                                            <div
                                                                key={day}
                                                                className="text-center text-xs font-bold text-gray-600 py-2"
                                                            >
                                                                {day}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Days Grid */}
                                                    <div className="grid grid-cols-7 gap-2">
                                                        {generateCalendarDays().map((day, idx) => {
                                                            const isSelected =
                                                                day === selectedDate.getDate() &&
                                                                selectedDate.getMonth() === selectedDate.getMonth();
                                                            const isToday = day === new Date().getDate();

                                                            return (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => {
                                                                        if (day) {
                                                                            setSelectedDate(
                                                                                new Date(
                                                                                    selectedDate.getFullYear(),
                                                                                    selectedDate.getMonth(),
                                                                                    day
                                                                                )
                                                                            );
                                                                            setShowCalendar(false);
                                                                        }
                                                                    }}
                                                                    className={`p-2 text-sm rounded-lg transition ${!day
                                                                            ? ""
                                                                            : isSelected
                                                                                ? "bg-blue-600 text-white font-bold"
                                                                                : isToday
                                                                                    ? "bg-blue-100 text-blue-600 font-bold"
                                                                                    : "hover:bg-gray-100"
                                                                        }`}
                                                                >
                                                                    {day}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Time Picker */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Departure Time
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="time"
                                            value={selectedTime}
                                            onChange={(e) => {
                                                setSelectedTime(e.target.value);
                                                setDepartureTime("");
                                            }}
                                            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
                                        />
                                        <button
                                            onClick={updateDepartureTime}
                                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                                        >
                                            Set
                                        </button>
                                    </div>
                                </div>

                                {departureTime && (
                                    <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-600 rounded">
                                        <p className="text-sm text-green-800">
                                            ✓ Departure: {new Date(departureTime).toLocaleString()}
                                        </p>
                                        {routeData && (
                                            <p className="text-sm text-green-700 mt-1">
                                                📍 Estimated arrival: {estimatedArrival()}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="space-y-6">
                            {/* Pricing Section */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <DollarSign className="text-green-600" size={20} />
                                    Pricing
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                                            Base Fare ₹
                                        </label>
                                        <input
                                            type="number"
                                            value={baseFare}
                                            onChange={(e) => setBaseFare(e.target.value)}
                                            placeholder="e.g., 100"
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                                            Price per Km ₹
                                        </label>
                                        <input
                                            type="number"
                                            value={pricePerKm}
                                            onChange={(e) => setPricePerKm(e.target.value)}
                                            placeholder="e.g., 10"
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition"
                                        />
                                    </div>

                                    {routeData && (
                                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                                            <p className="text-sm text-gray-600 mb-1">Estimated Total Fare</p>
                                            <p className="text-3xl font-bold text-green-600">₹{calculateTotalFare()}</p>
                                            <p className="text-xs text-gray-600 mt-2">
                                                {routeData.metrics.totalDistanceKm.toFixed(1)} km × ₹{pricePerKm} + ₹{baseFare} base
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Preferences Section */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Users className="text-blue-600" size={20} />
                                    Preferences
                                </h3>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                                        <input
                                            type="checkbox"
                                            checked={petsAllowed}
                                            onChange={(e) => setPetsAllowed(e.target.checked)}
                                            className="w-5 h-5 text-blue-600 rounded"
                                        />
                                        <div className="flex items-start gap-2">
                                            <PawPrint size={18} className="text-orange-500 mt-0.5" />
                                            <span className="font-medium text-gray-800">Pets allowed</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                                        <input
                                            type="checkbox"
                                            checked={smokingAllowed}
                                            onChange={(e) => setSmokingAllowed(e.target.checked)}
                                            className="w-5 h-5 text-blue-600 rounded"
                                        />
                                        <div className="flex items-start gap-2">
                                            <Cigarette size={18} className="text-gray-400 mt-0.5" />
                                            <span className="font-medium text-gray-800">Smoking allowed</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                                        <input
                                            type="checkbox"
                                            checked={max2Allowed}
                                            onChange={(e) => setMax2Allowed(e.target.checked)}
                                            className="w-5 h-5 text-blue-600 rounded"
                                        />
                                        <div className="flex items-start gap-2">
                                            <Users size={18} className="text-blue-500 mt-0.5" />
                                            <span className="font-medium text-gray-800">Max 2 in back seat</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Update Button */}
                            <button
                                onClick={updateRide}
                                disabled={loading || !routeData || !departureTime || !baseFare}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Updating...
                                    </span>
                                ) : (
                                    "Update Ride"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </LoadScript>
    );
}
