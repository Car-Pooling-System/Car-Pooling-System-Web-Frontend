import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
    Mail, ShieldCheck, ShieldAlert, CreditCard, Loader2,
    AlertCircle, CheckCircle2, ArrowLeft, User, FileText
} from "lucide-react";
import Navbar from "../../components/layout/Navbar.jsx";
import Footer from "../../components/layout/Footer.jsx";

export default function RiderEditProfile() {
    const { isSignedIn, isLoaded, user } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoaded && !isSignedIn) navigate("/");
    }, [isLoaded, isSignedIn, navigate]);

    const emailVerified = user?.primaryEmailAddress?.verification?.status === "verified";

    // Pull aadhaar data from unsafeMetadata
    const aadhaarData = user?.unsafeMetadata?.aadhaar || {};
    const aadhaarVerified = aadhaarData.verified === true;

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
            <Navbar />
            <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate("/profile")}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--color-surface-muted)]"
                        style={{ border: "1px solid var(--color-border)" }}
                    >
                        <ArrowLeft size={18} style={{ color: "var(--color-text-secondary)" }} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold" style={{ color: "var(--color-text-primary)" }}>
                            Edit Profile
                        </h1>
                        <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                            Manage your verification and personal details
                        </p>
                    </div>
                </div>

                {/* Profile Summary Card */}
                <div
                    className="rounded-2xl p-5 sm:p-6 mb-6 flex items-center gap-5"
                    style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                >
                    <img
                        src={user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName ?? "User")}&background=13ec5b&color=0d1f13&size=128`}
                        alt="avatar"
                        className="w-16 h-16 rounded-2xl object-cover"
                        style={{ border: "3px solid var(--color-primary)" }}
                    />
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-extrabold truncate" style={{ color: "var(--color-text-primary)" }}>
                            {user?.fullName ?? "User"}
                        </h2>
                        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            {user?.primaryEmailAddress?.emailAddress ?? "—"}
                        </p>
                        <span
                            className="inline-block mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full"
                            style={{ backgroundColor: "rgba(97,137,111,0.15)", color: "var(--color-text-secondary)" }}
                        >
                            🧍 Rider
                        </span>
                    </div>
                </div>

                {/* Verification Sections */}
                <div className="flex flex-col gap-5">
                    {/* Email Verification */}
                    <EmailVerificationSection user={user} verified={emailVerified} />

                    {/* Aadhaar Verification */}
                    <AadhaarVerificationSection user={user} verified={aadhaarVerified} aadhaarData={aadhaarData} />
                </div>

            </main>
            <Footer />
        </div>
    );
}

/* ─────────────────────────────────────────────
   Email Verification Section
───────────────────────────────────────────── */
function EmailVerificationSection({ user, verified }) {
    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
            <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid var(--color-border)" }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                            backgroundColor: verified ? "rgba(19,236,91,0.12)" : "rgba(231,42,8,0.08)",
                        }}
                    >
                        <Mail size={18} style={{ color: verified ? "var(--color-primary-dark)" : "var(--color-danger)" }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                            Email Verification
                        </h3>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            Verify your email address for communications
                        </p>
                    </div>
                </div>
                <StatusBadge verified={verified} />
            </div>
            <div className="px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                        {user?.primaryEmailAddress?.emailAddress ?? "No email"}
                    </span>
                </div>
                {verified ? (
                    <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-primary-dark)" }}>
                        <CheckCircle2 size={14} />
                        Your email is verified and active
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            Please verify your email through Clerk authentication to continue.
                        </p>
                        <button
                            onClick={() => user?.primaryEmailAddress?.prepareVerification({ strategy: "email_code" })}
                            className="self-start text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-dark)" }}
                        >
                            Send Verification Email
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Aadhaar Verification Section
───────────────────────────────────────────── */
function AadhaarVerificationSection({ user, verified, aadhaarData }) {
    const [aadhaar, setAadhaar] = useState(aadhaarData.number || "");
    const [name, setName] = useState(aadhaarData.name || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (aadhaar.replace(/\s/g, "").length !== 12) {
            setError("Aadhaar number must be 12 digits.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await user.update({
                unsafeMetadata: {
                    ...user.unsafeMetadata,
                    aadhaar: {
                        number: aadhaar.replace(/\s/g, ""),
                        name,
                        verified: true,
                        verifiedAt: new Date().toISOString(),
                    },
                },
            });
            setSuccess(true);
        } catch (err) {
            setError(err.message || "Verification failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
            <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid var(--color-border)" }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                            backgroundColor: (verified || success) ? "rgba(19,236,91,0.12)" : "rgba(231,42,8,0.08)",
                        }}
                    >
                        <CreditCard size={18} style={{ color: (verified || success) ? "var(--color-primary-dark)" : "var(--color-danger)" }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                            Aadhaar Verification
                        </h3>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            Government ID for identity verification
                        </p>
                    </div>
                </div>
                <StatusBadge verified={verified || success} />
            </div>
            <div className="px-5 py-4">
                {(verified || success) ? (
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-4">
                            <InfoField label="Aadhaar Number" value={`XXXX XXXX ${(aadhaarData.number || aadhaar).slice(-4)}`} />
                            <InfoField label="Name on Aadhaar" value={aadhaarData.name || name || "—"} />
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-primary-dark)" }}>
                            <CheckCircle2 size={14} />
                            Aadhaar verified successfully
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {error && (
                            <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg"
                                style={{ backgroundColor: "rgba(231,42,8,0.07)", color: "var(--color-danger)" }}>
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
                                Full Name (as on Aadhaar)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                                    <User size={16} />
                                </span>
                                <input
                                    required
                                    type="text"
                                    placeholder="Enter full name"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-colors"
                                    style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
                                Aadhaar Number
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                                    <CreditCard size={16} />
                                </span>
                                <input
                                    required
                                    type="text"
                                    maxLength={14}
                                    placeholder="XXXX XXXX XXXX"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none tracking-widest font-semibold transition-colors"
                                    style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                                    value={aadhaar}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
                                        const formatted = raw.replace(/(\d{4})/g, "$1 ").trim();
                                        setAadhaar(formatted);
                                    }}
                                />
                            </div>
                            <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                                12-digit Aadhaar number issued by UIDAI
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="self-start flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl transition-all"
                            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-dark)" }}
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            Verify Aadhaar
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

/* ── Shared Components ── */
function StatusBadge({ verified }) {
    return (
        <span
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{
                backgroundColor: verified ? "rgba(19,236,91,0.12)" : "rgba(231,42,8,0.08)",
                color: verified ? "var(--color-primary-dark)" : "var(--color-danger)",
            }}
        >
            {verified ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
            {verified ? "Verified" : "Pending"}
        </span>
    );
}

function InfoField({ label, value }) {
    return (
        <div>
            <span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--color-text-muted)" }}>
                {label}
            </span>
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {value}
            </span>
        </div>
    );
}
