import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
    User, Mail, Phone, Star, ShieldCheck, ShieldAlert,
    Car, MapPin, Clock, Route, Banknote, BadgeCheck,
    Loader2, AlertCircle, ChevronRight, CalendarDays,
} from "lucide-react";
import Navbar from "../components/layout/Navbar.jsx";
import Footer from "../components/layout/Footer.jsx";
import { useProfile } from "../hooks/useProfile.js";

export default function ProfilePage() {
    const { isSignedIn, isLoaded, user } = useUser();
    const navigate = useNavigate();
    const { data, loading, error } = useProfile();

    // Redirect if not signed in
    useEffect(() => {
        if (isLoaded && !isSignedIn) navigate("/");
    }, [isLoaded, isSignedIn, navigate]);

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
            <Navbar />
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10">

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-3">
                        <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-primary)" }} />
                        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading your profile…</p>
                    </div>
                ) : error ? (
                    <ErrorBanner message={error} />
                ) : (
                    <>
                        {/* ── Profile Header ── */}
                        <ProfileHeader user={user} data={data} />

                        {/* ── Body splits by role ── */}
                        {data?.role === "driver" ? (
                            <DriverBody data={data} user={user} />
                        ) : (
                            <RiderBody data={data} user={user} />
                        )}
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}

