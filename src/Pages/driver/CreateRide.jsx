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
import { MapPin, Clock, DollarSign, Zap, Users, Cigarette, PawPrint, ChevronDown, Calendar } from "lucide-react";

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
    const [rideType, setRideType] = useState("economy"); // economy, premium, executive
    const [pricePerKm, setPricePerKm] = useState(10);
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState("09:00");
    const [loading, setLoading] = useState(false);

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
            pricing: {
                baseFare: Number(baseFare),
                pricePerKm: Number(pricePerKm),
                rideType: rideType
            },
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
            setLoading(true);
            const res = await axios.post(`${BACKEND_URL}/api/rides`, payload);

            console.log("CREATED RIDE ID:", res.data._id);

            alert("Ride published 🚗");
            navigate("/driver/rides");

        } catch (error) {
            console.error("AXIOS ERROR DETAILS:", error.response?.data || error.message);
            alert(`Failed to publish ride: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    /* ---------- HELPER: Calculate Total Fare ---------- */
    const calculateTotalFare = () => {
        if (!routeData) return 0;
        const km = routeData.metrics.totalDistanceKm;
        const base = Number(baseFare) || 0;
        const perKm = Number(pricePerKm) || 0;
        return (base + km * perKm).toFixed(2);
    };

    /* ---------- HELPER: Update Departure Time ---------- */
    const updateDepartureTime = () => {
        if (!selectedDate || !selectedTime) return;
        const [hours, minutes] = selectedTime.split(":");
        const dateTime = new Date(selectedDate);
        dateTime.setHours(parseInt(hours), parseInt(minutes));
        setDepartureTime(dateTime.toISOString());
    };

    /* ---------- CALENDAR HELPER ---------- */
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

    /* ---------- UI ---------- */
    return (
        <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={MAP_LIBRARIES}
        >
            <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 font-sans relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-[var(--color-primary)]/5 rounded-b-[3rem] -z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/80" />
                </div>

                <div className="max-w-6xl mx-auto relative z-10 space-y-8">
                    {/* Header */}
                    <div className="text-center mb-10 fade-in-up">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">Publish Your Ride</h1>
                        <p className="text-gray-500 text-lg">Create and share your ride with passengers</p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* Left Column - Route & Map (7/12) */}
                        <div className="lg:col-span-7 space-y-8 fade-in-up delay-1">

                            {/* Route Section */}
                            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center text-[var(--color-primary)]">
                                        <MapPin size={20} />
                                    </div>
                                    Trip Details
                                </h2>

                                <div className="space-y-6">
                                    <div className="relative group">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                                            From <span className="text-red-500">*</span>
                                        </label>
                                        <Autocomplete onLoad={(a) => (startRef.current = a)}>
                                            <input
                                                className="w-full h-14 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold text-gray-900"
                                                placeholder="Starting location"
                                            />
                                        </Autocomplete>
                                    </div>

                                    <div className="relative group">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                                            To <span className="text-red-500">*</span>
                                        </label>
                                        <Autocomplete onLoad={(a) => (endRef.current = a)}>
                                            <input
                                                className="w-full h-14 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold text-gray-900"
                                                placeholder="Destination"
                                            />
                                        </Autocomplete>
                                    </div>

                                    <button
                                        onClick={previewRoute}
                                        className="w-full h-14 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <MapPin size={18} /> Preview Route
                                    </button>
                                </div>
                            </div>

                            {/* Map Section */}
                            {routeData && (
                                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in">
                                    <GoogleMap
                                        mapContainerStyle={{ height: 320, width: "100%" }}
                                        center={{
                                            lat: routeData?.start.location.coordinates[1] || 13.0827,
                                            lng: routeData?.start.location.coordinates[0] || 80.2707,
                                        }}
                                        zoom={10}
                                        options={{
                                            disableDefaultUI: true,
                                            zoomControl: true,
                                            styles: [
                                                {
                                                    featureType: "all",
                                                    elementType: "geometry",
                                                    stylers: [{ saturation: -20 }]
                                                }
                                            ]
                                        }}
                                    >
                                        {directions && <DirectionsRenderer directions={directions} options={{
                                            polylineOptions: {
                                                strokeColor: "#0f766e",
                                                strokeWeight: 5,
                                                strokeOpacity: 0.8
                                            }
                                        }} />}
                                    </GoogleMap>

                                    {/* Route Stats */}
                                    <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50/50 backdrop-blur-sm">
                                        <div className="p-4 text-center group hover:bg-white transition-colors">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Distance</p>
                                            <p className="text-xl font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">
                                                {routeData.metrics.totalDistanceKm.toFixed(1)} <span className="text-sm text-gray-500 font-medium">km</span>
                                            </p>
                                        </div>
                                        <div className="p-4 text-center group hover:bg-white transition-colors">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Duration</p>
                                            <p className="text-xl font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">
                                                {Math.round(routeData.metrics.durationMinutes)} <span className="text-sm text-gray-500 font-medium">min</span>
                                            </p>
                                        </div>
                                        <div className="p-4 text-center group hover:bg-white transition-colors">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Est. Fare</p>
                                            <p className="text-xl font-bold text-green-600">
                                                ₹{calculateTotalFare()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Schedule & Pricing (5/12) */}
                        <div className="lg:col-span-5 space-y-8 fade-in-up delay-2">

                            {/* Schedule Section */}
                            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center text-[var(--color-primary)]">
                                        <Clock size={20} />
                                    </div>
                                    Schedule
                                </h2>

                                {/* Date Picker */}
                                <div className="mb-6 relative">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                                        Departure Date
                                    </label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowCalendar(!showCalendar)}
                                            className="w-full h-14 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-left font-semibold text-gray-900 hover:border-[var(--color-primary)] focus:border-[var(--color-primary)] transition flex items-center justify-between"
                                        >
                                            {formatDateDisplay()}
                                            <Calendar size={20} className="text-[var(--color-primary)]" />
                                        </button>

                                        {/* Custom Calendar */}
                                        {showCalendar && (
                                            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 p-4 w-full animate-in zoom-in">
                                                <div className="flex items-center justify-between mb-4">
                                                    <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">←</button>
                                                    <p className="font-bold text-gray-900">{selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                                                    <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">→</button>
                                                </div>
                                                <div className="grid grid-cols-7 gap-1 mb-2">
                                                    {["S", "M", "T", "W", "T", "F", "S"].map(d => <div key={d} className="text-center text-xs font-bold text-gray-400">{d}</div>)}
                                                </div>
                                                <div className="grid grid-cols-7 gap-1">
                                                    {generateCalendarDays().map((day, idx) => {
                                                        const isSelected = day === selectedDate.getDate() && selectedDate.getMonth() === selectedDate.getMonth();
                                                        return (
                                                            <button
                                                                key={idx}
                                                                onClick={() => { if (day) { setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)); setShowCalendar(false); } }}
                                                                className={`h-9 w-9 rounded-full text-sm font-semibold flex items-center justify-center transition-all ${!day ? "invisible" : isSelected ? "bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30" : "hover:bg-gray-100 text-gray-700"
                                                                    }`}
                                                            >
                                                                {day}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Time Picker */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
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
                                            className="flex-1 h-14 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all font-semibold text-gray-900"
                                        />
                                        <button
                                            onClick={updateDepartureTime}
                                            className="h-14 px-6 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition"
                                        >
                                            Set
                                        </button>
                                    </div>
                                </div>

                                {departureTime && (
                                    <div className="mt-6 p-4 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-xl flex items-start gap-3">
                                        <div className="mt-1 text-[var(--color-primary)]"><Clock size={18} /></div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">
                                                {new Date(departureTime).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                            </p>
                                            <p className="text-2xl font-bold text-[var(--color-primary)] mt-1">
                                                {new Date(departureTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Pricing & Preferences */}
                            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <DollarSign size={20} />
                                    </div>
                                    Pricing & Rules
                                </h3>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Base Fare ₹</label>
                                            <input
                                                type="number"
                                                value={baseFare}
                                                onChange={(e) => setBaseFare(e.target.value)}
                                                className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-green-500 outline-none font-bold text-gray-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Per Km ₹</label>
                                            <input
                                                type="number"
                                                value={pricePerKm}
                                                onChange={(e) => setPricePerKm(e.target.value)}
                                                className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-green-500 outline-none font-bold text-gray-900"
                                            />
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 my-4"></div>

                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 cursor-pointer transition-all group">
                                            <input
                                                type="checkbox"
                                                checked={petsAllowed}
                                                onChange={(e) => setPetsAllowed(e.target.checked)}
                                                className="w-5 h-5 text-[var(--color-primary)] rounded focus:ring-[var(--color-primary)]"
                                            />
                                            <PawPrint size={18} className="text-gray-400 group-hover:text-[var(--color-primary)] transition-colors" />
                                            <span className="font-semibold text-gray-700">Pets allowed</span>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 cursor-pointer transition-all group">
                                            <input
                                                type="checkbox"
                                                checked={smokingAllowed}
                                                onChange={(e) => setSmokingAllowed(e.target.checked)}
                                                className="w-5 h-5 text-[var(--color-primary)] rounded focus:ring-[var(--color-primary)]"
                                            />
                                            <Cigarette size={18} className="text-gray-400 group-hover:text-[var(--color-primary)] transition-colors" />
                                            <span className="font-semibold text-gray-700">Smoking allowed</span>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 cursor-pointer transition-all group">
                                            <input
                                                type="checkbox"
                                                checked={max2Allowed}
                                                onChange={(e) => setMax2Allowed(e.target.checked)}
                                                className="w-5 h-5 text-[var(--color-primary)] rounded focus:ring-[var(--color-primary)]"
                                            />
                                            <Users size={18} className="text-gray-400 group-hover:text-[var(--color-primary)] transition-colors" />
                                            <span className="font-semibold text-gray-700">Max 2 in back seat</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Publish Button */}
                            <button
                                onClick={createRide}
                                disabled={loading || !routeData || !departureTime || !baseFare}
                                className="w-full bg-[var(--color-primary)] text-white font-bold text-xl py-5 rounded-2xl hover:bg-[var(--color-primary-light)] transition shadow-xl shadow-[var(--color-primary)]/20 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                        Publishing...
                                    </>
                                ) : (
                                    <>
                                        Publish Ride <RocketIcon />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </LoadScript>
    );
}

// Icon helper
const RocketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rocket"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>
);
