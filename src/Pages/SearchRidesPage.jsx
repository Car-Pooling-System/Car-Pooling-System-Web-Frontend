import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Loader2, ArrowLeft, MapPin, Clock, Calendar, Users, Car, CheckCircle2 } from "lucide-react";
import Navbar from "../components/layout/Navbar.jsx";
import Footer from "../components/layout/Footer.jsx";
import { searchRides, bookRide } from "../lib/api.js";
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from "@react-google-maps/api";

const LIBRARIES = ["places"];
const MAP_CONTAINER_STYLE = { width: "100%", height: "100%", borderRadius: "1rem" };
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };
const GOOGLE_MAPS_API_KEY =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "";

export default function SearchRidesPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isLoaded: clerkLoaded, isSignedIn, user } = useUser();

    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRide, setSelectedRide] = useState(null);
    const [booking, setBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    // Google Maps API
    const { isLoaded: mapsLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });

    // Picked route state for map preview
    const [directions, setDirections] = useState(null);

    const qs = {
        pickupLat: searchParams.get("pickupLat"),
        pickupLng: searchParams.get("pickupLng"),
        dropLat: searchParams.get("dropLat"),
        dropLng: searchParams.get("dropLng"),
        passengers: searchParams.get("passengers") || 1,
        date: searchParams.get("date"),
    };

    useEffect(() => {
        if (!qs.pickupLat || !qs.pickupLng || !qs.dropLat || !qs.dropLng) {
            setError("Missing search coordinates. Please use the search form from the homepage.");
            setLoading(false);
            return;
        }

        const fetchRides = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log("🚀 Calling searchRides with coordinates:", { lat: qs.pickupLat, lng: qs.pickupLng });
                const data = await searchRides({
                    pickupLat: qs.pickupLat,
                    pickupLng: qs.pickupLng,
                    dropLat: qs.dropLat,
                    dropLng: qs.dropLng,
                });

                // If there's a date filter, apply it locally
                let filtered = data;
                if (qs.date) {
                    const searchDate = new Date(qs.date).toISOString().split('T')[0];
                    filtered = data.filter(r => {
                        if (!r.schedule?.departureTime) return true;
                        const rideDate = new Date(r.schedule.departureTime).toISOString().split('T')[0];
                        return rideDate === searchDate;
                    });
                }

                // Filter by seats
                filtered = filtered.filter(r => r.seatsAvailable >= Number(qs.passengers));

                setRides(filtered);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch available rides. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchRides();
    }, [qs.pickupLat, qs.pickupLng, qs.dropLat, qs.dropLng, qs.date, qs.passengers]);

    // Draw route when a ride is selected
    useEffect(() => {
        if (selectedRide && mapsLoaded && window.google) {
            const directionsService = new window.google.maps.DirectionsService();
            // In a real app we'd decode polyline or at least draw between pickup/drop.
            // For now let's draw the full ride's start/end if available, or just the user's pickup/drop.
            directionsService.route(
                {
                    origin: { lat: Number(qs.pickupLat), lng: Number(qs.pickupLng) },
                    destination: { lat: Number(qs.dropLat), lng: Number(qs.dropLng) },
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === "OK") setDirections(result);
                }
            );
        } else {
            setDirections(null);
        }
    }, [selectedRide, mapsLoaded, qs.pickupLat, qs.pickupLng, qs.dropLat, qs.dropLng]);

    const handleBook = async () => {
        if (!isSignedIn || !user || !selectedRide) return;
        setBooking(true);
        try {
            const payload = {
                user: {
                    userId: user.id,
                    name: user.fullName || "Rider",
                    profileImage: user.imageUrl,
                    email: user.primaryEmailAddress?.emailAddress
                },
                pickup: { lat: Number(qs.pickupLat), lng: Number(qs.pickupLng) },
                drop: { lat: Number(qs.dropLat), lng: Number(qs.dropLng) }
            };
            await bookRide(selectedRide._id, payload);
            setBookingSuccess(true);
            setTimeout(() => {
                navigate("/my-rides");
            }, 3000);
        } catch (err) {
            const message = err?.message || "Failed to book ride";
            if (message.toLowerCase().includes("already booked")) {
                navigate("/my-rides");
                return;
            }
            alert(message);
        } finally {
            setBooking(false);
        }
    };

    if (!clerkLoaded) return <div className="min-h-screen grid items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-8 h-8" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navbar />
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left side: Results */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate("/")} className="p-2 bg-white rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">Available Rides</h1>
                            <p className="text-sm font-medium text-slate-500">
                                {rides.length} options found
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            <p className="font-bold text-slate-500">Searching for the best rides...</p>
                        </div>
                    ) : rides.length === 0 && !error ? (
                        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">No rides found</h3>
                            <p className="text-slate-500 text-sm font-medium">Try adjusting your time or location.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pb-8 pr-2 custom-scrollbar">
                            {rides.map(ride => (
                                <div
                                    key={ride._id}
                                    onClick={() => setSelectedRide(ride)}
                                    className={`bg-white rounded-2xl border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${selectedRide?._id === ride._id ? "border-emerald-500 scale-[1.01]" : "border-transparent"}`}
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={ride.driver?.profileImage || `https://ui-avatars.com/api/?name=${ride.driver?.name || 'D'}&bg=10b981&color=fff`}
                                                    alt="Driver"
                                                    className="w-12 h-12 rounded-full border border-slate-100 object-cover"
                                                />
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{ride.driver?.name || "Verified Driver"}</h3>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[10px] font-black tracking-wider text-amber-500 uppercase">⭐ {ride.driver?.rating || "4.8"}</span>
                                                        <span className="text-[10px] font-black tracking-wider text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full">KYC Verified</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-slate-900">₹{ride.estimate?.fare}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ride.estimate?.distanceKm?.toFixed(1) || 0} km</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-emerald-500" />
                                                <span className="font-medium text-slate-700">
                                                    {new Date(ride.schedule?.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                <span className="font-medium text-slate-700">
                                                    {new Date(ride.schedule?.departureTime).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Car className="w-4 h-4 text-indigo-500" />
                                                <span className="font-medium text-slate-700 truncate">
                                                    {ride.vehicle?.brand} {ride.vehicle?.model}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-amber-500" />
                                                <span className="font-medium text-slate-700">
                                                    {ride.seatsAvailable} seats left
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedRide?._id === ride._id && (
                                        <div className="bg-slate-50 px-5 py-4 border-t border-slate-100 rounded-b-2xl">
                                            {bookingSuccess ? (
                                                <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold py-2">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    Booking Confirmed!
                                                </div>
                                            ) : !isSignedIn ? (
                                                <Link
                                                    to="/sign-in"
                                                    className="w-full block text-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-all"
                                                >
                                                    Sign in to Book
                                                </Link>
                                            ) : (
                                                <button
                                                    onClick={handleBook}
                                                    disabled={booking}
                                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {booking && <Loader2 className="w-4 h-4 animate-spin" />}
                                                    {booking ? "Confirming..." : "Confirm & Book Ride"}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right side: Map */}
                <div className="sticky top-24 h-[calc(100vh-8rem)] rounded-3xl overflow-hidden shadow-sm border border-slate-200 bg-white hidden lg:block">
                    {mapsLoaded ? (
                        <GoogleMap
                            mapContainerStyle={MAP_CONTAINER_STYLE}
                            center={{ lat: Number(qs.pickupLat) || DEFAULT_CENTER.lat, lng: Number(qs.pickupLng) || DEFAULT_CENTER.lng }}
                            zoom={12}
                            options={{ disableDefaultUI: true, gestureHandling: "cooperative" }}
                        >
                            <Marker position={{ lat: Number(qs.pickupLat), lng: Number(qs.pickupLng) }} icon="https://maps.google.com/mapfiles/ms/icons/green-dot.png" />
                            <Marker position={{ lat: Number(qs.dropLat), lng: Number(qs.dropLng) }} icon="https://maps.google.com/mapfiles/ms/icons/red-dot.png" />
                            {directions && (
                                <DirectionsRenderer
                                    directions={directions}
                                    options={{ polylineOptions: { strokeColor: "#10b981", strokeWeight: 5 }, suppressMarkers: true }}
                                />
                            )}
                        </GoogleMap>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                    )}

                    <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <p className="text-xs font-bold text-slate-700 truncate">Your Route Preview</p>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">The highlighted route shows the estimated journey based on your pickup and dropoff coordinates.</p>
                    </div>
                </div>

            </div>
            <Footer />
        </div>
    );
}

// Custom Search Icon inline
function Search(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
    )
}
