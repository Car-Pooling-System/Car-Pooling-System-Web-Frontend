import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowUpRight,
    CalendarDays,
    Car,
    CheckCircle,
    ChevronDown,
    Clock,
    Filter,
    History,
    Info,
    Loader2,
    MapPin,
    PencilLine,
    Plus,
    Search,
    TrendingUp,
    Users,
    Wallet,
    X,
    XCircle,
} from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import { useProfile } from "../../hooks/useProfile";
import { cancelRide } from "../../lib/api";

function getDepartureDate(ride) {
    const depTime = ride?.schedule?.departureTime || ride?.departureDate || ride?.departureTime;
    if (!depTime) return null;
    const parsed = new Date(depTime);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
}

function formatRideTiming(ride) {
    const departure = getDepartureDate(ride);
    if (!departure) return { day: "--", date: "Date not set", time: "--:--" };
    return {
        day: departure.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase(),
        date: departure.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        time: departure.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
}

function getStatusStyle(status) {
    switch ((status || "").toUpperCase()) {
        case "CONFIRMED":
        case "OPEN":
        case "SCHEDULED":
            return "bg-emerald-100 text-emerald-700 border-emerald-200";
        case "PENDING":
            return "bg-amber-100 text-amber-700 border-amber-200";
        case "COMPLETED":
            return "bg-slate-100 text-slate-600 border-slate-200";
        case "CANCELLED":
            return "bg-rose-100 text-rose-700 border-rose-200";
        default:
            return "bg-gray-100 text-gray-600 border-gray-200";
    }
}

export default function DriverRides() {
    const navigate = useNavigate();
    const { data, loading } = useProfile();
    const [activeTab, setActiveTab] = useState("upcoming");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [cancellingId, setCancellingId] = useState(null);
    const [selectedRide, setSelectedRide] = useState(null);

    const { upcomingRides, pastRides } = useMemo(() => {
        const allRides = data?.rides || [];
        const now = new Date();
        const upcoming = [];
        const past = [];

        allRides.forEach((ride) => {
            const dep = getDepartureDate(ride);
            const status = (ride.status || "").toUpperCase();
            if (status === "CANCELLED" || status === "COMPLETED" || (dep && dep < now)) {
                past.push(ride);
            } else {
                upcoming.push(ride);
            }
        });

        upcoming.sort((a, b) => (getDepartureDate(a)?.getTime() || 0) - (getDepartureDate(b)?.getTime() || 0));
        past.sort((a, b) => (getDepartureDate(b)?.getTime() || 0) - (getDepartureDate(a)?.getTime() || 0));

        return { upcomingRides: upcoming, pastRides: past };
    }, [data?.rides]);

    const filteredRides = useMemo(() => {
        const source = activeTab === "upcoming" ? upcomingRides : pastRides;
        return source.filter((ride) => {
            const startName = ride.pickupLocation || ride.route?.start?.name || "";
            const endName = ride.dropoffLocation || ride.route?.end?.name || "";
            const matchesSearch =
                !searchQuery ||
                startName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                endName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "all" || (ride.status || "").toUpperCase() === statusFilter.toUpperCase();
            return matchesSearch && matchesStatus;
        });
    }, [activeTab, upcomingRides, pastRides, searchQuery, statusFilter]);

    const stats = data?.stats || { totalRides: 0, earnings: 0 };

    const handleCancel = async (rideId) => {
        if (!window.confirm("Are you sure you want to cancel this ride offer?")) return;
        setCancellingId(rideId);
        try {
            await cancelRide(rideId);
            window.location.reload();
        } catch (err) {
            alert(`Failed to cancel ride: ${err.message}`);
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    const tabs = [
        { id: "upcoming", label: "Upcoming", icon: <CalendarDays className="w-4 h-4" />, count: upcomingRides.length },
        { id: "past", label: "Past Rides", icon: <History className="w-4 h-4" />, count: pastRides.length },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar />

            <div className="bg-white border-b border-slate-200 sticky top-16 z-10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-1 pt-3">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-t-xl transition-all relative ${activeTab === tab.id ? "bg-slate-50 text-emerald-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"}`}
                            >
                                {tab.icon}
                                {tab.label}
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === tab.id ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                                    {tab.count}
                                </span>
                                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-t border-slate-100 p-4">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="w-full md:w-1/3 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by destination..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="w-full md:w-1/4 relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="all">All Offers</option>
                                <option value="OPEN">Open</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        </div>
                        <button
                            onClick={() => navigate("/driver/create-ride")}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-200"
                        >
                            <Plus className="w-4 h-4" /> Create Ride
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">{activeTab === "upcoming" ? "Upcoming Rides" : "Past Rides"}</h1>
                        <p className="text-slate-500 mt-1">{filteredRides.length} {activeTab === "upcoming" ? "upcoming offer(s)" : "past offer(s)"}</p>
                    </div>

                    <div className="space-y-4">
                        {filteredRides.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                                    {activeTab === "upcoming" ? <CalendarDays className="w-7 h-7 text-slate-300" /> : <History className="w-7 h-7 text-slate-300" />}
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 mb-2">{activeTab === "upcoming" ? "No Upcoming Rides" : "No Past Rides"}</h3>
                                <p className="text-slate-500 font-medium text-sm">{activeTab === "upcoming" ? "Create a ride offer to start earning!" : "Your completed and cancelled rides will appear here."}</p>
                                {activeTab === "upcoming" && (
                                    <button
                                        onClick={() => navigate("/driver/create-ride")}
                                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 text-sm"
                                    >
                                        <ArrowUpRight className="w-4 h-4" /> Create a Ride
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredRides.map((ride, index) => {
                                const rideId = ride.id || ride._id || index;
                                const timing = formatRideTiming(ride);
                                const isUpcoming = activeTab === "upcoming" && !["CANCELLED", "COMPLETED"].includes((ride.status || "").toUpperCase());
                                return (
                                    <div key={rideId} className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex flex-col md:flex-row md:items-center gap-5">
                                            <div className="rounded-xl px-4 py-3 border border-emerald-100 bg-emerald-50/70 min-w-[145px]">
                                                <p className="text-[11px] font-black tracking-widest text-emerald-700">{timing.day}</p>
                                                <p className="text-sm font-extrabold text-slate-900 mt-0.5">{timing.date}</p>
                                                <p className="text-sm font-bold text-slate-600 mt-1 flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" /> {timing.time}
                                                </p>
                                            </div>

                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">From</p>
                                                    <h3 className="text-lg font-black text-slate-900 leading-tight">{ride.pickupLocation || ride.route?.start?.name || "—"}</h3>
                                                </div>
                                                <div className="hidden md:flex justify-center">
                                                    <div className="w-16 h-[2px] bg-slate-200 relative">
                                                        <span className="absolute left-1/2 -translate-x-1/2 -top-[10px] bg-white px-2 text-emerald-500">
                                                            <MapPin className="w-4 h-4" />
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="md:text-right">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">To</p>
                                                    <h3 className="text-lg font-black text-slate-900 leading-tight">{ride.dropoffLocation || ride.route?.end?.name || "—"}</h3>
                                                </div>
                                            </div>

                                            <div className="md:text-right min-w-[130px]">
                                                <p className="text-xs font-bold text-slate-400 flex md:justify-end items-center gap-1">
                                                    <Users className="w-3 h-3" /> {ride.seatsAvailable ?? ride.seats?.available ?? 0} seats
                                                </p>
                                                <p className="text-2xl font-black text-slate-900 mt-1">₹{(ride.pricePerSeat || ride.pricing?.perSeat || 0).toFixed(2)}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${getStatusStyle(ride.status)} uppercase`}>
                                                {ride.status || "OPEN"}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedRide(ride)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                                                >
                                                    <Info className="w-3.5 h-3.5" /> Info
                                                </button>
                                                {isUpcoming && (
                                                    <button
                                                        onClick={() => navigate("/driver/create-ride", { state: { duplicateFromRide: ride } })}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold"
                                                    >
                                                        <PencilLine className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                )}
                                                {!["CANCELLED", "COMPLETED"].includes((ride.status || "").toUpperCase()) && (
                                                    <button
                                                        disabled={cancellingId === rideId}
                                                        onClick={() => handleCancel(rideId)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold disabled:opacity-50"
                                                    >
                                                        {cancellingId === rideId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Driver Earnings</span>
                                <div className="bg-emerald-500/20 p-1.5 rounded-lg">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                </div>
                            </div>
                            <div className="mb-6">
                                <span className="text-slate-400 text-sm font-medium">Total Revenue</span>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <h2 className="text-4xl font-black">₹{stats.earnings?.toLocaleString() || "0"}</h2>
                                    <span className="text-emerald-400 text-xs font-bold">Total Payout</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-slate-400 text-[10px] font-black tracking-widest uppercase">Trips Hosted</span>
                                    <p className="text-xl font-black mt-1">{stats.totalRides || "0"}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] font-black tracking-widest uppercase">Upcoming</span>
                                    <p className="text-xl font-black mt-1 text-emerald-400">{upcomingRides.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 mb-6">Quick Insights</h3>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="bg-emerald-100 p-3 rounded-full h-fit">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Rating</h4>
                                    <p className="text-sm text-slate-500">{data?.rating?.averageRating || "5.0"}/5.0 from {data?.rating?.totalRatings || 0} reviews</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-blue-100 p-3 rounded-full h-fit">
                                    <Car className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Active Vehicles</h4>
                                    <p className="text-sm text-slate-500">{data?.vehicles?.length || 0} registered vehicles</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-amber-100 p-3 rounded-full h-fit">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Next Ride</h4>
                                    <p className="text-sm text-slate-500">
                                        {upcomingRides[0]
                                            ? `${formatRideTiming(upcomingRides[0]).date}, ${formatRideTiming(upcomingRides[0]).time}`
                                            : "No upcoming offers"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-cyan-100 p-3 rounded-full h-fit">
                                    <Wallet className="w-5 h-5 text-cyan-700" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Average Fare</h4>
                                    <p className="text-sm text-slate-500">
                                        ₹{upcomingRides.length ? (upcomingRides.reduce((sum, ride) => sum + (ride.pricePerSeat || ride.pricing?.perSeat || 0), 0) / upcomingRides.length).toFixed(2) : "0.00"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {selectedRide && (
                <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900">Ride Information</h3>
                            <button onClick={() => setSelectedRide(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs font-black tracking-wider uppercase text-slate-400">From</p>
                                <p className="font-bold text-slate-800">{selectedRide.pickupLocation || selectedRide.route?.start?.name || "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black tracking-wider uppercase text-slate-400">To</p>
                                <p className="font-bold text-slate-800">{selectedRide.dropoffLocation || selectedRide.route?.end?.name || "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black tracking-wider uppercase text-slate-400">Departure</p>
                                <p className="font-bold text-slate-800">{formatRideTiming(selectedRide).date}</p>
                                <p className="text-slate-500">{formatRideTiming(selectedRide).time}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black tracking-wider uppercase text-slate-400">Seats</p>
                                <p className="font-bold text-slate-800">{selectedRide.seatsAvailable ?? selectedRide.seats?.available ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black tracking-wider uppercase text-slate-400">Price / Seat</p>
                                <p className="font-bold text-slate-800">₹{(selectedRide.pricePerSeat || selectedRide.pricing?.perSeat || 0).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black tracking-wider uppercase text-slate-400">Status</p>
                                <p className="font-bold text-slate-800">{selectedRide.status || "OPEN"}</p>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setSelectedRide(null)} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
