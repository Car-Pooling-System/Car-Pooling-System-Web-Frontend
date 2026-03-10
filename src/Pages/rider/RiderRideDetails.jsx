import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
    ArrowLeft,
    Car,
    Clock,
    Loader2,
    MapPin,
    MessageCircle,
    Send,
    ShieldCheck,
    Star,
    Users,
    CalendarDays,
} from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { useProfile } from "../../hooks/useProfile";
import { createGroupConversation, getChatMessages, getRideDetails, sendRideChatMessage } from "../../lib/api";

function boolLabel(value) {
    return value ? "Allowed" : "Not allowed";
}

export default function RiderRideDetails() {
    const { rideId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useUser();
    const { data, loading: profileLoading } = useProfile();

    const [ride, setRide] = useState(null);
    const [estimate, setEstimate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [chatMessages, setChatMessages] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState(null);
    const [messageText, setMessageText] = useState("");
    const [sending, setSending] = useState(false);
    const [conversationId, setConversationId] = useState("");
    const socketRef = useRef(null);

    const selectedBooking = useMemo(() => {
        const byState = location.state?.booking;
        if (byState?.ride?._id === rideId) return byState;
        const bookings = data?.bookings || [];
        return bookings.find((b) => String(b?.ride?._id || b?.rideId) === String(rideId)) || null;
    }, [data?.bookings, location.state?.booking, rideId]);

    const riderBookingStatus = useMemo(() => {
        const bookingStatus = String(selectedBooking?.status || "").toLowerCase();
        if (bookingStatus === "confirmed") return "confirmed";
        if (bookingStatus === "requested") return "requested";

        const passengers = ride?.passengers || [];
        const mine = passengers.find((passenger) => String(passenger?.userId) === String(user?.id));
        if (mine) return String(mine.status || "").toLowerCase();

        const guestStatuses = passengers
            .filter((passenger) => String(passenger?.bookedBy) === String(user?.id))
            .map((passenger) => String(passenger.status || "").toLowerCase());

        if (guestStatuses.includes("confirmed")) return "confirmed";
        if (guestStatuses.includes("requested")) return "requested";

        return "";
    }, [ride?.passengers, selectedBooking?.status, user?.id]);

    const canUseChat = riderBookingStatus === "confirmed";

    useEffect(() => {
        let cancelled = false;
        async function fetchDetails() {
            try {
                setLoading(true);
                setError(null);
                const response = await getRideDetails(rideId);
                if (cancelled) return;
                setRide(response?.ride || null);
                setEstimate(response?.estimate || null);
            } catch (err) {
                if (cancelled) return;
                setError(err.message || "Failed to load ride details.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchDetails();
        return () => {
            cancelled = true;
        };
    }, [rideId]);

    useEffect(() => {
        if (!canUseChat) {
            setChatMessages([]);
            setChatLoading(false);
            setChatError(null);
            setConversationId("");
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        let cancelled = false;
        async function initChat() {
            try {
                setChatLoading(true);
                setChatError(null);

                const conversation = await createGroupConversation(rideId, user?.id);
                const convo = conversation?.conversation || conversation;
                const convoId = String(convo?._id || "");
                if (!convoId) {
                    throw new Error("Chat conversation unavailable.");
                }

                const response = await getChatMessages(convoId, 1, 50);
                if (cancelled) return;
                const messages = Array.isArray(response) ? response : response?.messages || [];
                setChatMessages(messages);
                setConversationId(convoId);

                // Match mobile chat flow: join room and receive real-time updates.
                try {
                    const socketModule = await import("https://cdn.socket.io/4.8.3/socket.io.esm.min.js");
                    if (cancelled) return;

                    const backendBase = String(import.meta.env.VITE_BACKEND_URL || "http://localhost:3000").trim().replace(/\/+$/, "");
                    const socket = socketModule.io(backendBase, {
                        transports: ["websocket", "polling"],
                        query: { userId: user?.id || "" },
                    });

                    socketRef.current = socket;
                    socket.emit("join-room", convoId);
                    socket.emit("mark-read", { conversationId: convoId });

                    socket.on("new-message", (msg) => {
                        const msgConvoId = String(msg?.conversationId || "");
                        if (msgConvoId !== convoId) return;
                        setChatMessages((prev) => {
                            if (prev.some((m) => String(m?._id) === String(msg?._id))) return prev;
                            return [...prev, msg];
                        });
                    });
                } catch {
                    // Real-time is optional for web fallback; polling snapshot still works.
                }
            } catch (err) {
                if (cancelled) return;
                setChatError(err.message || "Chat is not available right now.");
            } finally {
                if (!cancelled) setChatLoading(false);
            }
        }

        initChat();
        return () => {
            cancelled = true;
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [rideId, canUseChat, user?.id]);

    const handleSend = async () => {
        const text = messageText.trim();
        if (!canUseChat || !text || !user?.id || !conversationId) return;
        try {
            setSending(true);
            setChatError(null);
            const socket = socketRef.current;
            if (!socket) {
                const fallback = await sendRideChatMessage(rideId, { userId: user.id, text });
                const nextMessage = fallback?.message || fallback;
                if (nextMessage) setChatMessages((prev) => [...prev, nextMessage]);
                setMessageText("");
                return;
            }

            await new Promise((resolve, reject) => {
                socket.emit(
                    "send-message",
                    {
                        conversationId,
                        text,
                        senderName: user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" "),
                        senderImage: user?.imageUrl || "",
                    },
                    (ack) => {
                        if (!ack?.ok) {
                            reject(new Error(ack?.error || "Failed to send message."));
                            return;
                        }
                        const nextMessage = ack?.message;
                        if (nextMessage?._id) {
                            setChatMessages((prev) => {
                                if (prev.some((m) => String(m?._id) === String(nextMessage._id))) return prev;
                                return [...prev, nextMessage];
                            });
                        }
                        resolve();
                    },
                );
            });

            setMessageText("");
        } catch (err) {
            setChatError(err.message || "Failed to send message.");
        } finally {
            setSending(false);
        }
    };

    if (loading || profileLoading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-6xl mx-auto px-4 py-16 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            </div>
        );
    }

    if (error || !ride) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <button
                        onClick={() => navigate("/my-rides")}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to My Rides
                    </button>
                    <div className="bg-white border border-rose-200 text-rose-600 rounded-xl p-4 font-medium">
                        {error || "Ride not found."}
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const fare = selectedBooking?.farePaid ?? estimate?.fare ?? ride?.pricing?.baseFare ?? 0;
    const distanceKm = estimate?.distanceKm ?? ride?.metrics?.totalDistanceKm;
    const durationMins = ride?.metrics?.durationMinutes;
    const isVerified = !!ride?.driver?.isVerified;
    const departure = ride?.schedule?.departureTime ? new Date(ride.schedule.departureTime) : null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate("/my-rides")}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to My Rides
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h1 className="text-2xl font-black text-slate-900">Ride Details</h1>
                            <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                                {String(riderBookingStatus || "requested")}
                            </span>
                        </div>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-4">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Distance</p>
                                <p className="text-lg font-bold text-slate-900 mt-1">{distanceKm ? `${Number(distanceKm).toFixed(1)} km` : "-"}</p>
                            </div>
                            <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-white border border-cyan-100 p-4">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Time</p>
                                <p className="text-lg font-bold text-slate-900 mt-1">{durationMins ? `${durationMins} min` : "-"}</p>
                            </div>
                            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-4">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Fare</p>
                                <p className="text-lg font-bold text-slate-900 mt-1">Rs {Number(fare).toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">From</p>
                                <p className="font-semibold text-slate-900 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-emerald-500" />
                                    {ride?.route?.start?.name || "-"}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">To</p>
                                <p className="font-semibold text-slate-900 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-rose-500" />
                                    {ride?.route?.end?.name || "-"}
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 rounded-2xl border border-slate-200 p-4 bg-slate-50/60">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Departure</p>
                            <p className="font-semibold text-slate-900 flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-indigo-500" />
                                {departure ? departure.toLocaleString([], { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <h2 className="text-lg font-black text-slate-900">Driver</h2>
                        <div className="mt-4 flex items-start gap-4">
                            <img
                                src={ride?.driver?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(ride?.driver?.name || "D")}&background=10b981&color=fff`}
                                alt="Driver"
                                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                            />
                            <div className="flex-1">
                                <p className="font-bold text-slate-900">{ride?.driver?.name || "Driver"}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                    <span className={`px-2 py-1 rounded-full border font-bold ${isVerified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                        {isVerified ? "Verified Driver" : "Verification Pending"}
                                    </span>
                                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold flex items-center gap-1">
                                        <Star className="w-3 h-3" />
                                        {ride?.driver?.rating || 0}
                                    </span>
                                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                                        Trust {ride?.driver?.trustScore ?? 0}
                                    </span>
                                </div>
                                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    <div className="rounded-xl bg-slate-50 p-2 border border-slate-200">
                                        <p className="text-slate-500">Email</p>
                                        <p className="font-semibold">{ride?.driver?.verificationDetails?.email ? "Verified" : "No"}</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-2 border border-slate-200">
                                        <p className="text-slate-500">Phone</p>
                                        <p className="font-semibold">{ride?.driver?.verificationDetails?.phone ? "Verified" : "No"}</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-2 border border-slate-200">
                                        <p className="text-slate-500">License</p>
                                        <p className="font-semibold">{ride?.driver?.verificationDetails?.license ? "Verified" : "No"}</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-2 border border-slate-200">
                                        <p className="text-slate-500">Vehicle</p>
                                        <p className="font-semibold">{ride?.driver?.verificationDetails?.vehicle ? "Verified" : "No"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <h2 className="text-lg font-black text-slate-900">Vehicle & Preferences</h2>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60">
                                <p className="font-semibold text-slate-900 flex items-center gap-2">
                                    <Car className="w-4 h-4 text-emerald-500" />
                                    {ride?.vehicle?.brand || "-"} {ride?.vehicle?.model || ""}
                                </p>
                                <p className="text-sm text-slate-600 mt-2">Year: {ride?.vehicle?.year || "-"}</p>
                                <p className="text-sm text-slate-600">Color: {ride?.vehicle?.color || "-"}</p>
                                <p className="text-sm text-slate-600">Plate: {ride?.vehicle?.licensePlate || "-"}</p>
                                <p className="text-sm text-slate-600 mt-1">Luggage: {boolLabel(!!ride?.vehicle?.hasLuggageSpace)}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60">
                                <p className="font-semibold text-slate-900 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    Ride Preferences
                                </p>
                                <p className="text-sm text-slate-600 mt-2">Pets: {boolLabel(!!ride?.preferences?.petsAllowed)}</p>
                                <p className="text-sm text-slate-600">Smoking: {boolLabel(!!ride?.preferences?.smokingAllowed)}</p>
                                <p className="text-sm text-slate-600">Max 2 Backseat: {boolLabel(!!ride?.preferences?.max2Allowed)}</p>
                                <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    Seats available: {ride?.seats?.available ?? "-"} / {ride?.seats?.total ?? "-"}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <aside className="bg-white rounded-3xl border border-slate-200 p-5 h-fit lg:sticky lg:top-24 shadow-sm">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-emerald-500" />
                        Chat with Driver
                    </h2>
                    {!canUseChat ? (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                            <p className="text-sm font-semibold text-amber-700">
                                Chat unlocks after the driver confirms your booking.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="mt-4 h-80 overflow-y-auto border border-slate-200 rounded-2xl p-3 bg-gradient-to-b from-slate-50 to-white">
                                {chatLoading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                                    </div>
                                ) : chatMessages.length === 0 ? (
                                    <p className="text-sm text-slate-500">No messages yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {chatMessages.map((msg, idx) => {
                                            const mine = String(msg?.userId || msg?.senderId) === String(user?.id);
                                            return (
                                                <div key={`${idx}-${msg?.createdAt || ""}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                                                    <div className={`max-w-[85%] text-sm px-3.5 py-2.5 rounded-2xl shadow-sm ${mine ? "bg-emerald-500 text-white" : "bg-white border border-slate-200 text-slate-700"}`}>
                                                        <p>{msg?.text || msg?.message || ""}</p>
                                                        <p className={`text-[10px] mt-1 ${mine ? "text-emerald-100" : "text-slate-400"}`}>
                                                            {(msg?.createdAt || msg?.sentAt)
                                                                ? new Date(msg.createdAt || msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                                                : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            {chatError && <p className="mt-2 text-xs text-amber-600">{chatError}</p>}
                            <div className="mt-3 flex items-center gap-2">
                                <input
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSend();
                                    }}
                                    placeholder="Type a message..."
                                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !messageText.trim()}
                                    className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-emerald-500 text-white disabled:opacity-50 shadow-sm hover:bg-emerald-600 transition-colors"
                                >
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Use chat for pickup coordination only.
                            </p>
                        </>
                    )}
                </aside>
            </main>
            <Footer />
        </div>
    );
}
