import { useUser } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
    Car, Bell, Search, TrendingUp, Download, Clock,
    MapPin, Star, ShieldCheck, ShieldAlert, Loader2,
    AlertCircle, User, LogOut, ChevronDown, CheckCircle2,
    Circle, BarChart2,
} from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { useDriverDashboard } from "../hooks/useDriverDashboard.js";

/* ─────────────────────────────────────────────────────────────
   DRIVER DASHBOARD PAGE
───────────────────────────────────────────────────────────── */
export default function DriverDashboardPage() {
    const { isSignedIn, isLoaded, user } = useUser();
    const navigate = useNavigate();
    const { data, loading, error } = useDriverDashboard();

    useEffect(() => {
        if (isLoaded && !isSignedIn) navigate("/");
    }, [isLoaded, isSignedIn, navigate]);

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
            <DriverNavbar user={user} />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorBanner message={error} />
                ) : (
                    <DashboardBody data={data} user={user} />
                )}
            </main>
            <DashboardFooter />
        </div>
    );
}

/* ─── NAVBAR ──────────────────────────────────────────────── */
function DriverNavbar({ user }) {
    const { signOut } = useClerk();
    const navigate    = useNavigate();
    const [dropOpen, setDropOpen]   = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleSignOut = async () => {
        await signOut();
        navigate("/");
    };

    return (
        <nav
            className="sticky top-0 z-50 w-full"
            style={{
                backgroundColor: "var(--color-surface)",
                borderBottom: "1px solid var(--color-border)",
            }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 shrink-0">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "var(--color-primary)" }}
                    >
                        <Car size={16} color="#0d1f13" strokeWidth={2.5} />
                    </div>
                    <span className="text-lg font-extrabold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                        CarPool
                    </span>
                    <span
                        className="text-xs font-semibold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary-dark)" }}
                    >
                        AI
                    </span>
                </Link>

                {/* Nav links */}
                <div className="hidden md:flex items-center gap-6">
                    {[
                        { label: "Dashboard", href: "/" },
                        { label: "My Rides",  href: "/my-rides" },
                        { label: "Profile",   href: "/profile"  },
                    ].map((link) => (
                        <Link
                            key={link.label}
                            to={link.href}
                            className="text-sm font-semibold transition-colors hover:opacity-80"
                            style={{
                                color: link.href === "/" ? "var(--color-primary)" : "var(--color-text-secondary)",
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Search */}
                <div
                    className="hidden sm:flex items-center gap-2 flex-1 max-w-xs px-3 py-2 rounded-xl"
                    style={{ backgroundColor: "var(--color-surface-muted)", border: "1px solid var(--color-border)" }}
                >
                    <Search size={14} style={{ color: "var(--color-text-muted)" }} />
                    <input
                        className="bg-transparent text-sm outline-none flex-1 min-w-0"
                        style={{ color: "var(--color-text-primary)" }}
                        placeholder="Search rides..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Right: bell + avatar */}
                <div className="flex items-center gap-3">
                    <button
                        className="relative p-2 rounded-xl transition-all hover:opacity-70"
                        style={{ backgroundColor: "var(--color-surface-muted)" }}
                    >
                        <Bell size={16} style={{ color: "var(--color-text-secondary)" }} />
                    </button>

                    {/* Avatar dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setDropOpen((v) => !v)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all hover:shadow-sm"
                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                        >
                            <img
                                src={
                                    user?.imageUrl ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName ?? "Driver")}&background=13ec5b&color=0d1f13`
                                }
                                alt="avatar"
                                className="w-7 h-7 rounded-full object-cover"
                            />
                            <div className="hidden sm:flex flex-col items-start">
                                <span className="text-xs font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>
                                    {user?.firstName ?? "Driver"}
                                </span>
                                <span className="text-[10px] font-semibold" style={{ color: "var(--color-primary)" }}>
                                    Pro Driver
                                </span>
                            </div>
                            <ChevronDown
                                size={13}
                                strokeWidth={2.5}
                                style={{ color: "var(--color-text-muted)", transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                            />
                        </button>

                        {dropOpen && (
                            <div
                                className="absolute right-0 mt-2 w-52 rounded-2xl shadow-lg py-2 z-50"
                                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                            >
                                <div className="px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
                                    <p className="text-sm font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
                                        {user?.fullName ?? "Driver"}
                                    </p>
                                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                                        {user?.primaryEmailAddress?.emailAddress}
                                    </p>
                                </div>
                                <DropItem icon={<User size={14} />} label="My Profile" onClick={() => { navigate("/profile"); setDropOpen(false); }} />
                                <DropItem icon={<Car size={14} />}  label="My Rides"   onClick={() => { navigate("/my-rides"); setDropOpen(false); }} />
                                <div className="my-1 border-t" style={{ borderColor: "var(--color-border)" }} />
                                <DropItem icon={<LogOut size={14} />} label="Sign Out" danger onClick={handleSignOut} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

function DropItem({ icon, label, onClick, danger = false }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
            style={{ color: danger ? "var(--color-danger)" : "var(--color-text-primary)", backgroundColor: "transparent" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = danger ? "rgba(231,42,8,0.06)" : "var(--color-surface-muted)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
        >
            <span style={{ color: danger ? "var(--color-danger)" : "var(--color-text-muted)" }}>{icon}</span>
            {label}
        </button>
    );
}

/* ─── DASHBOARD BODY ──────────────────────────────────────── */
function DashboardBody({ data, user }) {
    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <DashboardHeader />

            {/* Stats Row */}
            <StatsRow summary={data?.summary} />

            {/* Main grid: charts left, sidebar right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column (charts + table) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <EarningsTrendChart data={data?.earningsByDay ?? []} />
                    <HoursVsDistanceChart data={data?.hoursVsDistance ?? []} />
                    <RecentPayoutsTable payouts={data?.recentPayouts ?? []} />
                </div>

                {/* Right sidebar */}
                <div className="flex flex-col gap-5">
                    <TrustScoreCard score={data?.stats?.trustScore ?? 0} />
                    <DriverRatingCard rating={data?.rating} stats={data?.stats} />
                    <PrimaryVehicleCard vehicles={data?.vehicles ?? []} />
                    <VerificationCard profile={data?.profile} user={user} />
                </div>
            </div>
        </div>
    );
}

/* ─── HEADER ──────────────────────────────────────────────── */
function DashboardHeader() {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="text-2xl font-extrabold" style={{ color: "var(--color-text-primary)" }}>
                    Earnings Dashboard
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    Review your performance and track your financial milestones.
                </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <button
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-surface)" }}
                >
                    <Clock size={14} />
                    Last 30 Days
                </button>
                <button
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: "var(--color-primary)", color: "var(--color-dark)" }}
                >
                    <Download size={14} />
                    Export Report
                </button>
            </div>
        </div>
    );
}

/* ─── STATS ROW ───────────────────────────────────────────── */
function StatsRow({ summary }) {
    const { totalEarnings = 0, currentMonthEarnings = 0, pendingPayouts = 0 } = summary ?? {};

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
                icon={<TrendingUp size={18} />}
                label="Total Earnings"
                value={`₹${totalEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                badge="+12.4%"
                badgePositive
            />
            <StatCard
                icon={<BarChart2 size={18} />}
                label="Current Month"
                value={`₹${currentMonthEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                badge="+5.2%"
                badgePositive
            />
            <StatCard
                icon={<Clock size={18} />}
                label="Pending Payouts"
                value={`₹${pendingPayouts.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                badge="Next Payout: Fri"
                badgePositive={false}
                badgeNeutral
            />
        </div>
    );
}

function StatCard({ icon, label, value, badge, badgePositive, badgeNeutral }) {
    return (
        <div
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
            <div className="flex items-center justify-between">
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary-dark)" }}
                >
                    {icon}
                </div>
                {badge && (
                    <span
                        className="text-xs font-semibold px-2 py-1 rounded-lg"
                        style={{
                            backgroundColor: badgeNeutral
                                ? "var(--color-surface-muted)"
                                : badgePositive ? "rgba(19,236,91,0.12)" : "rgba(231,42,8,0.08)",
                            color: badgeNeutral
                                ? "var(--color-text-muted)"
                                : badgePositive ? "var(--color-primary-dark)" : "var(--color-danger)",
                        }}
                    >
                        {badge}
                    </span>
                )}
            </div>
            <div>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>
                    {label}
                </p>
                <p className="text-2xl font-extrabold" style={{ color: "var(--color-text-primary)" }}>
                    {value}
                </p>
            </div>
        </div>
    );
}

/* ─── EARNINGS TREND CHART ────────────────────────────────── */
function EarningsTrendChart({ data }) {
    const hasData = data.some((d) => d.earnings > 0);
    return (
        <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                    Earnings Trend (Last 30 Days)
                </h2>
                <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "var(--color-primary)" }} />
                    Earnings
                </span>
            </div>
            {hasData ? (
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#13ec5b" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#13ec5b" stopOpacity={0}    />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", fontSize: "12px" }}
                            formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Earnings"]}
                        />
                        <Area
                            type="monotone"
                            dataKey="earnings"
                            stroke="#13ec5b"
                            strokeWidth={2.5}
                            fill="url(#earningsGrad)"
                            dot={{ r: 4, fill: "#13ec5b", strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <EmptyChart height={200} label="No earnings data yet" />
            )}
        </div>
    );
}

/* ─── HOURS VS DISTANCE CHART ─────────────────────────────── */
function HoursVsDistanceChart({ data }) {
    const hasData = data.some((d) => d.hours > 0 || d.km > 0);
    return (
        <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                    Hours vs. Distance
                </h2>
                <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                        <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: "rgba(19,236,91,0.3)" }} /> Hours
                    </span>
                    <span className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                        <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: "#13ec5b" }} /> Km
                    </span>
                </div>
            </div>
            {hasData ? (
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data} barGap={4} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", fontSize: "12px" }}
                        />
                        <Bar dataKey="hours" fill="rgba(19,236,91,0.35)" radius={[4, 4, 0, 0]} name="Hours" />
                        <Bar dataKey="km"    fill="#13ec5b"              radius={[4, 4, 0, 0]} name="Km" />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <EmptyChart height={180} label="Complete rides to see activity" />
            )}
        </div>
    );
}

/* ─── RECENT PAYOUTS TABLE ────────────────────────────────── */
function RecentPayoutsTable({ payouts }) {
    return (
        <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                    Recent Payouts
                </h2>
                <button className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>
                    View All
                </button>
            </div>

            {payouts.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: "var(--color-text-muted)" }}>
                    No payouts yet.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs" style={{ borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ color: "var(--color-text-muted)" }}>
                                <th className="pb-3 font-semibold uppercase tracking-wide">Passenger</th>
                                <th className="pb-3 font-semibold uppercase tracking-wide">Date</th>
                                <th className="pb-3 font-semibold uppercase tracking-wide">Amount</th>
                                <th className="pb-3 font-semibold uppercase tracking-wide">Method</th>
                                <th className="pb-3 font-semibold uppercase tracking-wide">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payouts.map((p) => (
                                <PayoutRow key={p._id} payout={p} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function PayoutRow({ payout }) {
    const initials = (payout.passengerId ?? "?").slice(0, 2).toUpperCase();
    const date     = new Date(payout.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const statusStyle = {
        success:  { bg: "rgba(19,236,91,0.1)",   color: "var(--color-primary-dark)" },
        pending:  { bg: "rgba(255,165,0,0.12)",   color: "#b45309" },
        failed:   { bg: "rgba(231,42,8,0.08)",    color: "var(--color-danger)" },
        refunded: { bg: "rgba(100,100,255,0.08)", color: "#4f46e5" },
    };
    const s = statusStyle[payout.status] ?? statusStyle.pending;

    return (
        <tr style={{ borderTop: "1px solid var(--color-border)" }}>
            <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                    <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: "var(--color-primary-soft)", color: "var(--color-primary-dark)" }}
                    >
                        {initials}
                    </div>
                    <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        {payout.passengerId?.slice(0, 8)}…
                    </span>
                </div>
            </td>
            <td className="py-3 pr-4" style={{ color: "var(--color-text-muted)" }}>{date}</td>
            <td className="py-3 pr-4 font-bold" style={{ color: "var(--color-primary-dark)" }}>
                ₹{payout.amount.toLocaleString("en-IN")}
            </td>
            <td className="py-3 pr-4 capitalize" style={{ color: "var(--color-text-secondary)" }}>
                {payout.paymentMethod}
            </td>
            <td className="py-3">
                <span
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold capitalize"
                    style={{ backgroundColor: s.bg, color: s.color }}
                >
                    {payout.status}
                </span>
            </td>
        </tr>
    );
}

/* ─── TRUST SCORE ─────────────────────────────────────────── */
function TrustScoreCard({ score }) {
    const MAX      = 1000;
    const pct      = Math.min((score / MAX) * 100, 100);
    const label    = score >= 800 ? "Exceptional" : score >= 600 ? "Good" : score >= 400 ? "Average" : "Building";
    const radius   = 52;
    const circ     = 2 * Math.PI * radius;
    const dash     = (pct / 100) * circ;

    return (
        <div
            className="rounded-2xl p-5 flex flex-col items-center gap-3"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
            <h2 className="text-sm font-bold self-start" style={{ color: "var(--color-text-primary)" }}>
                Trust Score
            </h2>
            <div className="relative w-32 h-32 flex items-center justify-center">
                <svg width="128" height="128" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="10" />
                    <circle
                        cx="64" cy="64" r={radius} fill="none"
                        stroke="#13ec5b" strokeWidth="10"
                        strokeDasharray={`${dash} ${circ}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 0.8s ease" }}
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-extrabold" style={{ color: "var(--color-text-primary)" }}>
                        {score}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                        {label}
                    </span>
                </div>
            </div>
            <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                {score >= 800
                    ? "You're in the top 5% of drivers in your region."
                    : score > 0
                    ? "Keep completing rides to improve your score."
                    : "Complete your first ride to start building your score."}
            </p>
        </div>
    );
}

/* ─── DRIVER RATING ───────────────────────────────────────── */
function DriverRatingCard({ rating, stats }) {
    const avg     = rating?.average ?? 0;
    const reviews = rating?.reviewsCount ?? 0;
    const hosted    = stats?.rides?.hosted    ?? 0;
    const completed = stats?.rides?.completed ?? 0;
    const cancelled = stats?.rides?.cancelled ?? 0;

    return (
        <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                    Driver Rating
                </h2>
                <div className="flex items-center gap-1">
                    <Star size={14} fill="var(--color-primary)" stroke="var(--color-primary)" />
                    <span className="text-sm font-extrabold" style={{ color: "var(--color-text-primary)" }}>
                        {avg.toFixed(1)}
                    </span>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <RideStatRow label="Rides Hosted"  value={hosted}    />
                <RideStatRow label="Completed"     value={completed} highlight />
                <RideStatRow label="Cancelled"     value={cancelled} danger />
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--color-text-muted)" }}>
                Based on {reviews} review{reviews !== 1 ? "s" : ""}
            </p>
        </div>
    );
}

function RideStatRow({ label, value, highlight, danger }) {
    return (
        <div className="flex items-center justify-between py-1.5" style={{ borderTop: "1px solid var(--color-border)" }}>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</span>
            <span
                className="text-sm font-bold"
                style={{
                    color: danger ? "var(--color-danger)" : highlight ? "var(--color-primary-dark)" : "var(--color-text-primary)",
                }}
            >
                {value.toLocaleString("en-IN")}
            </span>
        </div>
    );
}

/* ─── PRIMARY VEHICLE ─────────────────────────────────────── */
function PrimaryVehicleCard({ vehicles }) {
    const v = vehicles[0];

    if (!v) {
        return (
            <div
                className="rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-center"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", minHeight: "120px" }}
            >
                <Car size={28} style={{ color: "var(--color-text-muted)" }} />
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No vehicle added yet</p>
                <Link
                    to="/profile"
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: "var(--color-primary)", color: "var(--color-dark)" }}
                >
                    Add Vehicle
                </Link>
            </div>
        );
    }

    const carImg = v.images?.[0] || null;

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
            {/* Image / placeholder */}
            <div
                className="relative h-36 flex items-end"
                style={{
                    background: carImg
                        ? `linear-gradient(to top, rgba(13,31,19,0.85) 0%, transparent 60%), url(${carImg}) center/cover`
                        : "linear-gradient(135deg, #0d1f13 0%, #1a3a25 100%)",
                }}
            >
                {!carImg && (
                    <Car size={64} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" color="#13ec5b" />
                )}
                <div className="px-4 pb-3 z-10">
                    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#13ec5b" }}>
                        Primary Vehicle
                    </p>
                    <p className="text-base font-extrabold text-white">
                        {v.brand} {v.model} ({v.year})
                    </p>
                </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4">
                <VehicleDetail label="License Plate" value={v.licensePlate} />
                <VehicleDetail label="Color" value={v.color} />
                <VehicleDetail label="Total Seats" value={`${v.totalSeats} Adults`} />
            </div>
        </div>
    );
}