/* ─────────────────────────────────────────────
   Profile Header  (common to both roles)
───────────────────────────────────────────── */
function ProfileHeader({ user, data }) {
    const role    = data?.role ?? "rider";
    const profile = data?.profile;   // driver only
    const rating  = data?.rating;    // driver only

    const avatarUrl =
        profile?.profileImage ||
        user?.imageUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName ?? "User")}&background=13ec5b&color=0d1f13&size=128`;

    return (
        <div
            className="rounded-2xl p-6 sm:p-8 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-6"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-24 h-24 rounded-2xl object-cover"
                    style={{ border: "3px solid var(--color-primary)" }}
                />
                {/* Online dot */}
                <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                    style={{ backgroundColor: "var(--color-primary)" }}
                />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-2xl font-extrabold truncate" style={{ color: "var(--color-text-primary)" }}>
                        {user?.fullName ?? "User"}
                    </h1>
                    <RoleBadge role={role} />
                </div>

                <div className="flex flex-wrap gap-4 mt-2 mb-3">
                    <InfoChip icon={<Mail size={13} />} text={user?.primaryEmailAddress?.emailAddress ?? "—"} />
                    {profile?.phoneNumber && (
                        <InfoChip icon={<Phone size={13} />} text={profile.phoneNumber} />
                    )}
                </div>

                {/* Rating row (driver) */}
                {role === "driver" && rating && (
                    <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                            {[1,2,3,4,5].map((i) => (
                                <Star
                                    key={i}
                                    size={14}
                                    fill={i <= Math.round(rating.average ?? 0) ? "var(--color-primary)" : "none"}
                                    stroke={i <= Math.round(rating.average ?? 0) ? "var(--color-primary)" : "var(--color-border)"}
                                />
                            ))}
                        </div>
                        <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                            {(rating.average ?? 0).toFixed(1)}
                        </span>
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            ({rating.reviewsCount ?? 0} reviews)
                        </span>
                    </div>
                )}
            </div>

            {/* Trust score pill */}
            {(data?.profile?.trustScore ?? data?.computed) !== undefined && (
                <div
                    className="shrink-0 flex flex-col items-center gap-1 px-5 py-3 rounded-xl"
                    style={{ backgroundColor: "var(--color-primary-soft)" }}
                >
                    <BadgeCheck size={20} style={{ color: "var(--color-primary-dark)" }} />
                    <span className="text-xl font-extrabold" style={{ color: "var(--color-primary-dark)" }}>
                        {data?.profile?.trustScore ?? 0}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                        Trust Score
                    </span>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Driver Body
───────────────────────────────────────────── */
function DriverBody({ data, user }) {
    const { profile, stats, vehicles } = data;
    const verification = profile?.verification ?? {};

    return (
        <div className="flex flex-col gap-6">

            {/* Verification badges */}
            <Section title="Verification Status">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <VerifBadge label="Email"          ok={verification.emailVerified} />
                    <VerifBadge label="Phone"          ok={verification.phoneVerified} />
                    <VerifBadge label="Driving License" ok={verification.drivingLicenseVerified} />
                    <VerifBadge label="Vehicle"        ok={verification.vehicleVerified} />
                </div>
            </Section>

            {/* Stats */}
            <Section title="Your Stats">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard icon={<Car size={18}/>}    label="Rides Hosted"    value={stats?.rides?.hosted    ?? profile?.rides?.hosted    ?? 0} />
                    <StatCard icon={<ShieldCheck size={18}/>} label="Completed"  value={stats?.rides?.completed ?? profile?.rides?.completed ?? 0} />
                    <StatCard icon={<Clock size={18}/>}  label="Hours Driven"    value={`${(stats?.hoursDriven ?? profile?.hoursDriven ?? 0).toFixed(1)}h`} />
                    <StatCard icon={<Route size={18}/>}  label="Km Driven"       value={`${(stats?.distanceDrivenKm ?? profile?.distanceDrivenKm ?? 0).toFixed(0)} km`} />
                    <StatCard icon={<Banknote size={18}/>} label="Total Earnings" value={`₹${(profile?.earnings?.total ?? 0).toLocaleString()}`} />
                    <StatCard icon={<Star size={18}/>}   label="Cancelled"       value={stats?.rides?.cancelled ?? profile?.rides?.cancelled ?? 0} />
                </div>
            </Section>

            {/* Vehicles */}
            <Section title={`Vehicles (${vehicles.length})`}>
                {vehicles.length === 0 ? (
                    <EmptyState icon={<Car size={28}/>} text="No vehicles added yet." />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {vehicles.map((v, i) => <VehicleCard key={i} vehicle={v} />)}
                    </div>
                )}
            </Section>

        </div>
    );
}

/* ─────────────────────────────────────────────
   Rider Body
───────────────────────────────────────────── */
function RiderBody({ data }) {
    const { bookings, computed } = data;

    return (
        <div className="flex flex-col gap-6">

            {/* Stats */}
            <Section title="Your Stats">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <StatCard icon={<ShieldCheck size={18}/>} label="Rides Completed" value={computed.completed} />
                    <StatCard icon={<AlertCircle size={18}/>} label="Rides Cancelled"  value={computed.cancelled} />
                    <StatCard icon={<Banknote size={18}/>}   label="Total Spent"       value={`₹${computed.totalFare.toLocaleString()}`} />
                </div>
            </Section>

            {/* Bookings list */}
            <Section title={`My Bookings (${bookings.length})`}>
                {bookings.length === 0 ? (
                    <EmptyState icon={<Car size={28}/>} text="No bookings yet. Find your first ride!" />
                ) : (
                    <div className="flex flex-col gap-3">
                        {bookings.map((b) => <BookingCard key={b.bookingId} booking={b} />)}
                    </div>
                )}
            </Section>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Reusable small components
───────────────────────────────────────────── */
function Section({ title, children }) {
    return (
        <div
            className="rounded-2xl p-5 sm:p-6"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
            <h2 className="text-base font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
                {title}
            </h2>
            {children}
        </div>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <div
            className="rounded-xl px-4 py-4 flex flex-col gap-2"
            style={{ backgroundColor: "var(--color-surface-muted)", border: "1px solid var(--color-border)" }}
        >
            <span style={{ color: "var(--color-primary-dark)" }}>{icon}</span>
            <span className="text-xl font-extrabold" style={{ color: "var(--color-text-primary)" }}>{value}</span>
            <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{label}</span>
        </div>
    );
}

function VerifBadge({ label, ok }) {
    return (
        <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{
                backgroundColor: ok ? "rgba(19,236,91,0.10)" : "rgba(231,42,8,0.07)",
                border: `1px solid ${ok ? "var(--color-primary)" : "var(--color-danger)"}`,
            }}
        >
            {ok
                ? <ShieldCheck size={15} style={{ color: "var(--color-primary-dark)", flexShrink: 0 }} />
                : <ShieldAlert  size={15} style={{ color: "var(--color-danger)", flexShrink: 0 }} />
            }
            <span
                className="text-xs font-semibold leading-tight"
                style={{ color: ok ? "var(--color-primary-dark)" : "var(--color-danger)" }}
            >
                {label}
            </span>
        </div>
    );
}

function RoleBadge({ role }) {
    const isDriver = role === "driver";
    return (
        <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
                backgroundColor: isDriver ? "rgba(19,236,91,0.15)" : "rgba(97,137,111,0.15)",
                color: isDriver ? "var(--color-primary-dark)" : "var(--color-text-secondary)",
            }}
        >
            {isDriver ? "🚗 Driver" : "🧍 Rider"}
        </span>
    );
}

function InfoChip({ icon, text }) {
    return (
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <span style={{ color: "var(--color-text-muted)" }}>{icon}</span>
            {text}
        </span>
    );
}

function VehicleCard({ vehicle }) {
    return (
        <div
            className="rounded-xl p-4 flex gap-4 items-start"
            style={{ backgroundColor: "var(--color-surface-muted)", border: "1px solid var(--color-border)" }}
        >
            {/* Vehicle image or placeholder */}
            <div
                className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: "var(--color-border)" }}
            >
                {vehicle.images?.[0] ? (
                    <img src={vehicle.images[0]} alt="vehicle" className="w-full h-full object-cover" />
                ) : (
                    <Car size={24} style={{ color: "var(--color-text-muted)" }} />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>
                    {vehicle.brand} {vehicle.model} · {vehicle.year}
                </p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                    <Tag text={vehicle.color} />
                    <Tag text={vehicle.licensePlate} />
                    <Tag text={`${vehicle.totalSeats ?? 4} seats`} />
                </div>
            </div>
        </div>
    );
}

function BookingCard({ booking }) {
    const ride   = booking.ride;
    const dep    = ride?.schedule?.departureTime ? new Date(ride.schedule.departureTime) : null;
    const status = booking.status;
    const isConfirmed = status === "confirmed";

    return (
        <div
            className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ backgroundColor: "var(--color-surface-muted)", border: "1px solid var(--color-border)" }}
        >
            {/* Status dot */}
            <div
                className="w-2.5 h-2.5 rounded-full shrink-0 mt-1 sm:mt-0"
                style={{ backgroundColor: isConfirmed ? "var(--color-primary)" : "var(--color-danger)" }}
            />

            <div className="flex-1 min-w-0">
                {/* Route */}
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <MapPin size={13} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                    <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                        {ride?.route?.start?.name ?? "—"}
                    </span>
                    <ChevronRight size={13} style={{ color: "var(--color-text-muted)" }} />
                    <MapPin size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
                    <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                        {ride?.route?.end?.name ?? "—"}
                    </span>
                </div>

                {/* Date + Driver */}
                <div className="flex flex-wrap gap-3 mt-1">
                    {dep && (
                        <InfoChip
                            icon={<CalendarDays size={12}/>}
                            text={dep.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        />
                    )}
                    {ride?.driver?.name && (
                        <InfoChip icon={<User size={12}/>} text={`Driver: ${ride.driver.name}`} />
                    )}
                </div>
            </div>

            {/* Fare + status */}
            <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-sm font-extrabold" style={{ color: "var(--color-text-primary)" }}>
                    ₹{booking.farePaid ?? 0}
                </span>
                <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{
                        backgroundColor: isConfirmed ? "rgba(19,236,91,0.15)" : "rgba(231,42,8,0.10)",
                        color: isConfirmed ? "var(--color-primary-dark)" : "var(--color-danger)",
                    }}
                >
                    {status}
                </span>
            </div>
        </div>
    );
}

function Tag({ text }) {
    return (
        <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
        >
            {text}
        </span>
    );
}

function EmptyState({ icon, text }) {
    return (
        <div className="flex flex-col items-center py-10 gap-3">
            <span style={{ color: "var(--color-text-muted)" }}>{icon}</span>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{text}</p>
        </div>
    );
}

function ErrorBanner({ message }) {
    return (
        <div
            className="rounded-2xl p-6 flex items-center gap-3"
            style={{ backgroundColor: "rgba(231,42,8,0.07)", border: "1px solid var(--color-danger)" }}
        >
            <AlertCircle size={20} style={{ color: "var(--color-danger)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--color-danger)" }}>
                {message}
            </p>
        </div>
    );
}
