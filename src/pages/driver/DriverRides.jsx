import React, { useState, useEffect } from 'react';
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
    Users,
    Car
} from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { cancelRide } from '../../lib/api';
import Navbar from '../../components/layout/Navbar';

const DriverRides = () => {
    const navigate = useNavigate();
    const { data, loading, error, role } = useProfile();
    const [filteredRides, setFilteredRides] = useState([]);
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        if (data?.rides) {
            setFilteredRides(data.rides);
        }
    }, [data]);

    const handleCancel = async (rideId) => {
        if (!window.confirm("Are you sure you want to cancel this ride offer?")) return;
        setCancellingId(rideId);
        try {
            await cancelRide(rideId);
            // Refresh would normally happen via re-fetch in useProfile or local state update
            setFilteredRides(prev => prev.map(r => r.id === rideId ? { ...r, status: 'CANCELLED' } : r));
        } catch (err) {
            alert("Failed to cancel ride: " + err.message);
        } finally {
            setCancellingId(null);
        }
    };

    const stats = data?.stats || {
        totalRides: 0,
        earnings: 0,
        completedRides: 0,
    };

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMED': case 'OPEN': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'COMPLETED': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'CANCELLED': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMED': case 'OPEN': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
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

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar />
            <div className="bg-white border-b border-slate-200 sticky top-16 z-10 p-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="w-full md:w-1/3 relative">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Search Offers</span>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by destination..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-1/4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Date Offered</span>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-1/4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Offer Status</span>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <select className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <option>All Offers</option>
                                <option>Open</option>
                                <option>Full</option>
                                <option>Completed</option>
                                <option>Cancelled</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        </div>
                    </div>
                    <button className="w-full md:w-auto px-8 py-2 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2">
                        <Search className="w-4 h-4" /> Filter
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">Driver Dashboard</h1>
                            <p className="text-slate-500 mt-1">Managing {filteredRides.length} ride offers</p>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                        >
                            <Plus className="w-5 h-5" /> Create New Ride
                        </button>
                    </div>
                    <div className="space-y-4">
                        {filteredRides.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Car className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-medium">No ride offers found. Start earning by creating your first ride!</p>
                            </div>
                        ) : (
                            filteredRides.map((ride) => (
                                <div key={ride.id} className={`bg-white rounded-2xl border border-slate-100 p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm hover:shadow-md transition-shadow ${ride.status?.toUpperCase() === 'CANCELLED' ? 'opacity-60' : ''}`}>
                                    <div className="flex flex-col items-center">
                                        <span className="text-lg font-bold text-slate-800">{ride.departureTime?.split(' ')[0] || '--:--'}</span>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">{ride.departureTime?.split(' ')[1] || ''}</span>
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-[120px]">
                                        <h3 className="text-lg font-black text-slate-900 leading-tight">{ride.pickupLocation}</h3>
                                        <p className="text-xs text-slate-400 font-medium truncate max-w-[200px]">{ride.pickupAddress}</p>
                                    </div>
                                    <div className="hidden md:flex flex-col items-center flex-1 max-w-[150px] relative px-4">
                                        <div className="w-full h-[2px] bg-slate-100 relative">
                                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                                                {getStatusIcon(ride.status)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-[120px] md:text-right">
                                        <h3 className="text-lg font-black text-slate-900 leading-tight">{ride.dropoffLocation}</h3>
                                        <p className="text-xs text-slate-400 font-medium truncate max-w-[200px]">{ride.dropoffAddress}</p>
                                    </div>
                                    <div className="flex flex-col md:items-end min-w-[100px]">
                                        <span className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
                                            <Users className="w-3 h-3" /> {ride.seatsAvailable} seats
                                        </span>
                                        <span className="text-xl font-black text-slate-900">${(ride.pricePerSeat || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${getStatusStyle(ride.status)} uppercase`}>
                                            {ride.status}
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                                                <Info className="w-4 h-4" />
                                            </button>
                                            {ride.status?.toUpperCase() !== 'CANCELLED' && ride.status?.toUpperCase() !== 'COMPLETED' && (
                                                <button
                                                    disabled={cancellingId === ride.id}
                                                    onClick={() => handleCancel(ride.id)}
                                                    className="p-2 bg-rose-50 rounded-full hover:bg-rose-100 text-rose-500 transition-colors disabled:opacity-50"
                                                >
                                                    {cancellingId === ride.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
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
                                    <h2 className="text-4xl font-black">${stats.earnings?.toLocaleString() || '0'}</h2>
                                    <span className="text-emerald-400 text-xs font-bold">Total Payout</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-slate-400 text-[10px] font-black tracking-widest uppercase">Trips Hosted</span>
                                    <p className="text-xl font-black mt-1">{stats.totalRides || '0'}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] font-black tracking-widest uppercase">Success Rate</span>
                                    <p className="text-xl font-black mt-1 text-emerald-400">
                                        {stats.totalRides > 0 ? Math.round((stats.completedRides / stats.totalRides) * 100) : '100'}%
                                    </p>
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
                                    <p className="text-sm text-slate-500">{data?.rating?.averageRating || '5.0'}/5.0 from {data?.rating?.totalRatings || 0} reviews</p>
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
                                    <h4 className="font-bold text-slate-900">Upcoming Ride</h4>
                                    <p className="text-sm text-slate-500">
                                        {filteredRides.find(r => r.status?.toUpperCase() === 'OPEN')?.pickupLocation || 'No upcoming offers'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverRides;