function VehicleDetail({ label, value }) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "var(--color-text-muted)" }}>{label}</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: "var(--color-text-primary)" }}>{value ?? "—"}</p>
        </div>
    );
}

/* ─── VERIFICATION ────────────────────────────────────────── */
function VerificationCard({ profile, user }) {
    const v = profile?.verification ?? {};
    const emailVerified   = v.emailVerified   ?? !!(user?.primaryEmailAddress?.emailAddress);
    const phoneVerified   = v.phoneVerified   ?? false;
    const licenseVerified = v.drivingLicenseVerified ?? false;
    const vehicleVerified = v.vehicleVerified ?? false;

    const navigate = useNavigate();

    return (
        <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
            <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
                Verification Status
            </h2>
            <div className="flex flex-col gap-2.5">
                <VerifyRow label="Email Verification"  done={emailVerified} />
                <VerifyRow label="Phone Number"        done={phoneVerified} />
                <VerifyRow label="Driving License"     done={licenseVerified} />
                <VerifyRow label="Vehicle Inspection"  done={vehicleVerified} pending={!vehicleVerified} />
            </div>
            <button
                onClick={() => navigate("/profile")}
                className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: "var(--color-dark)", color: "#ffffff" }}
            >
                Update Documents
            </button>
        </div>
    );
}

