import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Calendar,
    ChevronDown,
    Filter,
    Plus,
    MapPin,
    Clock,
    TrendingUp,
    Wallet,
    Leaf,
    CheckCircle,
    Info,
    XCircle,
    Clock as PendingIcon,
    FileText,
    Loader2,
    CalendarDays,
    History,
    ArrowUpRight
} from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import Navbar from '../../components/layout/Navbar';
import { calculatePoolingCarbonSavedKg } from '../../utils/poolingCarbon';

const RiderRides = () => {
    const navigate = useNavigate();
    const { data, loading } = useProfile();
    const [activeTab, setActiveTab] = useState('upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const { upcomingRides, pastRides } = useMemo(() => {
        const allRides = data?.bookings || [];
        const now = new Date();
        const upcoming = [];
        const past = [];

        allRides.forEach((ride) => {
            const depTime = ride.ride?.schedule?.departureTime || ride.departureDate;
            const dep = depTime ? new Date(depTime) : null;
            const status = ride.status?.toUpperCase();

            if (status === 'CANCELLED' || status === 'COMPLETED' || (dep && dep < now)) {
                past.push(ride);
            } else {
                upcoming.push(ride);
            }
        });

        // Sort upcoming by departure (soonest first)
        upcoming.sort((a, b) => {
            const da = new Date(a.ride?.schedule?.departureTime || a.departureDate || 0);
            const db = new Date(b.ride?.schedule?.departureTime || b.departureDate || 0);
            return da - db;
        });

        // Sort past by departure (most recent first)
        past.sort((a, b) => {
            const da = new Date(a.ride?.schedule?.departureTime || a.departureDate || 0);
            const db = new Date(b.ride?.schedule?.departureTime || b.departureDate || 0);
            return db - da;
        });

        return { upcomingRides: upcoming, pastRides: past };
    }, [data?.bookings]);

    const filteredRides = useMemo(() => {
        const source = activeTab === 'upcoming' ? upcomingRides : pastRides;
        return source.filter((ride) => {
            const matchSearch = !searchQuery ||
                (ride.pickupLocation || ride.source || ride.ride?.route?.start?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (ride.dropoffLocation || ride.destination || ride.ride?.route?.end?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchStatus = statusFilter === 'all' || ride.status?.toUpperCase() === statusFilter.toUpperCase();
            return matchSearch && matchStatus;
        });
    }, [activeTab, upcomingRides, pastRides, searchQuery, statusFilter]);

    const stats = data?.computed || {
        completed: 0,
        cancelled: 0,
        totalFare: 0,
    };

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'COMPLETED': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'CANCELLED': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMED': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'PENDING': return <PendingIcon className="w-5 h-5 text-amber-500" />;
            case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-slate-400" />;
            case 'CANCELLED': return <XCircle className="w-5 h-5 text-rose-500" />;
            default: return null;
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
        { id: 'upcoming', label: 'Upcoming', icon: <CalendarDays className="w-4 h-4" />, count: upcomingRides.length },
        { id: 'past', label: 'Past Rides', icon: <History className="w-4 h-4" />, count: pastRides.length },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar />

            {/* Tabs + Filters Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-16 z-10">
                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-1 pt-3">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-t-xl transition-all relative
                                    ${activeTab === tab.id
                                        ? 'bg-slate-50 text-emerald-600'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === tab.id
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {tab.count}
                                </span>
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filters */}
                <div className="border-t border-slate-100 p-4">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="w-full md:w-1/3 relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search by location..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-1/4">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="CONFIRMED">Confirmed</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                        >
                            <Plus className="w-4 h-4" /> Book Ride
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Rides List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">
                                {activeTab === 'upcoming' ? 'Upcoming Rides' : 'Past Rides'}
                            </h1>
                            <p className="text-slate-500 mt-1">
                                {filteredRides.length} {activeTab === 'upcoming' ? 'upcoming ride(s)' : 'past ride(s)'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredRides.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                                    {activeTab === 'upcoming'
                                        ? <CalendarDays className="w-7 h-7 text-slate-300" />
                                        : <History className="w-7 h-7 text-slate-300" />
                                    }
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 mb-2">
                                    {activeTab === 'upcoming' ? 'No Upcoming Rides' : 'No Past Rides'}
                                </h3>
                                <p className="text-slate-500 font-medium text-sm">
                                    {activeTab === 'upcoming'
                                        ? 'Book a ride from the homepage to get started!'
                                        : 'Your completed and cancelled rides will appear here.'
                                    }
                                </p>
                                {activeTab === 'upcoming' && (
                                    <button
                                        onClick={() => navigate('/')}
                                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-all text-sm"
                                    >
                                        <ArrowUpRight className="w-4 h-4" /> Find a Ride
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredRides.map((ride, index) => {
                                const carbonSavedKg = calculatePoolingCarbonSavedKg(ride.ride || ride, { includeCurrentRider: true });
                                return (
                                <div key={ride.id || ride.bookingId || index} className={`bg-white rounded-2xl border border-slate-100 p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm hover:shadow-md transition-shadow ${ride.status?.toUpperCase() === 'CANCELLED' ? 'opacity-60' : ''}`}>
                                    <div className="flex flex-col items-center">
                                        <span className="text-lg font-bold text-slate-800">{ride.departureTime?.split(' ')[0] || '--:--'}</span>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">{ride.departureTime?.split(' ')[1] || ''}</span>
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-[120px]">
                                        <h3 className="text-lg font-black text-slate-900 leading-tight">
                                            {ride.pickupLocation || ride.source || ride.ride?.route?.start?.name || '—'}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">{ride.pickupAddress || ride.sourceDetails || ''}</p>
                                    </div>
                                    <div className="hidden md:flex flex-col items-center flex-1 max-w-[150px] relative px-4">
                                        <div className="w-full h-[2px] bg-slate-100 relative">
                                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                                                {getStatusIcon(ride.status)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-[120px] md:text-right">
                                        <h3 className="text-lg font-black text-slate-900 leading-tight">
                                            {ride.dropoffLocation || ride.destination || ride.ride?.route?.end?.name || '—'}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">{ride.dropoffAddress || ride.destinationDetails || ''}</p>
                                    </div>
                                    <div className="flex flex-col md:items-end min-w-[100px]">
                                        <span className="text-xs font-bold text-slate-400 mb-1">{ride.departureDate}</span>
                                        <span className="text-xl font-black text-slate-900">₹{(ride.totalFare || ride.farePaid || ride.price || 0).toFixed(2)}</span>
                                        <span className="mt-1 text-[11px] font-bold text-emerald-700">
                                            Saved {carbonSavedKg} kg CO2
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${getStatusStyle(ride.status)} uppercase`}>
                                            {ride.status}
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                                                <Info className="w-4 h-4" />
                                            </button>
                                            {ride.status?.toUpperCase() === 'COMPLETED' ? (
                                                <button className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                            ) : ride.status?.toUpperCase() !== 'CANCELLED' && (
                                                <button className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-rose-400 transition-colors">
                                                    <XCircle className="w-4 h-4" />
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

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Performance Dashboard</span>
                                <div className="bg-emerald-500/20 p-1.5 rounded-lg">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                </div>
                            </div>
                            <div className="mb-6">
                                <span className="text-slate-400 text-sm font-medium">Total Trips</span>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <h2 className="text-4xl font-black">{stats.completed + stats.cancelled}</h2>
                                    <span className="text-emerald-400 text-xs font-bold">+{stats.completed} confirmed</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-slate-400 text-[10px] font-black tracking-widest uppercase">Spent Overall</span>
                                    <p className="text-xl font-black mt-1">₹{stats.totalFare.toLocaleString()}</p>
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
                                    <h4 className="font-bold text-slate-900">Trust Score</h4>
                                    <p className="text-sm text-slate-500">{stats.trustScore || '5.0'}/5.0 based on last 10 rides</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-amber-100 p-3 rounded-full h-fit">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Upcoming Soon</h4>
                                    <p className="text-sm text-slate-500">
                                        {upcomingRides[0]?.pickupLocation || upcomingRides[0]?.source || upcomingRides[0]?.ride?.route?.start?.name || 'No upcoming rides'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-blue-100 p-3 rounded-full h-fit">
                                    <Wallet className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Savings</h4>
                                    <p className="text-sm text-slate-500">Shared costs saved you ₹{Math.floor(stats.totalFare * 0.3)} this month</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-emerald-100 p-3 rounded-full h-fit">
                                    <Leaf className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Environment Hero</h4>
                                    <p className="text-sm text-slate-500">You're helping reduce carbon footprint!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiderRides;
