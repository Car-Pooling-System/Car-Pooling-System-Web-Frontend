import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    Loader2,
    MapPin,
    MessageCircle,
    Send,
    Users,
    XCircle,
} from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import {
    confirmRideRequest,
    createGroupConversation,
    getChatMessages,
    getRideDetails,
    rejectRideRequest,
    sendRideChatMessage,
} from "../../lib/api";

function getStatusClass(status) {
    const value = String(status || "").toUpperCase();
    if (value === "CONFIRMED") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (value === "REQUESTED") return "bg-amber-100 text-amber-700 border-amber-200";
    if (value === "CANCELLED") return "bg-rose-100 text-rose-700 border-rose-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function DriverRideDetails() {
    const { rideId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useUser();

    const [ride, setRide] = useState(location.state?.ride || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingPassengerId, setProcessingPassengerId] = useState(null);

    const [chatMessages, setChatMessages] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState(null);
    const [messageText, setMessageText] = useState("");
    const [sending, setSending] = useState(false);
    const [conversationId, setConversationId] = useState("");
    const socketRef = useRef(null);

    const departure = useMemo(() => {
        const dep = ride?.schedule?.departureTime;
        if (!dep) return null;
        const d = new Date(dep);
        return Number.isNaN(d.getTime()) ? null : d;
    }, [ride?.schedule?.departureTime]);

    const passengers = Array.isArray(ride?.passengers)
        ? ride.passengers
        : Array.isArray(location.state?.ride?.passengers)
            ? location.state.ride.passengers
            : [];
    const requestedPassengers = passengers.filter((p) => {
        const status = String(p.status || "").toLowerCase();
        return status === "requested" || status === "pending";
    });
    const confirmedPassengers = passengers.filter((p) => String(p.status || "").toLowerCase() === "confirmed");
    const isRideDriver = String(ride?.driver?.userId || "") === String(user?.id || "");
    const canUseChat = isRideDriver && confirmedPassengers.length > 0;

    const fetchRide = useCallback(async () => {
        const response = await getRideDetails(rideId);
        const responseRide = response?.ride || null;
        setRide((previousRide) => {
            if (!responseRide) return null;
            const nextPassengers = Array.isArray(responseRide?.passengers) ? responseRide.passengers : [];
            if (nextPassengers.length > 0) return responseRide;
            const previousPassengers = Array.isArray(previousRide?.passengers) ? previousRide.passengers : [];
            if (previousPassengers.length === 0) return responseRide;
            return { ...responseRide, passengers: previousPassengers };
        });
    }, [rideId]);

    useEffect(() => {
        let cancelled = false;
        async function loadRide() {
            try {
                setLoading(true);
                setError(null);
                const response = await getRideDetails(rideId);
                if (!cancelled) {
                    const responseRide = response?.ride || null;
                    setRide((previousRide) => {
                        if (!responseRide) return null;
                        const nextPassengers = Array.isArray(responseRide?.passengers) ? responseRide.passengers : [];
                        if (nextPassengers.length > 0) return responseRide;
                        const previousPassengers = Array.isArray(previousRide?.passengers) ? previousRide.passengers : [];
                        if (previousPassengers.length === 0) return responseRide;
                        return { ...responseRide, passengers: previousPassengers };
                    });
                }
            } catch (err) {
                if (!cancelled) setError(err.message || "Failed to load ride details.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadRide();
        return () => {
            cancelled = true;
        };
    }, [rideId]);

    useEffect(() => {
        // Keep pending requests in sync while driver is on this page.
        const intervalId = window.setInterval(() => {
            fetchRide().catch(() => {
                // Ignore polling errors; existing UI state stays intact.
            });
        }, 8000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [fetchRide]);

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

                // Keep driver chat real-time using the same socket flow as mobile.
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
                    // Real-time is optional; history still loads.
                }
            } catch (err) {
                if (!cancelled) setChatError(err?.message || "Chat is not available right now.");
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

    const handleConfirm = async (passengerUserId) => {
        if (!user?.id || !isRideDriver) return;
        try {
            setProcessingPassengerId(passengerUserId);
            await confirmRideRequest(rideId, {
                driverUserId: user.id,
                passengerUserId,
            });
            await fetchRide();
        } catch (err) {
            alert(err.message || "Failed to confirm rider.");
        } finally {
            setProcessingPassengerId(null);
        }
    };

    const handleReject = async (passengerUserId) => {
        if (!user?.id || !isRideDriver) return;
        try {
            setProcessingPassengerId(passengerUserId);
            await rejectRideRequest(rideId, {
                driverUserId: user.id,
                passengerUserId,
            });
            await fetchRide();
        } catch (err) {
            alert(err.message || "Failed to reject rider.");
        } finally {
            setProcessingPassengerId(null);
        }
    };

    if (loading) {
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

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-2 space-y-6">
                    <button
                        onClick={() => navigate("/my-rides")}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to My Rides
                    </button>

                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <h1 className="text-2xl font-black text-slate-900">Ride Details</h1>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl border border-slate-200 p-4">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">From</p>
                                <p className="font-semibold text-slate-900 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-emerald-500" />
                                    {ride?.route?.start?.name || "-"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-4">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">To</p>
                                <p className="font-semibold text-slate-900 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-rose-500" />
                                    {ride?.route?.end?.name || "-"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-4">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Departure</p>
                                <p className="font-semibold text-slate-900">
                                    {departure ? departure.toLocaleDateString() : "-"}
                                </p>
                                <p className="text-slate-500">
                                    {departure ? departure.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-4">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Seats</p>
                                <p className="font-semibold text-slate-900">
                                    {ride?.seats?.available ?? 0} available / {ride?.seats?.total ?? 0} total
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-emerald-500" />
                            Pending Requests ({requestedPassengers.length})
                        </h2>
                        <div className="mt-4 space-y-3">
                            {!isRideDriver ? (
                                <p className="text-sm text-amber-600">Only the ride driver can review and confirm requests.</p>
                            ) : requestedPassengers.length === 0 ? (
                                <p className="text-sm text-slate-500">No pending riders right now.</p>
                            ) : (
                                requestedPassengers.map((passenger) => {
                                    const busy = processingPassengerId === passenger.userId;
                                    return (
                                        <div key={passenger.userId} className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <p className="font-bold text-slate-900">{passenger.name || passenger.userId}</p>
                                                <p className="text-xs text-slate-500 mt-1">Seat preference: {passenger.seatLabel || "Any Seat"}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleConfirm(passenger.userId)}
                                                    disabled={busy}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold disabled:opacity-60"
                                                >
                                                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => handleReject(passenger.userId)}
                                                    disabled={busy}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold disabled:opacity-60"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <h2 className="text-lg font-black text-slate-900">Confirmed Riders ({confirmedPassengers.length})</h2>
                        <div className="mt-4 space-y-2">
                            {confirmedPassengers.length === 0 ? (
                                <p className="text-sm text-slate-500">No confirmed riders yet.</p>
                            ) : (
                                confirmedPassengers.map((passenger) => (
                                    <div key={`${passenger.userId}-confirmed`} className="rounded-xl border border-slate-200 p-3 flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-900">{passenger.name || passenger.userId}</p>
                                            <p className="text-xs text-slate-500">Seat: {passenger.seatLabel || "Any Seat"}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full border text-[10px] font-black tracking-wider ${getStatusClass(passenger.status)}`}>
                                            {passenger.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                <aside className="bg-white rounded-2xl border border-slate-200 p-5 h-fit lg:sticky lg:top-24">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-emerald-500" />
                        Chat with Riders
                    </h2>
                    {!isRideDriver ? (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                            <p className="text-sm font-semibold text-amber-700">
                                Only the ride driver can access this chat.
                            </p>
                        </div>
                    ) : !canUseChat ? (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                            <p className="text-sm font-semibold text-amber-700">
                                Confirm at least one rider to enable chat.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="mt-4 h-80 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
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
                                                    <div className={`max-w-[85%] text-sm px-3 py-2 rounded-xl ${mine ? "bg-emerald-500 text-white" : "bg-white border border-slate-200 text-slate-700"}`}>
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
                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !messageText.trim()}
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500 text-white disabled:opacity-50"
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
