import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Autocomplete, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { MapPin, Calendar as CalendarIcon, Users, Search, Loader2, Clock, X, Plus, Minus } from "lucide-react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useUser } from "@clerk/clerk-react";

const LIBRARIES = ["places"];
const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 }; // New Delhi
const GOOGLE_MAPS_API_KEY =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "";

const MAP_STYLES = [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f0f4f2" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#d0e8da" }] },
    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f6f8f6" }] },
];

export default function HeroSection() {
    const { isSignedIn } = useUser();
    const navigate = useNavigate();

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });

    const [pickupPlace, setPickupPlace] = useState(null);
    const [dropPlace, setDropPlace] = useState(null);
    const [date, setDate] = useState(null);
    const [passengers, setPassengers] = useState(1);
    const [directions, setDirections] = useState(null);
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [searching, setSearching] = useState(false);
    const [routeInfo, setRouteInfo] = useState(null);
    const [showCalendar, setShowCalendar] = useState(false);


    const pickupRef = useRef(null);
    const dropRef = useRef(null);
    const mapRef = useRef(null);
    const pickupInputRef = useRef(null);
    const dropInputRef = useRef(null);
    const dateTriggerRef = useRef(null);

    const onPickupLoad = (autocomplete) => { pickupRef.current = autocomplete; };
    const onDropLoad = (autocomplete) => { dropRef.current = autocomplete; };

    const onPickupChanged = () => {
        if (!pickupRef.current) return;
        const place = pickupRef.current.getPlace();
        if (place?.geometry?.location) {
            setPickupPlace({
                name: place.formatted_address || place.name,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
            });
            setMapCenter({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
            window.setTimeout(() => {
                dropInputRef.current?.focus();
            }, 0);
        }
    };

    const onDropChanged = () => {
        if (!dropRef.current) return;
        const place = dropRef.current.getPlace();
        if (place?.geometry?.location) {
            setDropPlace({
                name: place.formatted_address || place.name,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
            });
            setShowCalendar(true);
            window.setTimeout(() => {
                dateTriggerRef.current?.focus();
            }, 0);
        }
    };

    const clearRoute = () => {
        setPickupPlace(null);
        setDropPlace(null);
        setDirections(null);
        setRouteInfo(null);
        setMapCenter(DEFAULT_CENTER);
        setDate(null);
        setPassengers(1);
        if (pickupRef.current) {
            const input = document.querySelector('input[placeholder="Your current address"]');
            if (input) input.value = '';
        }
        if (dropRef.current) {
            const input = document.querySelector('input[placeholder="Where to?"]');
            if (input) input.value = '';
        }
    };

    const drawRoute = useCallback(() => {
        if (!pickupPlace || !dropPlace || !window.google) return;
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
            {
                origin: { lat: pickupPlace.lat, lng: pickupPlace.lng },
                destination: { lat: dropPlace.lat, lng: dropPlace.lng },
                travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === "OK") {
                    setDirections(result);
                    const route = result.routes[0].legs[0];
                    setRouteInfo({
                        distance: route.distance.text,
                        duration: route.duration.text
                    });
                }
            }
        );
    }, [pickupPlace, dropPlace]);

    useEffect(() => {
        if (pickupPlace && dropPlace) {
            drawRoute();
        }
    }, [pickupPlace, dropPlace, drawRoute]);

    const handleSearch = async () => {
        if (!pickupPlace || !dropPlace) return;
        if (!isSignedIn) return;

        setSearching(true);
        drawRoute();

        setTimeout(() => {
            const params = new URLSearchParams({
                pickupLat: pickupPlace.lat,
                pickupLng: pickupPlace.lng,
                dropLat: dropPlace.lat,
                dropLng: dropPlace.lng,
                passengers,
                ...(date && { date: format(date, "yyyy-MM-dd") }),
            });
            navigate(`/search?${params.toString()}`);
            setSearching(false);
        }, 2000);
    };



    return (
        <section
            id="hero"
            style={{ backgroundColor: "var(--color-bg)" }}
            className="w-full"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20">
                <div className="flex flex-col md:flex-row items-stretch gap-8 md:gap-12">

                    {/* ── Left: Search Form ── */}
                    <div className="w-full md:w-[420px] shrink-0 flex flex-col justify-center">
                        <p
                            className="text-xs font-bold uppercase tracking-widest mb-3"
                            style={{ color: "var(--color-primary-dark)" }}
                        >
                            Find Your Ride
                        </p>
                        <h1
                            className="text-4xl md:text-5xl font-extrabold leading-tight mb-3"
                            style={{ color: "var(--color-text-primary)" }}
                        >
                            Book Your
                            <br />
                            <span style={{ color: "var(--color-primary)" }}>Ride</span>
                        </h1>
                        <p
                            className="text-sm mb-8"
                            style={{ color: "var(--color-text-secondary)" }}
                        >
                            Real-time AI assistance for every mile.
                        </p>

                        <div
                            className="rounded-2xl p-5 flex flex-col gap-4 shadow-sm"
                            style={{
                                backgroundColor: "var(--color-surface)",
                                border: "1px solid var(--color-border)",
                            }}
                        >
                            {/* Starting Location */}
                            <div>
                                <label
                                    className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block"
                                    style={{ color: "var(--color-text-muted)" }}
                                >
                                    Starting Location
                                </label>
                                {isLoaded ? (
                                    <Autocomplete onLoad={onPickupLoad} onPlaceChanged={onPickupChanged}>
                                        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                                            style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface-muted)" }}>
                                            <MapPin size={15} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                                            <input
                                                ref={pickupInputRef}
                                                type="text"
                                                placeholder="Your current address"
                                                className="flex-1 bg-transparent text-sm outline-none"
                                                style={{ color: "var(--color-text-primary)" }}
                                            />
                                        </div>
                                    </Autocomplete>
                                ) : (
                                    <InputSkeleton placeholder="Your current address" icon="pickup" />
                                )}
                            </div>

                            {/* Destination */}
                            <div>
                                <label
                                    className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block"
                                    style={{ color: "var(--color-text-muted)" }}
                                >
                                    Destination
                                </label>
                                {isLoaded ? (
                                    <Autocomplete onLoad={onDropLoad} onPlaceChanged={onDropChanged}>
                                        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                                            style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface-muted)" }}>
                                            <MapPin size={15} style={{ color: "#ef4444", flexShrink: 0 }} />
                                            <input
                                                ref={dropInputRef}
                                                type="text"
                                                placeholder="Where to?"
                                                className="flex-1 bg-transparent text-sm outline-none"
                                                style={{ color: "var(--color-text-primary)" }}
                                            />
                                        </div>
                                    </Autocomplete>
                                ) : (
                                    <InputSkeleton placeholder="Where to?" icon="drop" />
                                )}
                            </div>

                            {/* Date + Passengers row */}
                            <div className="flex gap-3 relative">
                                {/* Date */}
                                <div className="flex-1 relative">
                                    <label
                                        className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block"
                                        style={{ color: "var(--color-text-muted)" }}
                                    >
                                        Date
                                    </label>
                                    <button
                                        ref={dateTriggerRef}
                                        type="button"
                                        onClick={() => setShowCalendar(!showCalendar)}
                                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-colors hover:border-primary"
                                        style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface-muted)" }}
                                    >
                                        <CalendarIcon size={14} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                                        <span className="text-sm" style={{ color: date ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                                            {date ? format(date, "PP") : "Select Date"}
                                        </span>
                                    </button>

                                    {showCalendar && (
                                        <div className="absolute top-full left-0 mt-2 z-50 bg-white shadow-2xl rounded-2xl p-4 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                                            <DayPicker
                                                mode="single"
                                                selected={date}
                                                onSelect={(d) => { setDate(d); setShowCalendar(false); }}
                                                disabled={{ before: new Date() }}
                                                styles={{
                                                    caption: { color: 'var(--color-primary-dark)', fontWeight: 'bold' },
                                                    head_cell: { color: 'var(--color-text-muted)', fontSize: '12px' },
                                                    day_selected: { backgroundColor: 'var(--color-primary)', color: 'white' },
                                                    day_today: { color: 'var(--color-primary)', fontWeight: 'bold' }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Passengers */}
                                <div className="flex-1">
                                    <label
                                        className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block"
                                        style={{ color: "var(--color-text-muted)" }}
                                    >
                                        Passengers
                                    </label>
                                    <div className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5"
                                        style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface-muted)" }}>
                                        <div className="flex items-center gap-2 ml-1">
                                            <Users size={14} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                                            <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                                                {passengers} {passengers > 1 ? "People" : "Person"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setPassengers(Math.max(1, passengers - 1))}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-200 active:scale-90"
                                                style={{ backgroundColor: "white", border: "1px solid var(--color-border)" }}
                                            >
                                                <Minus size={14} style={{ color: "var(--color-text-primary)" }} />
                                            </button>
                                            <button
                                                onClick={() => setPassengers(Math.min(6, passengers + 1))}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-200 active:scale-90"
                                                style={{ backgroundColor: "white", border: "1px solid var(--color-border)" }}
                                            >
                                                <Plus size={14} style={{ color: "var(--color-text-primary)" }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Search button */}
                            {isSignedIn ? (
                                <button
                                    onClick={handleSearch}
                                    disabled={!pickupPlace || !dropPlace || searching}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: "var(--color-primary)",
                                        color: "var(--color-dark)",
                                    }}
                                >
                                    {searching ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Search size={16} />
                                    )}
                                    Find Ride
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate("/sign-in")}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                                    style={{
                                        backgroundColor: "var(--color-primary)",
                                        color: "var(--color-dark)",
                                    }}
                                >
                                    <Search size={16} />
                                    Find Ride
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Right: Google Map ── */}
                    <div className="flex-1 flex flex-col gap-4">
                        {/* Route Details Card */}
                        {routeInfo && (
                            <div
                                className="w-full rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-500"
                                style={{
                                    backgroundColor: "var(--color-surface)",
                                    border: "1px solid var(--color-border)",
                                }}
                            >
                                <div className="flex items-center gap-6">
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: "#f0fdf4" }}
                                    >
                                        <Clock size={24} style={{ color: "var(--color-primary)" }} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                                            ROUTE DETAILS
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                                                {routeInfo.distance}
                                            </p>
                                            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
                                            <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                                                {routeInfo.duration}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={clearRoute}
                                    className="mt-4 sm:mt-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-opacity-10 active:scale-95"
                                    style={{
                                        backgroundColor: "var(--color-surface-muted)",
                                        color: "var(--color-text-primary)",
                                        border: "1px solid var(--color-border)",
                                    }}
                                >
                                    Clear Route
                                </button>
                            </div>
                        )}

                        <div
                            className="flex-1 rounded-2xl overflow-hidden shadow-md relative"
                            style={{
                                minHeight: "420px",
                                border: "1px solid var(--color-border)",
                            }}
                        >
                            {isLoaded ? (
                                <>
                                    <GoogleMap
                                        mapContainerStyle={MAP_CONTAINER_STYLE}
                                        center={mapCenter}
                                        zoom={12}
                                        onLoad={(map) => { mapRef.current = map; }}
                                        options={{
                                            styles: MAP_STYLES,
                                            disableDefaultUI: true,
                                            zoomControl: true,
                                            gestureHandling: "cooperative",
                                        }}
                                    >
                                        {/* Markers */}
                                        {pickupPlace && !directions && (
                                            <Marker
                                                position={{ lat: pickupPlace.lat, lng: pickupPlace.lng }}
                                                icon={{
                                                    url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                                                    scaledSize: new window.google.maps.Size(38, 38),
                                                }}
                                            />
                                        )}
                                        {dropPlace && !directions && (
                                            <Marker
                                                position={{ lat: dropPlace.lat, lng: dropPlace.lng }}
                                                icon={{
                                                    url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                                                    scaledSize: new window.google.maps.Size(38, 38),
                                                }}
                                            />
                                        )}
                                        {directions && (
                                            <DirectionsRenderer
                                                directions={directions}
                                                options={{
                                                    polylineOptions: {
                                                        strokeColor: "#3b82f6",
                                                        strokeWeight: 6,
                                                        strokeOpacity: 0.8,
                                                    },
                                                    suppressMarkers: false,
                                                }}
                                            />
                                        )}
                                    </GoogleMap>

                                    {/* Small floating ETA overlay if directions exist but we want a compact view too */}
                                    {/* We can keep it or remove it since we have the top card now */}
                                </>
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center"
                                    style={{ backgroundColor: "var(--color-surface-muted)" }}
                                >
                                    <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-primary)" }} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function InputSkeleton({ placeholder, icon }) {
    return (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface-muted)" }}>
            <MapPin size={15} style={{ color: icon === "drop" ? "#ef4444" : "var(--color-primary)", flexShrink: 0 }} />
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{placeholder}</span>
        </div>
    );
}
