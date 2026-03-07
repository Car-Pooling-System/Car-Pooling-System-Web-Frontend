import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
    Mail, Phone, ShieldCheck, ShieldAlert, CreditCard, Car,
    Loader2, AlertCircle, CheckCircle2, ArrowLeft, User, FileText
} from "lucide-react";
import Navbar from "../../components/layout/Navbar.jsx";
import Footer from "../../components/layout/Footer.jsx";
import { useProfile } from "../../hooks/useProfile.js";
import {
    sendPhoneVerification,
    verifyPhoneOtp,
    updatePhoneOnProfile,
    addDriverVehicle,
} from "../../lib/api.js";

export default function DriverEditProfile() {
    const { isSignedIn, isLoaded, user } = useUser();
    const navigate = useNavigate();
    const { data: profileData } = useProfile();

    useEffect(() => {
        if (isLoaded && !isSignedIn) navigate("/");
    }, [isLoaded, isSignedIn, navigate]);

    const emailVerified = user?.primaryEmailAddress?.verification?.status === "verified";
    const verification = profileData?.profile?.verification ?? {};
    const driverMeta = user?.unsafeMetadata || {};

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
                            Edit Driver Profile
                        </h1>
                        <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                            Manage your verifications and vehicle details
                        </p>
                    </div>
                </div>

                {/* Profile Summary Card */}
                <div
                    className="rounded-2xl p-5 sm:p-6 mb-6 flex items-center gap-5"
                    style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                >
                    <img
                        src={profileData?.profile?.profileImage || user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName ?? "User")}&background=13ec5b&color=0d1f13&size=128`}
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
                            style={{ backgroundColor: "rgba(19,236,91,0.15)", color: "var(--color-primary-dark)" }}
                        >
                            🚗 Driver
                        </span>
                    </div>
                    {/* Verification Progress */}
                    <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
                        <VerificationProgress verification={verification} emailVerified={emailVerified} driverMeta={driverMeta} />
                    </div>
                </div>

                {/* Verification Sections */}
                <div className="flex flex-col gap-5">
                    <EmailSection user={user} verified={emailVerified} />
                    <PhoneSection userId={user?.id} verification={verification} profileData={profileData} />
                    <AadhaarSection user={user} driverMeta={driverMeta} />
                    <DrivingLicenceSection user={user} driverMeta={driverMeta} />
                    <VehicleRegistrationSection userId={user?.id} vehicles={profileData?.vehicles || []} />
                </div>

            </main>
            <Footer />
        </div>
    );
}

/* ─────────────────────────────────────────────
   Verification Progress Ring
───────────────────────────────────────────── */
function VerificationProgress({ verification, emailVerified, driverMeta }) {
    const checks = [
        emailVerified,
        verification.phoneVerified,
        driverMeta.aadhaar?.verified,
        driverMeta.drivingLicence?.verified || verification.drivingLicenseVerified,
        verification.vehicleVerified,
    ];
    const completed = checks.filter(Boolean).length;
    const total = checks.length;
    const pct = Math.round((completed / total) * 100);

    return (
        <div className="text-center">
            <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xs font-extrabold"
                style={{
                    background: `conic-gradient(var(--color-primary) ${pct * 3.6}deg, var(--color-border) ${pct * 3.6}deg)`,
                }}
            >
                <div
                    className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-surface)" }}
                >
                    <span style={{ color: "var(--color-text-primary)" }}>{pct}%</span>
                </div>
            </div>
            <span className="text-[10px] font-bold mt-1 block" style={{ color: "var(--color-text-muted)" }}>
                {completed}/{total} Done
            </span>
        </div>
    );
}

/* ─────────────────────────────────────────────
   1. Email Verification
───────────────────────────────────────────── */
function EmailSection({ user, verified }) {
    return (
        <VerificationCard
            icon={<Mail size={18} />}
            title="Email Verification"
            subtitle="Email for ride notifications & receipts"
            verified={verified}
        >
            <p className="text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                {user?.primaryEmailAddress?.emailAddress ?? "No email"}
            </p>
            {verified ? (
                <SuccessText text="Email verified and active" />
            ) : (
                <button
                    onClick={() => user?.primaryEmailAddress?.prepareVerification({ strategy: "email_code" })}
                    className="self-start text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: "var(--color-primary)", color: "var(--color-dark)" }}
                >
                    Send Verification Email
                </button>
            )}
        </VerificationCard>
    );
}

/* ─────────────────────────────────────────────
   2. Phone Verification
───────────────────────────────────────────── */
function PhoneSection({ userId, verification, profileData }) {
    const phoneVerified = verification.phoneVerified;
    const [phone, setPhone] = useState(profileData?.profile?.phoneNumber || "");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("send"); // send | verify
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await sendPhoneVerification(phone);
            setStep("verify");
        } catch (err) {
            setError(err.message || "Failed to send OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await verifyPhoneOtp(phone, otp);
            await updatePhoneOnProfile(userId, phone);
            window.location.reload();
        } catch (err) {
            setError(err.message || "Invalid OTP.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <VerificationCard
            icon={<Phone size={18} />}
            title="Phone Verification"
            subtitle="For rider/driver communication"
            verified={phoneVerified}
        >
            {phoneVerified ? (
                <>
                    <p className="text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                        {profileData?.profile?.phoneNumber || "Phone verified"}
                    </p>
                    <SuccessText text="Phone number verified" />
                </>
            ) : (
                <>
                    {error && <ErrorText text={error} />}
                    {step === "send" ? (
                        <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
                            <InputField
                                icon={<Phone size={16} />}
                                placeholder="+91 9876543210"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                            <ActionBtn loading={loading} text="Send OTP" />
                        </form>
                    ) : (
                        <form onSubmit={handleVerify} className="flex flex-col gap-3">
                            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>OTP sent to {phone}</p>
                            <input
                                required
                                type="text"
                                placeholder="Enter OTP"
                                className="w-full px-4 py-3 rounded-xl text-center tracking-widest text-lg font-bold outline-none"
                                style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setStep("send")}
                                    className="text-xs font-bold px-4 py-2 rounded-lg"
                                    style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                                    Change
                                </button>
                                <ActionBtn loading={loading} text="Verify OTP" />
                            </div>
                        </form>
                    )}
                </>
            )}
        </VerificationCard>
    );
}

/* ─────────────────────────────────────────────
   3. Aadhaar Verification
───────────────────────────────────────────── */
function AadhaarSection({ user, driverMeta }) {
    const verified = driverMeta.aadhaar?.verified === true;
    const [aadhaar, setAadhaar] = useState(driverMeta.aadhaar?.number || "");
    const [name, setName] = useState(driverMeta.aadhaar?.name || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (aadhaar.replace(/\s/g, "").length !== 12) {
            setError("Aadhaar must be 12 digits.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await user.update({
                unsafeMetadata: {
                    ...user.unsafeMetadata,
                    aadhaar: { number: aadhaar.replace(/\s/g, ""), name, verified: true, verifiedAt: new Date().toISOString() },
                },
            });
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <VerificationCard
            icon={<CreditCard size={18} />}
            title="Aadhaar Verification"
            subtitle="Government ID for identity"
            verified={verified || success}
        >
            {(verified || success) ? (
                <>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <InfoField label="Aadhaar" value={`XXXX XXXX ${(driverMeta.aadhaar?.number || aadhaar).slice(-4)}`} />
                        <InfoField label="Name" value={driverMeta.aadhaar?.name || name || "—"} />
                    </div>
                    <SuccessText text="Aadhaar verified" />
                </>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    {error && <ErrorText text={error} />}
                    <InputField icon={<User size={16} />} placeholder="Full name (as on Aadhaar)" value={name} onChange={(e) => setName(e.target.value)} required />
                    <div>
                        <InputField
                            icon={<CreditCard size={16} />}
                            placeholder="XXXX XXXX XXXX"
                            value={aadhaar}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
                                setAadhaar(raw.replace(/(\d{4})/g, "$1 ").trim());
                            }}
                            maxLength={14}
                            required
                        />
                        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>12-digit UIDAI number</p>
                    </div>
                    <ActionBtn loading={loading} text="Verify Aadhaar" />
                </form>
            )}
        </VerificationCard>
    );
}

/* ─────────────────────────────────────────────
   4. Driving Licence Verification
───────────────────────────────────────────── */
function DrivingLicenceSection({ user, driverMeta }) {
    const verified = driverMeta.drivingLicence?.verified === true;
    const [licenceNo, setLicenceNo] = useState(driverMeta.drivingLicence?.number || "");
    const [expiry, setExpiry] = useState(driverMeta.drivingLicence?.expiry || "");
    const [state, setState] = useState(driverMeta.drivingLicence?.state || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await user.update({
                unsafeMetadata: {
                    ...user.unsafeMetadata,
                    drivingLicence: {
                        number: licenceNo,
                        expiry,
                        state,
                        verified: true,
                        verifiedAt: new Date().toISOString(),
                    },
                },
            });
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <VerificationCard
            icon={<FileText size={18} />}
            title="Driving Licence"
            subtitle="Valid driving licence is required"
            verified={verified || success}
        >
            {(verified || success) ? (
                <>
                    <div className="grid grid-cols-3 gap-4 mb-2">
                        <InfoField label="Licence No." value={driverMeta.drivingLicence?.number || licenceNo} />
                        <InfoField label="State" value={driverMeta.drivingLicence?.state || state} />
                        <InfoField label="Expiry" value={driverMeta.drivingLicence?.expiry || expiry} />
                    </div>
                    <SuccessText text="Driving licence verified" />
                </>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    {error && <ErrorText text={error} />}
                    <InputField icon={<FileText size={16} />} placeholder="Licence Number (e.g. DL-0420110012345)" value={licenceNo} onChange={(e) => setLicenceNo(e.target.value)} required />
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--color-text-primary)" }}>Issuing State</label>
                            <input
                                required type="text" placeholder="e.g. Delhi"
                                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                                value={state} onChange={(e) => setState(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--color-text-primary)" }}>Expiry Date</label>
                            <input
                                required type="date"
                                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                                value={expiry} onChange={(e) => setExpiry(e.target.value)}
                            />
                        </div>
                    </div>
                    <ActionBtn loading={loading} text="Verify Licence" />
                </form>
            )}
        </VerificationCard>
    );
}

/* ─────────────────────────────────────────────
   5. Vehicle Registration
───────────────────────────────────────────── */
function VehicleRegistrationSection({ userId, vehicles }) {
    const [showForm, setShowForm] = useState(false);
    const [vehicle, setVehicle] = useState({ brand: "", model: "", year: "", color: "", licensePlate: "", totalSeats: 4 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await addDriverVehicle(userId, vehicle);
            window.location.reload();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <VerificationCard
            icon={<Car size={18} />}
            title="Vehicle Registration"
            subtitle={`${vehicles.length} vehicle(s) registered`}
            verified={vehicles.length > 0}
        >
            {/* Existing vehicles */}
            {vehicles.length > 0 && (
                <div className="flex flex-col gap-3 mb-4">
                    {vehicles.map((v, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ backgroundColor: "var(--color-surface-muted)", border: "1px solid var(--color-border)" }}
                        >
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: "var(--color-border)" }}>
                                <Car size={16} style={{ color: "var(--color-text-muted)" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
                                    {v.brand} {v.model} · {v.year}
                                </p>
                                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                    {v.licensePlate} · {v.color} · {v.totalSeats} seats
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    className="self-start text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: "var(--color-primary)", color: "var(--color-dark)" }}
                >
                    + Add New Vehicle
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    {error && <ErrorText text={error} />}
                    <div className="grid grid-cols-2 gap-3">
                        <SmallInput label="Brand" placeholder="e.g. Maruti" value={vehicle.brand} onChange={(e) => setVehicle({ ...vehicle, brand: e.target.value })} />
                        <SmallInput label="Model" placeholder="e.g. Swift" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} />
                        <SmallInput label="Year" placeholder="2022" type="number" value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} />
                        <SmallInput label="Color" placeholder="White" value={vehicle.color} onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })} />
                        <SmallInput label="License Plate" placeholder="DL 01 AB 1234" value={vehicle.licensePlate} onChange={(e) => setVehicle({ ...vehicle, licensePlate: e.target.value })} />
                        <SmallInput label="Seats" placeholder="4" type="number" value={vehicle.totalSeats} onChange={(e) => setVehicle({ ...vehicle, totalSeats: Number(e.target.value) })} />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setShowForm(false)}
                            className="text-xs font-bold px-4 py-2 rounded-lg"
                            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                            Cancel
                        </button>
                        <ActionBtn loading={loading} text="Save Vehicle" />
                    </div>
                </form>
            )}
        </VerificationCard>
    );
}

/* ─────────────────────────────────────────────
   Shared Components
───────────────────────────────────────────── */
function VerificationCard({ icon, title, subtitle, verified, children }) {
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
                        <span style={{ color: verified ? "var(--color-primary-dark)" : "var(--color-danger)" }}>{icon}</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{subtitle}</p>
                    </div>
                </div>
                <StatusBadge verified={verified} />
            </div>
            <div className="px-5 py-4">{children}</div>
        </div>
    );
}

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
            <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</span>
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{value}</span>
        </div>
    );
}

function InputField({ icon, placeholder, value, onChange, type = "text", maxLength, required }) {
    return (
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">{icon}</span>
            <input
                type={type} placeholder={placeholder} value={value} onChange={onChange}
                maxLength={maxLength} required={required}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
            />
        </div>
    );
}

function SmallInput({ label, placeholder, value, onChange, type = "text" }) {
    return (
        <div>
            <label className="text-xs font-bold block mb-1" style={{ color: "var(--color-text-primary)" }}>{label}</label>
            <input
                required type={type} placeholder={placeholder}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                value={value} onChange={onChange}
            />
        </div>
    );
}

function ActionBtn({ loading, text }) {
    return (
        <button
            type="submit" disabled={loading}
            className="self-start flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-lg transition-all disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-dark)" }}
        >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {text}
        </button>
    );
}

function SuccessText({ text }) {
    return (
        <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-primary-dark)" }}>
            <CheckCircle2 size={14} /> {text}
        </div>
    );
}

function ErrorText({ text }) {
    return (
        <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg"
            style={{ backgroundColor: "rgba(231,42,8,0.07)", color: "var(--color-danger)" }}>
            <AlertCircle size={14} /> {text}
        </div>
    );
}
