import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Autocomplete, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { MapPin, Calendar, Users, Search, Loader2 } from "lucide-react";
import { SignInButton, useUser } from "@clerk/clerk-react";

const LIBRARIES = ["places"];
const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 }; // New Delhi

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
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });

    const [pickupPlace, setPickupPlace] = useState(null);
    const [dropPlace, setDropPlace] = useState(null);
    const [date, setDate] = useState("");
    const [passengers, setPassengers] = useState(1);
    const [directions, setDirections] = useState(null);
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [searching, setSearching] = useState(false);

    const pickupRef = useRef(null);
    const dropRef = useRef(null);
    const mapRef = useRef(null);

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
                if (status === "OK") setDirections(result);
            }
        );
    }, [pickupPlace, dropPlace]);

    const handleSearch = async () => {
        if (!pickupPlace || !dropPlace) return;
        if (!isSignedIn) return; // handled by sign-in button overlay

        setSearching(true);
        drawRoute();

        const params = new URLSearchParams({
            pickupLat: pickupPlace.lat,
            pickupLng: pickupPlace.lng,
            dropLat: dropPlace.lat,
            dropLng: dropPlace.lng,
            passengers,
            ...(date && { date }),
        });
        navigate(`/search?${params.toString()}`);
        setSearching(false);
    };

    const today = new Date().toISOString().split("T")[0];

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
                            <div className="flex gap-3">
                                {/* Date */}
                                <div className="flex-1">
                                    <label
                                        className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block"
                                        style={{ color: "var(--color-text-muted)" }}
                                    >
                                        Date
                                    </label>
                                    <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                                        style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface-muted)" }}>
                                        <Calendar size={14} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                                        <input
                                            type="date"
                                            min={today}
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="flex-1 bg-transparent text-sm outline-none"
                                            style={{ color: "var(--color-text-primary)" }}
                                        />
                                    </div>
                                </div>

                                {/* Passengers */}
                                <div className="flex-1">
                                    <label
                                        className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block"
                                        style={{ color: "var(--color-text-muted)" }}
                                    >
                                        Passengers
                                    </label>
                                    <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                                        style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface-muted)" }}>
                                        <Users size={14} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                                        <select
                                            value={passengers}
                                            onChange={(e) => setPassengers(Number(e.target.value))}
                                            className="flex-1 bg-transparent text-sm outline-none appearance-none"
                                            style={{ color: "var(--color-text-primary)" }}
                                        >
                                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                                <option key={n} value={n}>
                                                    {n} Rider{n > 1 ? "s" : ""}
                                                </option>
                                            ))}
                                        </select>
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
                                <SignInButton mode="modal">
                                    <button
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                                        style={{
                                            backgroundColor: "var(--color-primary)",
                                            color: "var(--color-dark)",
                                        }}
                                    >
                                        <Search size={16} />
                                        Find Ride
                                    </button>
                                </SignInButton>
                            )}
                        </div>
                    </div>

                    {/* ── Right: Google Map ── */}
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
                                                    strokeColor: "#13ec5b",
                                                    strokeWeight: 5,
                                                },
                                                suppressMarkers: false,
                                            }}
                                        />
                                    )}
                                </GoogleMap>

                                {/* ETA overlay */}
                                {directions && (
                                    <div
                                        className="absolute bottom-4 left-4 right-4 rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg"
                                        style={{
                                            backgroundColor: "var(--color-surface)",
                                            border: "1px solid var(--color-border)",
                                        }}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: "var(--color-primary)" }}
                                        >
                                            <MapPin size={14} color="#0d1f13" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                                                EST. ARRIVAL
                                            </p>
                                            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                                                {directions.routes[0]?.legs[0]?.duration?.text} away ·{" "}
                                                {directions.routes[0]?.legs[0]?.distance?.text}
                                            </p>
                                        </div>
                                    </div>
                                )}
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