function VerifyRow({ label, done, pending }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                {done ? (
                    <CheckCircle2 size={15} style={{ color: "var(--color-primary)" }} />
                ) : (
                    <Circle size={15} style={{ color: "var(--color-text-muted)" }} />
                )}
                <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    {label}
                </span>
            </div>
            {pending && !done && (
                <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: "rgba(255,165,0,0.1)", color: "#b45309" }}
                >
                    PENDING
                </span>
            )}
        </div>
    );
}

/* ─── SHARED UTILITIES ────────────────────────────────────── */
function EmptyChart({ height, label }) {
    return (
        <div
            className="flex items-center justify-center rounded-xl"
            style={{ height, backgroundColor: "var(--color-surface-muted)", color: "var(--color-text-muted)", fontSize: "12px" }}
        >
            {label}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-primary)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading your dashboard…</p>
        </div>
    );
}

function ErrorBanner({ message }) {
    return (
        <div
            className="flex items-center gap-3 p-4 rounded-2xl mb-6"
            style={{ backgroundColor: "rgba(231,42,8,0.08)", border: "1px solid rgba(231,42,8,0.2)" }}
        >
            <AlertCircle size={18} style={{ color: "var(--color-danger)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--color-danger)" }}>{message}</p>
        </div>
    );
}

function DashboardFooter() {
    return (
        <footer
            className="w-full py-5 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
            style={{ backgroundColor: "var(--color-surface)", borderTop: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
        >
            <span>© {new Date().getFullYear()} CarPool AI. Driver Dashboard v1.0.0</span>
            <div className="flex items-center gap-4">
                <a href="#" className="hover:opacity-70">Support Center</a>
                <a href="#" className="hover:opacity-70">Privacy Policy</a>
                <a href="#" className="hover:opacity-70">Terms of Service</a>
            </div>
        </footer>
    );
}
