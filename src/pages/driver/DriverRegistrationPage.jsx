import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
    Car,
    Upload,
    ShieldCheck,
    CheckCircle2,
    Loader2,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    Phone,
    CreditCard
} from "lucide-react";
import Navbar from "../../components/layout/Navbar.jsx";
import Footer from "../../components/layout/Footer.jsx";
import {
    registerDriver,
    updateDriverProfile,
    uploadDriverDocs,
    addDriverVehicle,
    sendPhoneVerification,
    verifyPhoneOtp,
    updatePhoneOnProfile
} from "../../lib/api.js";
import { useProfile } from "../../hooks/useProfile.js";

const STEPS = [
    { id: 1, name: "Initial Setup", icon: <ShieldCheck size={18} /> },
    { id: 2, name: "Phone Verification", icon: <Phone size={18} /> },
    { id: 3, name: "Documents", icon: <Upload size={18} /> },
    { id: 4, name: "Vehicle Details", icon: <Car size={18} /> },
    { id: 5, name: "Complete", icon: <CheckCircle2 size={18} /> }
];

export default function DriverRegistrationPage() {
    const { isSignedIn, isLoaded, user } = useUser();
    const navigate = useNavigate();
    const { data: profileData, refresh } = useProfile();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Redirect if not signed in
    useEffect(() => {
        if (isLoaded && !isSignedIn) navigate("/sign-in");
    }, [isLoaded, isSignedIn, navigate]);

    // Check if they are already fully verified and redirect
    useEffect(() => {
        if (profileData?.profile?.verification?.vehicleVerified) {
            navigate("/profile");
        }
    }, [profileData, navigate]);

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
            <Navbar />
            <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10">

                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold mb-2" style={{ color: "var(--color-text-primary)" }}>
                        Become a Driver
                    </h1>
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                        Complete the following steps to start hosting rides and earning money.
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-8 relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[var(--color-border)] rounded-full -z-10"></div>
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[var(--color-primary)] rounded-full -z-10 transition-all duration-300"
                        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                    ></div>

                    {STEPS.map((step) => {
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;
                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-[var(--color-bg)] px-2">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${isCompleted
                                            ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                                            : isCurrent
                                                ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-surface)]"
                                                : "border-[var(--color-border)] text-[var(--color-text-muted)] bg-[var(--color-surface)]"
                                        }`}
                                >
                                    {isCompleted ? <CheckCircle2 size={20} /> : step.icon}
                                </div>
                                <span
                                    className={`text-xs font-bold hidden sm:block ${isCurrent || isCompleted ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"
                                        }`}
                                >
                                    {step.name}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-[rgba(231,42,8,0.07)] border border-[var(--color-danger)]">
                        <AlertCircle size={20} className="text-[var(--color-danger)]" />
                        <p className="text-sm font-semibold text-[var(--color-danger)]">{error}</p>
                    </div>
                )}

                {/* Content Area */}
                <div className="rounded-2xl p-6 sm:p-8 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
                    {currentStep === 1 && <Step1Setup userId={user?.id} onNext={nextStep} setError={setError} />}
                    {currentStep === 2 && <Step2Phone userId={user?.id} onNext={nextStep} prevStep={prevStep} setError={setError} />}
                    {currentStep === 3 && <Step3Docs userId={user?.id} onNext={nextStep} prevStep={prevStep} setError={setError} />}
                    {currentStep === 4 && <Step4Vehicle userId={user?.id} onNext={nextStep} prevStep={prevStep} setError={setError} />}
                    {currentStep === 5 && <Step5Complete user={user} refresh={refresh} />}
                </div>

            </main>
            <Footer />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step Component Definitions
// ─────────────────────────────────────────────────────────────

function Step1Setup({ userId, onNext, setError }) {
    const [loading, setLoading] = useState(false);

    const handleCreateDriverAccount = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!userId) throw new Error("User ID is missing.");
            await registerDriver(userId);
            onNext();
        } catch (err) {
            setError(err.message || "Failed to initialize driver account.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(19,236,91,0.15)] flex items-center justify-center mb-6">
                <ShieldCheck size={32} className="text-[var(--color-primary-dark)]" />
            </div>
            <h2 className="text-xl font-extrabold text-[var(--color-text-primary)] mb-3">
                Setup Driver Profile
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-8 max-w-md">
                We will create a specialized driver profile linked to your account. This allows you to host rides and accept passengers securely.
            </p>

            <button
                onClick={handleCreateDriverAccount}
                disabled={loading}
                className="btn-primary w-full sm:w-auto flex items-center gap-2 px-8"
            >
                {loading && <Loader2 size={18} className="animate-spin" />}
                Initialize Profile <ChevronRight size={18} />
            </button>
        </div>
    );
}

function Step2Phone({ userId, onNext, prevStep, setError }) {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("send"); // "send" | "verify"
    const [loading, setLoading] = useState(false);

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

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // 1. Verify OTP with backend
            await verifyPhoneOtp(phone, otp);
            // 2. Update profile with verified phone
            await updatePhoneOnProfile(userId, phone);
            onNext();
        } catch (err) {
            setError(err.message || "Invalid OTP.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto py-4">
            <h2 className="text-xl font-extrabold text-[var(--color-text-primary)] mb-2">
                Verify Phone Number
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                We need a verified phone number for communication with riders.
            </p>

            {step === "send" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-[var(--color-text-primary)] mb-2">
                            Phone Number (with country code)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                                <Phone size={18} />
                            </span>
                            <input
                                required
                                type="text"
                                placeholder="+91 9876543210"
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-sm focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={prevStep} className="btn-secondary px-6">Back</button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1 flex justify-center items-center gap-2">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : "Send OTP"}
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-[var(--color-text-primary)] mb-2">
                            Enter OTP sent to {phone}
                        </label>
                        <input
                            required
                            type="text"
                            placeholder="123456"
                            className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-center tracking-widest text-lg font-bold focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setStep("send")} className="btn-secondary px-6">Change Number</button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1 flex justify-center items-center gap-2">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : "Verify & Continue"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

function Step3Docs({ userId, onNext, prevStep, setError }) {
    const [docs, setDocs] = useState({ drivingLicense: "", vehicleRegistration: "", insurance: "" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await uploadDriverDocs(userId, docs);
            onNext();
        } catch (err) {
            setError(err.message || "Failed to upload documents.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto py-4">
            <h2 className="text-xl font-extrabold text-[var(--color-text-primary)] mb-2">Upload Documents</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                Please provide URL links to your documents. (In a real app, this would be an image upload directly).
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
                {[
                    { key: "drivingLicense", label: "Driving License URL", icon: <CreditCard size={18} /> },
                    { key: "vehicleRegistration", label: "Vehicle Registration (RC) URL", icon: <CreditCard size={18} /> },
                    { key: "insurance", label: "Vehicle Insurance URL", icon: <ShieldCheck size={18} /> }
                ].map((field) => (
                    <div key={field.key}>
                        <label className="block text-sm font-bold text-[var(--color-text-primary)] mb-2">
                            {field.label}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                                {/* eslint-disable-next-line react/jsx-key */}
                                {field.icon}
                            </span>
                            <input
                                required
                                type="url"
                                placeholder="https://res.cloudinary.com/..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-sm focus:border-[var(--color-primary)] outline-none"
                                value={docs[field.key]}
                                onChange={(e) => setDocs({ ...docs, [field.key]: e.target.value })}
                            />
                        </div>
                    </div>
                ))}

                <div className="flex gap-3 pt-4">
                    <button type="button" onClick={prevStep} className="btn-secondary px-6">Back</button>
                    <button type="submit" disabled={loading} className="btn-primary flex-1 flex justify-center items-center gap-2">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : "Save Documents"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Step4Vehicle({ userId, onNext, prevStep, setError }) {
    const [vehicle, setVehicle] = useState({
        brand: "", model: "", year: "", color: "", licensePlate: "", totalSeats: 4
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await addDriverVehicle(userId, vehicle);
            onNext();
        } catch (err) {
            setError(err.message || "Failed to add vehicle.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="py-4">
            <h2 className="text-xl font-extrabold text-[var(--color-text-primary)] mb-2">Vehicle Details</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                Enter details about the car you will be driving.
            </p>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--color-text-primary)]">Brand (e.g. Maruti)</label>
                    <input required className="form-input" value={vehicle.brand} onChange={e => setVehicle({ ...vehicle, brand: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--color-text-primary)]">Model (e.g. Swift)</label>
                    <input required className="form-input" value={vehicle.model} onChange={e => setVehicle({ ...vehicle, model: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--color-text-primary)]">Year</label>
                    <input required type="number" min="2000" className="form-input" value={vehicle.year} onChange={e => setVehicle({ ...vehicle, year: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--color-text-primary)]">Color</label>
                    <input required className="form-input" value={vehicle.color} onChange={e => setVehicle({ ...vehicle, color: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--color-text-primary)]">License Plate</label>
                    <input required className="form-input" value={vehicle.licensePlate} onChange={e => setVehicle({ ...vehicle, licensePlate: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--color-text-primary)]">Total Passenger Seats</label>
                    <input required type="number" min="1" max="8" className="form-input" value={vehicle.totalSeats} onChange={e => setVehicle({ ...vehicle, totalSeats: Number(e.target.value) })} />
                </div>

                <div className="col-span-1 sm:col-span-2 flex gap-3 pt-4 border-t border-[var(--color-border)] mt-2">
                    <button type="button" onClick={prevStep} className="btn-secondary px-6">Back</button>
                    <button type="submit" disabled={loading} className="btn-primary flex-1 flex justify-center items-center gap-2">
                        {loading && <Loader2 size={18} className="animate-spin" />} Finish Registration
                    </button>
                </div>
            </form>
        </div>
    );
}

function Step5Complete({ user, refresh }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleFinish = async () => {
        setLoading(true);
        try {
            // Update Clerk role metadata directly and frontend state
            await user.update({ unsafeMetadata: { ...user.unsafeMetadata, role: "driver" } });
            await refresh(); // Refresh our hook context
            navigate("/profile");
        } catch (err) {
            console.error("Error updating user role:", err);
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center py-10 text-center">
            <div className="w-20 h-20 rounded-full bg-[rgba(19,236,91,0.15)] flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-[var(--color-primary-dark)]" />
            </div>
            <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] mb-3">
                Registration Complete!
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-8 max-w-md">
                Your profile is now set up as a Driver. You can start creating rides and accepting bookings immediately.
            </p>

            <button
                onClick={handleFinish}
                disabled={loading}
                className="btn-primary flex items-center gap-2 px-10"
            >
                {loading && <Loader2 size={18} className="animate-spin" />}
                Go to Dashboard
            </button>
        </div>
    );
}
