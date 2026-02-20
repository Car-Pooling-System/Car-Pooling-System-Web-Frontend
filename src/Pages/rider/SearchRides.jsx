import { useRef, useState } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { LoadScript, Autocomplete } from "@react-google-maps/api";
import {
    Car, MapPin, Calendar, Search, Clock,
    Star, ChevronRight, ArrowRight, Shield,
    Leaf, Users, TrendingUp
} from "lucide-react";

const MAP_LIBRARIES = ["places"];

/* Small stat badge shown in the hero right panel */
function StatBadge({ icon: Icon, value, label }) {
    return (
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl px-4 py-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-muted)] flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <div>
                <p className="text-lg font-extrabold text-[var(--color-text-primary)] leading-none">{value}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{label}</p>
            </div>
        </div>
    );
}

export default function SearchRides() {
    const { user } = useUser();
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    if (user?.unsafeMetadata?.role !== "rider") {
        return <Navigate to="/home" />;
    }

    const pickupRef = useRef(null);
    const dropRef = useRef(null);

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pickupLocation, setPickupLocation] = useState(null);
    const [dropLocation, setDropLocation] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    const searchRides = async () => {
        const pickup = pickupRef.current?.getPlace?.();
        const drop = dropRef.current?.getPlace?.();

        if (!pickup?.geometry || !drop?.geometry) {
            alert("Select valid locations from the dropdown");
            return;
        }

        const pl = {
            lat: pickup.geometry.location.lat(),
            lng: pickup.geometry.location.lng(),
            name: pickup.name || pickup.formatted_address,
        };
        const dl = {
            lat: drop.geometry.location.lat(),
            lng: drop.geometry.location.lng(),
            name: drop.name || drop.formatted_address,
        };

        setPickupLocation(pl);
        setDropLocation(dl);

        try {
            setLoading(true);
            setHasSearched(true);
            const res = await axios.get(`${BACKEND_URL}/api/rides/search`, {
                params: { pickupLat: pl.lat, pickupLng: pl.lng, dropLat: dl.lat, dropLng: dl.lng },
            });
            setResults(res.data);
        } catch (error) {
            console.error("SEARCH ERROR:", error.response?.data || error.message);
            alert("Failed to search rides. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (d) =>
        new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    const formatDate = (d) =>
        new Date(d).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

    return (
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={MAP_LIBRARIES}>
            <div className="min-h-screen font-[var(--font-family)] bg-[var(--color-bg)] antialiased">

                {/* ═══════════════════════════════════════════
                    HERO — full width, two-column split
                ═══════════════════════════════════════════ */}
                <section className="relative w-full overflow-hidden">

                    {/* Full-bleed gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#f0fdfa] via-white to-[#ecfeff] -z-10" />
                    {/* Teal blob left */}
                    <div
                        className="absolute -z-10 rounded-full pointer-events-none"
                        style={{
                            background: "radial-gradient(circle, rgba(13,148,136,0.25) 0%, transparent 70%)",
                            width: 700, height: 700, left: "-12%", top: "-20%", filter: "blur(60px)",
                        }}
                    />
                    {/* Cyan blob right */}
                    <div
                        className="absolute -z-10 rounded-full pointer-events-none"
                        style={{
                            background: "radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)",
                            width: 600, height: 600, right: "-8%", bottom: "-10%", filter: "blur(60px)",
                        }}
                    />

                    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">

                        {/* ── LEFT: Heading + Search Form ── */}
                        <div className="flex flex-col gap-7">

                            {/* Pill badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary-muted)] border border-[var(--color-primary)]/20 w-fit">
                                <span className="flex h-2 w-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                                <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest">
                                    Find Available Rides
                                </span>
                            </div>

                            {/* Headline */}
                            <div>
                                <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight text-[var(--color-text-primary)]">
                                    Where are you<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[#06b6d4]">
                                        headed today?
                                    </span>
                                </h1>
                                <p className="mt-4 text-lg text-[var(--color-text-secondary)] max-w-md leading-relaxed">
                                    Search from hundreds of rides going your way. Safe, affordable, and comfortable.
                                </p>
                            </div>

                            {/* Search card */}
                            <div
                                className="rounded-2xl p-5 shadow-2xl border border-white/70"
                                style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)" }}
                            >
                                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-4 px-1">
                                    Search your ride
                                </p>

                                <div className="flex flex-col gap-3">
                                    {/* Pickup */}
                                    <label className="flex items-center gap-3 bg-[var(--color-bg)] rounded-xl px-4 border border-[var(--color-border)] focus-within:border-[var(--color-primary)] focus-within:ring-4 focus-within:ring-[var(--color-primary)]/10 transition-all group cursor-text">
                                        <div className="w-3 h-3 rounded-full border-[3px] border-[var(--color-text-muted)] group-focus-within:border-[var(--color-primary)] transition-colors flex-shrink-0" />
                                        <Autocomplete onLoad={(a) => (pickupRef.current = a)} className="flex-1">
                                            <input
                                                className="w-full h-14 bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] font-semibold text-base"
                                                placeholder="Leaving from..."
                                            />
                                        </Autocomplete>
                                    </label>

                                    {/* Vertical connector */}
                                    <div className="px-5 -my-1">
                                        <div className="w-px h-4 bg-[var(--color-border)] ml-[5px]" />
                                    </div>

                                    {/* Drop-off */}
                                    <label className="flex items-center gap-3 bg-[var(--color-bg)] rounded-xl px-4 border border-[var(--color-border)] focus-within:border-[var(--color-primary)] focus-within:ring-4 focus-within:ring-[var(--color-primary)]/10 transition-all group cursor-text">
                                        <MapPin className="w-5 h-5 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors flex-shrink-0" />
                                        <Autocomplete onLoad={(a) => (dropRef.current = a)} className="flex-1">
                                            <input
                                                className="w-full h-14 bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] font-semibold text-base"
                                                placeholder="Going to..."
                                            />
                                        </Autocomplete>
                                    </label>

                                    {/* Search Button */}
                                    <button
                                        onClick={searchRides}
                                        disabled={loading}
                                        className="mt-1 w-full h-14 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white rounded-xl font-bold text-base shadow-lg shadow-[var(--color-primary)]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Searching...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="w-5 h-5" />
                                                Search Rides
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: Stats + trust panel ── */}
                        <div className="hidden lg:flex flex-col gap-5">
                            {/* Large illustrated card */}
                            <div
                                className="relative rounded-3xl overflow-hidden p-8 text-white shadow-2xl"
                                style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #0891b2 100%)" }}
                            >
                                {/* Decorative circle */}
                                <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/10" />
                                <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                            <Car className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-white/70 text-sm font-medium">RideShare Network</p>
                                            <p className="text-white font-bold text-lg leading-tight">Active across India</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        {[
                                            { value: "50K+", label: "Happy riders" },
                                            { value: "1200+", label: "Routes covered" },
                                            { value: "4.9★", label: "Avg. rating" },
                                            { value: "₹60", label: "Avg. saving/trip" },
                                        ].map((s) => (
                                            <div key={s.label} className="bg-white/15 rounded-2xl px-4 py-3 backdrop-blur-sm">
                                                <p className="text-xl font-extrabold text-white">{s.value}</p>
                                                <p className="text-white/70 text-xs mt-0.5">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2 text-white/80 text-sm">
                                        <Shield className="w-4 h-4" />
                                        <span>All drivers are verified &amp; rated</span>
                                    </div>
                                </div>
                            </div>

                            {/* Trust badges */}
                            <div className="grid grid-cols-3 gap-3">
                                <StatBadge icon={Shield} value="100%" label="Verified" />
                                <StatBadge icon={Leaf} value="−40%" label="Carbon" />
                                <StatBadge icon={TrendingUp} value="↑ Safe" label="Rated trips" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════
                    RESULTS SECTION
                ═══════════════════════════════════════════ */}
                {hasSearched && (
                    <section className="w-full bg-white border-t border-[var(--color-border)]">
                        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">

                            {/* Results header */}
                            {results.length > 0 && (
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                                            {results.length} ride{results.length !== 1 ? "s" : ""} available
                                        </h2>
                                        {pickupLocation && dropLocation && (
                                            <div className="flex items-center gap-2 mt-1 text-[var(--color-text-secondary)]">
                                                <span className="font-semibold text-sm">{pickupLocation.name}</span>
                                                <ArrowRight className="w-4 h-4 flex-shrink-0" />
                                                <span className="font-semibold text-sm">{dropLocation.name}</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="hidden sm:block text-sm text-[var(--color-text-muted)] bg-[var(--color-bg)] border border-[var(--color-border)] px-4 py-2 rounded-full font-medium">
                                        Sorted by price
                                    </span>
                                </div>
                            )}

                            {/* Grid of ride cards */}
                            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                {results.map((ride, idx) => (
                                    <div
                                        key={ride.id}
                                        onClick={() =>
                                            navigate(`/rides/${ride.id}/details`, {
                                                state: {
                                                    pickup: pickupLocation,
                                                    drop: dropLocation,
                                                    estimatedFare: ride.estimate.fare,
                                                },
                                            })
                                        }
                                        className="group bg-white rounded-2xl border border-[var(--color-border)] shadow-sm hover:shadow-xl hover:border-[var(--color-primary)]/30 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                                    >
                                        {/* Top accent bar */}
                                        <div className="h-1 w-full bg-gradient-to-r from-[var(--color-primary)] to-[#06b6d4] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        <div className="p-5 flex flex-col flex-1">
                                            {/* Date + Fare row */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                                                    <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-muted)] flex items-center justify-center">
                                                        <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                                                    </div>
                                                    <span className="text-xs font-semibold">
                                                        {formatDate(ride.schedule.departureTime)}
                                                    </span>
                                                </div>
                                                <div className="flex items-baseline gap-0.5">
                                                    <span className="text-xs font-bold text-[var(--color-primary)]">₹</span>
                                                    <span className="text-2xl font-extrabold text-[var(--color-primary)]">
                                                        {ride.estimate.fare}
                                                    </span>
                                                    <span className="text-xs text-[var(--color-text-muted)]">.00</span>
                                                </div>
                                            </div>

                                            {/* Route timeline */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-base font-bold text-[var(--color-text-primary)] w-12 text-right">
                                                    {formatTime(ride.schedule.departureTime)}
                                                </span>
                                                <div className="flex-1 flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
                                                    <div className="flex-1 h-px bg-gradient-to-r from-[var(--color-primary)]/30 to-[var(--color-primary)]/30 via-[var(--color-border)]" />
                                                    <div className="w-6 h-6 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center flex-shrink-0">
                                                        <Car className="w-3 h-3 text-[var(--color-primary)]" />
                                                    </div>
                                                    <div className="flex-1 h-px bg-gradient-to-r from-[var(--color-primary)]/30 to-[var(--color-primary)]/30 via-[var(--color-border)]" />
                                                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
                                                </div>
                                                <span className="text-base font-bold text-[var(--color-text-primary)] w-12">
                                                    {formatTime(ride.schedule.arrivalTime)}
                                                </span>
                                            </div>

                                            {/* Location labels */}
                                            <div className="flex justify-between px-1 mb-4">
                                                <div className="max-w-[42%]">
                                                    <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">From</p>
                                                    <p className="text-xs font-semibold text-[var(--color-text-primary)] leading-snug mt-0.5 truncate">
                                                        {pickupLocation?.name || "Pickup"}
                                                    </p>
                                                </div>
                                                <div className="flex items-center text-[var(--color-text-muted)] text-[10px] font-medium gap-0.5 mt-2">
                                                    <MapPin className="w-2.5 h-2.5" />
                                                    {ride.estimate.distanceKm?.toFixed(1)} km
                                                </div>
                                                <div className="max-w-[42%] text-right">
                                                    <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">To</p>
                                                    <p className="text-xs font-semibold text-[var(--color-text-primary)] leading-snug mt-0.5 truncate">
                                                        {dropLocation?.name || "Drop-off"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="h-px bg-[var(--color-border)] mb-4" />

                                            {/* Driver row */}
                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="relative">
                                                        <img
                                                            src={ride.driver.profileImage}
                                                            alt={ride.driver.name}
                                                            className="w-9 h-9 rounded-full object-cover border-2 border-[var(--color-primary)]/20"
                                                        />
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-xs text-[var(--color-text-primary)]">{ride.driver.name}</p>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                            <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">
                                                                {ride.driver.rating || "4.9"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-bold bg-[var(--color-primary-muted)] text-[var(--color-primary)] border border-[var(--color-primary)]/20 px-2 py-1 rounded-full">
                                                        💺 {ride.seatsAvailable}
                                                    </span>
                                                    <div className="w-7 h-7 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center group-hover:bg-[var(--color-primary)] transition-colors">
                                                        <ChevronRight className="w-3.5 h-3.5 text-[var(--color-primary)] group-hover:text-white transition-colors" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Empty state */}
                            {!loading && results.length === 0 && (
                                <div className="max-w-lg mx-auto text-center py-20">
                                    <div className="w-20 h-20 rounded-3xl bg-[var(--color-primary-muted)] flex items-center justify-center mx-auto mb-5">
                                        <Car className="w-10 h-10 text-[var(--color-primary)]" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">No rides found</h3>
                                    <p className="text-[var(--color-text-secondary)]">
                                        No rides available for this route right now. Try a different combination or check back later.
                                    </p>
                                    <button
                                        onClick={() => setHasSearched(false)}
                                        className="mt-6 px-8 py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] transition-all shadow-md"
                                    >
                                        Try Another Search
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ═══════════════════════════════════════════
                    BOTTOM TRUST STRIP (only when no results)
                ═══════════════════════════════════════════ */}
                {!hasSearched && (
                    <section className="border-t border-[var(--color-border)] bg-white">
                        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 grid sm:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: Shield,
                                    title: "Verified Drivers",
                                    desc: "Every driver is ID-verified and community-rated before their first ride.",
                                },
                                {
                                    icon: Leaf,
                                    title: "Eco-friendly Travel",
                                    desc: "Sharing a ride cuts carbon emissions by up to 40% per journey.",
                                },
                                {
                                    icon: Users,
                                    title: "50,000+ Riders",
                                    desc: "A growing community of daily commuters and long-distance travellers.",
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="group flex flex-col gap-3 p-6 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:shadow-md transition-all bg-[var(--color-bg)]"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-muted)] flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <item.icon className="w-6 h-6 text-[var(--color-primary)]" />
                                    </div>
                                    <h3 className="font-bold text-[var(--color-text-primary)]">{item.title}</h3>
                                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </LoadScript>
    );
}