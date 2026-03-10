import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { GoogleMap, useJsApiLoader, Autocomplete, DirectionsRenderer } from "@react-google-maps/api";
import { MapPin, Calendar, Clock, Car, Users, DollarSign, Settings, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Navbar from "../../components/layout/Navbar.jsx";
import Footer from "../../components/layout/Footer.jsx";
import { useProfile } from "../../hooks/useProfile.js";
import { createRide, updateRide } from "../../lib/api.js";

const LIBRARIES = ["places"];
const MAP_CONTAINER_STYLE = { width: "100%", height: "100%", borderRadius: "1rem" };
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };

function latLngToGrid(lat, lng, size = 0.05) {
    const latIdx = Math.floor(lat / size + 1e-10);
    const lngIdx = Math.floor(lng / size + 1e-10);
    return `${latIdx}_${lngIdx}`;
}

export default function CreateRidePage() {
    const { user, isLoaded: clerkLoaded } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const rideToEdit = location.state?.rideToEdit || location.state?.duplicateFromRide || null;
    const { data: profileData, loading: profileLoading } = useProfile();

    const { isLoaded: mapsLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });

    const [pickup, setPickup] = useState(null);
    const [drop, setDrop] = useState(null);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [seats, setSeats] = useState(4);
    const [baseFare, setBaseFare] = useState("");
    const [pricePerKm, setPricePerKm] = useState("10");
    const [selectedVehicleId, setSelectedVehicleId] = useState("");
    const [preferences, setPreferences] = useState({ smokingAllowed: false, petsAllowed: false, max2Allowed: true });

    const [directions, setDirections] = useState(null);
    const [routeDetails, setRouteDetails] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const pickupRef = useRef(null);
    const dropRef = useRef(null);

    useEffect(() => {
        if (!rideToEdit) return;

        const departureRaw = rideToEdit.schedule?.departureTime || rideToEdit.departureDate;
        const departure = departureRaw ? new Date(departureRaw) : null;

        if (departure && !Number.isNaN(departure.getTime())) {
            setDate(departure.toISOString().slice(0, 10));
            setTime(departure.toTimeString().slice(0, 5));
        }

        if (rideToEdit.seats?.total) {
            setSeats(rideToEdit.seats.total);
        } else if (rideToEdit.seatsAvailable) {
            setSeats(rideToEdit.seatsAvailable);
        }

        const baseFareFromRide = rideToEdit.pricing?.baseFare ?? rideToEdit.pricePerSeat;
        if (baseFareFromRide !== undefined && baseFareFromRide !== null) {
            setBaseFare(String(baseFareFromRide));
        }
        if (rideToEdit.pricing?.pricePerKm !== undefined && rideToEdit.pricing?.pricePerKm !== null) {
            setPricePerKm(String(rideToEdit.pricing.pricePerKm));
        }

        if (rideToEdit.preferences) {
            setPreferences((prev) => ({ ...prev, ...rideToEdit.preferences }));
        }

        if (rideToEdit.route?.start) {
            setPickup({
                name: rideToEdit.route.start.name || "Pickup",
                lat: rideToEdit.route.start.lat ?? rideToEdit.route.start.location?.coordinates?.[1],
                lng: rideToEdit.route.start.lng ?? rideToEdit.route.start.location?.coordinates?.[0],
            });
        }
        if (rideToEdit.route?.end) {
            setDrop({
                name: rideToEdit.route.end.name || "Drop",
                lat: rideToEdit.route.end.lat ?? rideToEdit.route.end.location?.coordinates?.[1],
                lng: rideToEdit.route.end.lng ?? rideToEdit.route.end.location?.coordinates?.[0],
            });
        }
    }, [rideToEdit]);

    useEffect(() => {
        if (profileData?.vehicles?.length > 0 && !selectedVehicleId) {
            setSelectedVehicleId(profileData.vehicles[0]._id || profileData.vehicles[0].licensePlate);
        }
    }, [profileData, selectedVehicleId]);

    const calculateRoute = useCallback(() => {
        if (!pickup || !drop || !window.google) return;
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
            {
                origin: { lat: pickup.lat, lng: pickup.lng },
                destination: { lat: drop.lat, lng: drop.lng },
                travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === "OK") {
                    setDirections(result);
                    const leg = result.routes[0].legs[0];
                    setRouteDetails({
                        distanceText: leg.distance.text,
                        durationText: leg.duration.text,
                        distanceKm: leg.distance.value / 1000,
                        durationMins: Math.ceil(leg.duration.value / 60),
                        encodedPolyline: result.routes[0].overview_polyline,
                        path: result.routes[0].overview_path,
                    });
                } else {
                    setError("Could not calculate route. Please try different addresses.");
                }
            }
        );
    }, [pickup, drop]);

    useEffect(() => {
        calculateRoute();
    }, [calculateRoute, mapsLoaded]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!directions || !routeDetails) {
            setError("Please wait for the route to be calculated.");
            return;
        }

        const selectedVeh = profileData?.vehicles?.find(v => v._id === selectedVehicleId || v.licensePlate === selectedVehicleId);
        if (!selectedVeh) {
            setError("Please select a valid vehicle.");
            return;
        }

        if (!date || !time) {
            setError("Please select departure date and time.");
            return;
        }

        try {
            setSubmitting(true);

            // Compute grids covered
            const grids = new Set();
            routeDetails.path.forEach(pt => {
                grids.add(latLngToGrid(pt.lat(), pt.lng()));
            });

            // Combine date and time
            const departureTime = new Date(`${date}T${time}`).toISOString();

            const payload = {
                driver: {
                    userId: user.id,
                    name: user.fullName || "Driver",
                    profileImage: user.imageUrl,
                    rating: profileData?.rating?.average || 5.0
                },
                vehicle: {
                    brand: selectedVeh.brand,
                    model: selectedVeh.model,
                    year: Number(selectedVeh.year),
                    color: selectedVeh.color,
                    licensePlate: selectedVeh.licensePlate
                },
                route: {
                    start: { name: pickup.name, lat: pickup.lat, lng: pickup.lng },
                    end: { name: drop.name, lat: drop.lat, lng: drop.lng },
                    encodedPolyline: routeDetails.encodedPolyline,
                    gridsCovered: Array.from(grids)
                },
                schedule: {
                    departureTime
                },
                pricing: {
                    baseFare: Number(baseFare),
                    pricePerKm: Number(pricePerKm)
                },
                seats: {
                    total: Number(seats),
                    available: Number(seats)
                },
                preferences,
                metrics: {
                    totalDistanceKm: routeDetails.distanceKm,
                    durationMinutes: routeDetails.durationMins
                }
            };

            if (rideToEdit?._id) {
                await updateRide(rideToEdit._id, { ...payload, driverUserId: user.id });
            } else {
                await createRide(payload);
            }
            navigate("/my-rides");

        } catch (err) {
            setError(err.message || `Failed to ${rideToEdit?._id ? "update" : "create"} ride.`);
        } finally {
            setSubmitting(false);
        }
    };

    if (!clerkLoaded || profileLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;
    }

    const estimatedFare = routeDetails ? Number(baseFare || 0) + (routeDetails.distanceKm * Number(pricePerKm || 0)) : 0;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navbar />
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Form Side */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate("/my-rides")} className="p-2 bg-white rounded-xl shadow-sm hover:bg-slate-50 transition-colors border border-slate-200">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">{rideToEdit?._id ? "Edit Ride" : "Offer a Ride"}</h1>
                            <p className="text-sm font-medium text-slate-500">{rideToEdit?._id ? "Update your route, timing and pricing" : "Publish your route and earn money"}</p>
                        </div>
                    </div>

                    {rideToEdit && (
                        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold">
                            Editing an existing upcoming ride. Save to apply your changes.
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-bold">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col gap-6">

                        {/* Route section */}
                        <div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500" /> Route Details</h2>
                            <div className="flex flex-col gap-4">
                                {mapsLoaded && (
                                    <>
                                        <Autocomplete onPlaceChanged={() => {
                                            const place = pickupRef.current?.getPlace();
                                            if (place?.geometry?.location) {
                                                setPickup({
                                                    name: place.formatted_address || place.name,
                                                    lat: place.geometry.location.lat(),
                                                    lng: place.geometry.location.lng()
                                                });
                                            }
                                        }} onLoad={a => pickupRef.current = a}>
                                            <input required type="text" placeholder="Pickup Location" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors" />
                                        </Autocomplete>
                                        <Autocomplete onPlaceChanged={() => {
                                            const place = dropRef.current?.getPlace();
                                            if (place?.geometry?.location) {
                                                setDrop({
                                                    name: place.formatted_address || place.name,
                                                    lat: place.geometry.location.lat(),
                                                    lng: place.geometry.location.lng()
                                                });
                                            }
                                        }} onLoad={a => dropRef.current = a}>
                                            <input required type="text" placeholder="Drop-off Destination" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors" />
                                        </Autocomplete>
                                    </>
                                )}
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Date & Time */}
                        <div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-500" /> Schedule</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Departure Date</label>
                                    <div className="relative">
                                        <Calendar className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
                                        <input required type="date" min={new Date().toISOString().split('T')[0]} value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Departure Time</label>
                                    <div className="relative">
                                        <Clock className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                        <input required type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {["07:00", "09:00", "12:00", "18:00", "21:00"].map((slot) => (
                                    <button
                                        key={slot}
                                        type="button"
                                        onClick={() => setTime(slot)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${time === slot ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-400"}`}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Vehicle & Pricing */}
                        <div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Car className="w-4 h-4 text-emerald-500" /> Vehicle & Capacity</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Select Vehicle</label>
                                    <select required value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors">
                                        {profileData?.vehicles?.length === 0 ? (
                                            <option value="" disabled>No vehicles registered</option>
                                        ) : (
                                            profileData?.vehicles?.map(v => (
                                                <option key={v._id || v.licensePlate} value={v._id || v.licensePlate}>{v.brand} {v.model} ({v.licensePlate})</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Available Seats</label>
                                    <input required type="number" min="1" max="8" value={seats} onChange={e => setSeats(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Base Fare (₹)</label>
                                    <input required type="number" min="0" placeholder="e.g. 500" value={baseFare} onChange={e => setBaseFare(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Per KM ({`\u20B9`})</label>
                                    <input required type="number" min="0" step="0.1" placeholder="e.g. 10" value={pricePerKm} onChange={e => setPricePerKm(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors" />
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Preferences */}
                        <div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-emerald-500" /> Ride Preferences</h2>
                            <div className="grid gap-3">
                                {Object.entries({
                                    petsAllowed: `Pets allowed ${"\u{1F43E}"}`,
                                    smokingAllowed: `Smoking allowed ${"\u{1F6AC}"}`,
                                    max2Allowed: `Max 2 in back seat ${"\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1}"}`,
                                }).map(([key, label]) => (
                                    <label key={key} className="flex items-center gap-3 cursor-pointer bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                        <input type="checkbox" checked={preferences[key]} onChange={e => setPreferences({ ...preferences, [key]: e.target.checked })} className="w-4 h-4 text-emerald-500 border-slate-300 rounded focus:ring-emerald-500" />
                                        <span className="text-sm font-bold text-slate-700">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !routeDetails || profileData?.vehicles?.length === 0}
                            className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 px-6 rounded-xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                            {submitting ? (rideToEdit?._id ? "Saving Changes..." : "Publishing Ride...") : (rideToEdit?._id ? "Save Ride Changes" : "Publish Ride Offer")}
                        </button>
                    </form>
                </div>

                {/* Right side: Map & Summary */}
                <div className="flex flex-col gap-6 sticky top-24 h-[calc(100vh-8rem)]">
                    {/* Route Info Card */}
                    {routeDetails && (
                        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl w-full">
                            <h3 className="text-[10px] font-black tracking-widest uppercase text-emerald-400 mb-4 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Trip Summary
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold mb-1">Total Distance</p>
                                    <p className="text-xl font-black">{routeDetails.distanceText}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold mb-1">Estimated Time</p>
                                    <p className="text-xl font-black">{routeDetails.durationText}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold mb-1">Estimated Fare</p>
                                    <p className="text-xl font-black text-emerald-400">{`\u20B9`}{estimatedFare.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-xs font-bold text-slate-300">
                                <span>Base: {`\u20B9`}{Number(baseFare || 0).toFixed(2)}</span>
                                <span>Per km: {`\u20B9`}{Number(pricePerKm || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 rounded-3xl overflow-hidden shadow-sm border border-slate-200 bg-white relative hidden lg:block">
                        {mapsLoaded ? (
                            <GoogleMap
                                mapContainerStyle={MAP_CONTAINER_STYLE}
                                center={pickup ? { lat: pickup.lat, lng: pickup.lng } : DEFAULT_CENTER}
                                zoom={12}
                                options={{ disableDefaultUI: true, gestureHandling: "cooperative" }}
                            >
                                {directions && (
                                    <DirectionsRenderer
                                        directions={directions}
                                        options={{ polylineOptions: { strokeColor: "#10b981", strokeWeight: 6 } }}
                                    />
                                )}
                            </GoogleMap>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            </div>
                        )}
                    </div>

                    {routeDetails && (
                        <div className="grid grid-cols-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 text-center border-r border-slate-100">
                                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Distance</p>
                                <p className="text-xl font-black text-slate-900 mt-1">{routeDetails.distanceKm.toFixed(1)} km</p>
                            </div>
                            <div className="p-4 text-center border-r border-slate-100">
                                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Duration</p>
                                <p className="text-xl font-black text-slate-900 mt-1">{routeDetails.durationMins} min</p>
                            </div>
                            <div className="p-4 text-center">
                                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Est. Fare</p>
                                <p className="text-xl font-black text-emerald-600 mt-1">{`\u20B9`}{estimatedFare.toFixed(2)}</p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
            <Footer />
        </div>
    );
}
