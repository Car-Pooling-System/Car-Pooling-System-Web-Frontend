import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from "@react-google-maps/api";
import {
    ArrowLeft,
    CalendarDays,
    Car,
    CheckCircle2,
    Clock3,
    Loader2,
    MapPin,
    Plus,
    Star,
    Users,
    X,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import { bookRide, searchRides } from "../lib/api";

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };
const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

const BASE_SEAT_OPTIONS = [{ type: "any", label: "Any Seat" }];

function formatDate(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatTime(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function normaliseSeatOptions(ride) {
    const fromApi = Array.isArray(ride?.seatTypes) ? ride.seatTypes : [];
    const mapped = fromApi
        .filter((item) => item && item.type)
        .map((item) => ({
            type: item.type,
            label: item.label || item.name || item.displayName || item.type,
        }));

    const seen = new Set();
    const combined = [...BASE_SEAT_OPTIONS, ...mapped].filter((item) => {
        if (seen.has(item.type)) return false;
        seen.add(item.type);
        return true;
    });

    return combined;
}

export default function SearchRidesPage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const [params] = useSearchParams();

    const pickupLat = toNumber(params.get("pickupLat"));
    const pickupLng = toNumber(params.get("pickupLng"));
    const dropLat = toNumber(params.get("dropLat"));
    const dropLng = toNumber(params.get("dropLng"));
    const date = params.get("date") || "";
    const minSeats = Number(params.get("passengers") || "1") || 1;

    const pickupNameFromQuery = params.get("pickupName") || "";
    const dropNameFromQuery = params.get("dropName") || "";

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [rides, setRides] = useState([]);
    const [selectedRideId, setSelectedRideId] = useState("");

    const [includeMe, setIncludeMe] = useState(true);
    const [seatPreference, setSeatPreference] = useState("any");
    const [additionalPassengers, setAdditionalPassengers] = useState([]);
    const [requesting, setRequesting] = useState(false);
    const [requestMessage, setRequestMessage] = useState("");
    const [requestError, setRequestError] = useState("");

    const [directions, setDirections] = useState(null);

    const { isLoaded: mapsLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    });

    const searchPayload = useMemo(() => {
        if (pickupLat == null || pickupLng == null || dropLat == null || dropLng == null) return null;
        return {
            pickupLat,
            pickupLng,
            dropLat,
            dropLng,
            ...(date ? { date } : {}),
            ...(minSeats > 0 ? { minSeats } : {}),
        };
    }, [date, dropLat, dropLng, minSeats, pickupLat, pickupLng]);

    const selectedRide = useMemo(
        () => rides.find((ride) => String(ride?._id) === String(selectedRideId)) || rides[0] || null,
        [rides, selectedRideId],
    );

    const seatOptions = useMemo(() => normaliseSeatOptions(selectedRide), [selectedRide]);

    const seatsSelected = useMemo(
        () => (includeMe ? 1 : 0) + additionalPassengers.length,
        [includeMe, additionalPassengers.length],
    );

    useEffect(() => {
        let cancelled = false;

        async function loadRides() {
            if (!searchPayload) {
                setError("Pickup and drop coordinates are missing.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");
                const response = await searchRides(searchPayload);
                if (cancelled) return;

                const list = Array.isArray(response) ? response : [];
                setRides(list);
                setSelectedRideId(list[0]?._id ? String(list[0]._id) : "");
            } catch (err) {
                if (cancelled) return;
                setError(err?.message || "Failed to load rides.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadRides();
        return () => {
            cancelled = true;
        };
    }, [searchPayload]);

    useEffect(() => {
        if (!mapsLoaded || pickupLat == null || pickupLng == null || dropLat == null || dropLng == null || !window.google) {
            return;
        }

        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
            {
                origin: { lat: pickupLat, lng: pickupLng },
                destination: { lat: dropLat, lng: dropLng },
                travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === "OK") setDirections(result);
            },
        );
    }, [dropLat, dropLng, mapsLoaded, pickupLat, pickupLng]);

    const addPassenger = () => {
        setAdditionalPassengers((prev) => [
            ...prev,
            { name: "", email: "", age: "", sex: "", seatPreference: "any" },
        ]);
    };

    const removePassenger = (index) => {
        setAdditionalPassengers((prev) => prev.filter((_, idx) => idx !== index));
    };

    const updatePassenger = (index, key, value) => {
        setAdditionalPassengers((prev) =>
            prev.map((p, idx) => (idx === index ? { ...p, [key]: value } : p)),
        );
    };

    const handleRequestRide = async () => {
        if (!selectedRide?._id || !user?.id || !searchPayload) return;

        if (seatsSelected <= 0) {
            setRequestError("Select at least one passenger.");
            return;
        }

        for (let i = 0; i < additionalPassengers.length; i += 1) {
            const passenger = additionalPassengers[i];
            if (!passenger.name.trim()) {
                setRequestError(`Passenger ${i + 1}: name is required.`);
                return;
            }
            if (!passenger.email.trim()) {
                setRequestError(`Passenger ${i + 1}: email is required.`);
                return;
            }
        }

        const fallbackPickupName = pickupNameFromQuery || selectedRide?.route?.start?.name || "";
        const fallbackDropName = dropNameFromQuery || selectedRide?.route?.end?.name || "";

        const payload = {
            user: {
                userId: user.id,
                name: [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.fullName || "Rider",
                profileImage: user.imageUrl || "",
                email: user.primaryEmailAddress?.emailAddress || "",
                pickupName: fallbackPickupName,
                dropName: fallbackDropName,
            },
            pickup: { lat: searchPayload.pickupLat, lng: searchPayload.pickupLng },
            drop: { lat: searchPayload.dropLat, lng: searchPayload.dropLng },
            seatPreference: includeMe ? seatPreference : "any",
            riderIsPartOfRide: includeMe,
            additionalPassengers: additionalPassengers.map((p) => ({
                name: p.name.trim(),
                email: p.email.trim(),
                age: p.age ? Number(p.age) : null,
                sex: p.sex || "",
                seatPreference: p.seatPreference || "any",
            })),
        };

        try {
            setRequesting(true);
            setRequestError("");
            setRequestMessage("");
            const response = await bookRide(selectedRide._id, payload);
            const seatsBooked = response?.seatsBooked || seatsSelected;
            const totalFare = response?.totalFare ?? response?.farePaid ?? selectedRide?.estimate?.fare ?? 0;
            setRequestMessage(`Ride request sent for ${seatsBooked} seat(s). Total fare: Rs ${Number(totalFare).toFixed(0)}.`);
        } catch (err) {
            setRequestError(err?.message || "Failed to request ride.");
        } finally {
            setRequesting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-emerald-50/30">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="rounded-3xl border border-emerald-100 bg-white/80 backdrop-blur-sm p-4 sm:p-6 shadow-[0_12px_40px_-24px_rgba(16,185,129,0.6)]">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Ride Match</p>
                            <h1 className="text-3xl font-black text-slate-900">Available Rides</h1>
                            <p className="text-sm text-slate-500">{rides.length} options found</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-bold">
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">Live Routes</span>
                            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-700">Instant Request</span>
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">Verified Drivers</span>
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                        {error}
                    </div>
                ) : null}

                {!error && rides.length === 0 ? (
                    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <p className="text-lg font-bold text-slate-900">No rides found for this route</p>
                        <p className="mt-2 text-sm text-slate-500">Try changing pickup, drop, date, or passenger count.</p>
                    </div>
                ) : null}

                {!error && rides.length > 0 ? (
                    <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1.15fr_1fr] gap-6 items-start">
                        <section className="space-y-4">
                            {rides.map((ride) => {
                                const isActive = String(ride._id) === String(selectedRide?._id);
                                const driver = ride?.driver || {};

                                return (
                                    <button
                                        key={String(ride._id)}
                                        type="button"
                                        onClick={() => setSelectedRideId(String(ride._id))}
                                        className={`w-full text-left rounded-3xl border bg-white overflow-hidden transition-all ${
                                            isActive
                                                ? "border-emerald-400 shadow-[0_18px_45px_-26px_rgba(16,185,129,0.7)]"
                                                : "border-slate-200 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="bg-gradient-to-r from-emerald-50 to-cyan-50/40 px-5 py-4 border-b border-slate-200">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <img
                                                        src={driver?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(driver?.name || "D")}&background=13ec5b&color=0d1f13`}
                                                        alt={driver?.name || "Driver"}
                                                        className="w-11 h-11 rounded-2xl border border-slate-200 object-cover"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-xl font-black text-slate-900 truncate">{driver?.name || "Driver"}</p>
                                                        <div className="mt-1 flex items-center gap-2 text-xs font-bold">
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-700">
                                                                <Star className="w-3 h-3" />
                                                                {driver?.rating ?? 5}
                                                            </span>
                                                            <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-emerald-700">
                                                                KYC VERIFIED
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-4xl leading-none font-black text-slate-900">Rs {Number(ride?.estimate?.fare || 0).toFixed(0)}</p>
                                                    <p className="mt-1 text-xs font-semibold text-slate-500">{Number(ride?.estimate?.distanceKm || 0).toFixed(1)} km</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                                            <div className="flex items-center gap-2 text-base font-semibold">
                                                <Clock3 className="w-4 h-4 text-emerald-500" />
                                                {formatTime(ride?.schedule?.departureTime)}
                                            </div>
                                            <div className="flex items-center gap-2 text-base font-semibold">
                                                <CalendarDays className="w-4 h-4 text-indigo-500" />
                                                {formatDate(ride?.schedule?.departureTime)}
                                            </div>
                                            <div className="flex items-center gap-2 text-base font-semibold">
                                                <Car className="w-4 h-4 text-cyan-600" />
                                                {ride?.vehicle?.brand || "-"} {ride?.vehicle?.model || ""}
                                            </div>
                                            <div className="flex items-center gap-2 text-base font-semibold">
                                                <Users className="w-4 h-4 text-amber-600" />
                                                {ride?.seatsAvailable ?? 0} seats left
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Booking Details</h2>
                                    <p className="text-sm font-bold text-slate-600">{seatsSelected} seat(s) selected</p>
                                </div>

                                <label className="mt-4 flex items-center gap-2 text-xl text-slate-800 font-semibold">
                                    <input
                                        type="checkbox"
                                        checked={includeMe}
                                        onChange={(e) => setIncludeMe(e.target.checked)}
                                        className="h-4 w-4 accent-emerald-500"
                                    />
                                    Include me in this booking
                                </label>

                                <div className="mt-4">
                                    <label className="text-sm font-black uppercase tracking-wide text-slate-500">My Seat Preference</label>
                                    <select
                                        value={seatPreference}
                                        onChange={(e) => setSeatPreference(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-xl font-medium text-slate-800 focus:border-emerald-400 focus:outline-none"
                                    >
                                        {seatOptions.map((option) => (
                                            <option key={option.type} value={option.type}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mt-5 flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Additional Passengers</h3>
                                    <button
                                        type="button"
                                        onClick={addPassenger}
                                        className="inline-flex items-center gap-1 text-sm font-black text-emerald-700 hover:text-emerald-800"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Passenger
                                    </button>
                                </div>

                                {additionalPassengers.length === 0 ? (
                                    <p className="mt-2 text-sm text-slate-500">Add passengers if you are booking for someone else.</p>
                                ) : (
                                    <div className="mt-3 space-y-3">
                                        {additionalPassengers.map((passenger, index) => (
                                            <div key={`passenger-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-bold text-slate-700">Passenger {index + 1}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => removePassenger(index)}
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700"
                                                    >
                                                        <X className="w-3 h-3" />
                                                        Remove
                                                    </button>
                                                </div>
                                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    <input
                                                        value={passenger.name}
                                                        onChange={(e) => updatePassenger(index, "name", e.target.value)}
                                                        placeholder="Name"
                                                        className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                                                    />
                                                    <input
                                                        value={passenger.email}
                                                        onChange={(e) => updatePassenger(index, "email", e.target.value)}
                                                        placeholder="Email"
                                                        className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                                                    />
                                                    <input
                                                        value={passenger.age}
                                                        onChange={(e) => updatePassenger(index, "age", e.target.value)}
                                                        placeholder="Age (optional)"
                                                        className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                                                    />
                                                    <input
                                                        value={passenger.sex}
                                                        onChange={(e) => updatePassenger(index, "sex", e.target.value)}
                                                        placeholder="Sex (optional)"
                                                        className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                                                    />
                                                    <select
                                                        value={passenger.seatPreference}
                                                        onChange={(e) => updatePassenger(index, "seatPreference", e.target.value)}
                                                        className="md:col-span-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                                                    >
                                                        {seatOptions.map((option) => (
                                                            <option key={`${index}-${option.type}`} value={option.type}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <p className="mt-4 text-sm font-semibold text-slate-500">
                                    Seats available: <span className="font-black text-slate-700">{selectedRide?.seatsAvailable ?? 0}</span>
                                </p>

                                {requestError ? (
                                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                                        {requestError}
                                    </div>
                                ) : null}
                                {requestMessage ? (
                                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        {requestMessage}
                                    </div>
                                ) : null}

                                <button
                                    type="button"
                                    disabled={requesting || seatsSelected <= 0}
                                    onClick={handleRequestRide}
                                    className="mt-4 w-full rounded-2xl bg-emerald-500 px-4 py-3.5 text-base font-black text-white shadow-[0_10px_25px_-12px_rgba(16,185,129,0.9)] transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    {requesting ? "Requesting..." : `Request Ride (${seatsSelected} seat${seatsSelected > 1 ? "s" : ""})`}
                                </button>
                            </div>
                        </section>

                        <aside className="xl:sticky xl:top-24">
                            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-[0_18px_45px_-26px_rgba(2,132,199,0.45)]">
                                <div className="h-[540px] bg-slate-200">
                                    {mapsLoaded ? (
                                        <GoogleMap
                                            mapContainerStyle={MAP_CONTAINER_STYLE}
                                            center={
                                                pickupLat != null && pickupLng != null
                                                    ? { lat: pickupLat, lng: pickupLng }
                                                    : DEFAULT_CENTER
                                            }
                                            zoom={6}
                                            options={{
                                                mapTypeControl: false,
                                                streetViewControl: false,
                                                fullscreenControl: false,
                                            }}
                                        >
                                            {directions ? <DirectionsRenderer directions={directions} /> : null}
                                        </GoogleMap>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="m-4 rounded-2xl border border-slate-200 bg-white/90 p-4">
                                    <p className="text-base font-black text-slate-900 flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                                        Your Route Preview
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Estimated journey based on your selected pickup and drop points.
                                    </p>
                                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                                        <p className="font-semibold text-slate-700 flex items-start gap-2">
                                            <MapPin className="w-4 h-4 mt-0.5 text-emerald-600" />
                                            {pickupNameFromQuery || selectedRide?.route?.start?.name || "Pickup point"}
                                        </p>
                                        <p className="font-semibold text-slate-700 flex items-start gap-2">
                                            <MapPin className="w-4 h-4 mt-0.5 text-rose-500" />
                                            {dropNameFromQuery || selectedRide?.route?.end?.name || "Drop point"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                ) : null}
            </main>
        </div>
    );
}

