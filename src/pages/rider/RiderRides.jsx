import React, { useState } from 'react';
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
    FileText
} from 'lucide-react';

const RiderRides = () => {
    const [rides] = useState([
        {
            id: 1,
            source: "London",
            sourceDetails: "Victoria Coach Station",
            destination: "Manchester",
            destinationDetails: "Piccadilly Gardens",
            departureTime: "14:30 PM",
            departureDate: "12 Oct, 2023",
            price: 45.00,
            status: "CONFIRMED",
            type: "car"
        },
        {
            id: 2,
            source: "Paris",
            sourceDetails: "Gare du Nord",
            destination: "Lyon",
            destinationDetails: "Lyon-Part-Dieu",
            departureTime: "09:15 AM",
            departureDate: "15 Oct, 2023",
            price: 32.00,
            status: "PENDING",
            type: "wait"
        },
        {
            id: 3,
            source: "Berlin",
            sourceDetails: "Alexanderplatz",
            destination: "Munich",
            destinationDetails: "Hauptbahnhof",
            departureTime: "18:00 PM",
            departureDate: "08 Oct, 2023",
            price: 85.00,
            status: "COMPLETED",
            type: "check"
        },
        {
            id: 4,
            source: "Rome",
            sourceDetails: "Termini Station",
            destination: "Milan",
            destinationDetails: "Centrale",
            departureTime: "11:00 AM",
            departureDate: "05 Oct, 2023",
            price: 50.00,
            status: "CANCELLED",
            type: "cancel"
        }
    ]);

    const stats = {
        totalTrips: 24,
        tripsThisWeek: 2,
        totalSpent: 1240,
        savedCO2: 120,
        trustScore: 4.9
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'COMPLETED': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'CANCELLED': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'CONFIRMED': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'PENDING': return <PendingIcon className="w-5 h-5 text-amber-500" />;
            case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-slate-400" />;
            case 'CANCELLED': return <XCircle className="w-5 h-5 text-rose-500" />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 p-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="w-full md:w-1/3 relative">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Search by Location</span>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Enter city, station or landmark..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-1/4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Filter by Date</span>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-1/4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Status</span>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <select className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <option>All Statuses</option>
                                <option>Confirmed</option>
                                <option>Pending</option>
                                <option>Completed</option>
                                <option>Cancelled</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        </div>
                    </div>
                    <button className="w-full md:w-auto px-8 py-2 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2">
                        <Search className="w-4 h-4" /> Apply
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">My Rides</h1>
                            <p className="text-slate-500 mt-1">Showing {rides.length} rides for current criteria</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200">
                            <Plus className="w-5 h-5" /> Book New Ride
                        </button>
                    </div>
                    <div className="space-y-4">
                        {rides.map((ride) => (
                            <div key={ride.id} className={`bg-white rounded-2xl border border-slate-100 p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm hover:shadow-md transition-shadow ${ride.status === 'CANCELLED' ? 'opacity-60' : ''}`}>
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-bold text-slate-800">{ride.departureTime.split(' ')[0]}</span>
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">{ride.departureTime.split(' ')[1]}</span>
                                </div>
                                <div className="flex flex-col flex-1 min-w-[120px]">
                                    <h3 className="text-lg font-black text-slate-900 leading-tight">{ride.source}</h3>
                                    <p className="text-xs text-slate-400 font-medium">{ride.sourceDetails}</p>
                                </div>
                                <div className="hidden md:flex flex-col items-center flex-1 max-w-[150px] relative px-4">
                                    <div className="w-full h-[2px] bg-slate-100 relative">
                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                                            {getStatusIcon(ride.status)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col flex-1 min-w-[120px] md:text-right">
                                    <h3 className="text-lg font-black text-slate-900 leading-tight">{ride.destination}</h3>
                                    <p className="text-xs text-slate-400 font-medium">{ride.destinationDetails}</p>
                                </div>
                                <div className="flex flex-col md:items-end min-w-[100px]">
                                    <span className="text-xs font-bold text-slate-400 mb-1">{ride.departureDate}</span>
                                    <span className="text-xl font-black text-slate-900">${ride.price.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${getStatusStyle(ride.status)} uppercase`}>
                                        {ride.status}
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                                            <Info className="w-4 h-4" />
                                        </button>
                                        {ride.status === 'COMPLETED' ? (
                                            <button className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                                                <FileText className="w-4 h-4" />
                                            </button>
                                        ) : ride.status !== 'CANCELLED' && (
                                            <button className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-rose-400 transition-colors">
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
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
                                    <h2 className="text-4xl font-black">{stats.totalTrips}</h2>
                                    <span className="text-emerald-400 text-xs font-bold">+{stats.tripsThisWeek} this week</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-slate-400 text-[10px] font-black tracking-widest uppercase">Spent Overall</span>
                                    <p className="text-xl font-black mt-1">${stats.totalSpent.toLocaleString()}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] font-black tracking-widest uppercase">Saved CO2</span>
                                    <p className="text-xl font-black mt-1 text-emerald-400">{stats.savedCO2}kg</p>
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
                                    <p className="text-sm text-slate-500">{stats.trustScore}/5.0 based on last 10 rides</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-amber-100 p-3 rounded-full h-fit">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Upcoming Soon</h4>
                                    <p className="text-sm text-slate-500">London to Manchester in 2 days</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-blue-100 p-3 rounded-full h-fit">
                                    <Wallet className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Earnings Saved</h4>
                                    <p className="text-sm text-slate-500">Shared costs saved you $340 this month</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-emerald-100 p-3 rounded-full h-fit">
                                    <Leaf className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Environment Hero</h4>
                                    <p className="text-sm text-slate-500">You're in the top 5% of CO2 savers!</p>
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
