import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    ArrowLeft,
    Car,
    CheckCircle2,
    CreditCard,
    FileText,
    Image as ImageIcon,
    Loader2,
    Mail,
    Phone,
    Plus,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    User,
} from "lucide-react";
import Navbar from "../../components/layout/Navbar.jsx";
import Footer from "../../components/layout/Footer.jsx";
import { useProfile } from "../../hooks/useProfile.js";
import {
    addDriverVehicle,
    deleteDriverVehicle,
    registerDriver,
    uploadFile,
    sendPhoneVerification,
    updateDriverVehicle,
    updatePhoneOnProfile,
    uploadDriverDocs,
    verifyPhoneOtp,
} from "../../lib/api.js";
import { readFileAsDataUrl, readFilesAsDataUrls } from "../../utils/fileReader.js";
import FilePickerButton from "../../components/common/FilePickerButton.jsx";

const EMPTY_VEHICLE = {
    brand: "",
    model: "",
    year: "",
    color: "",
    licensePlate: "",
    totalSeats: 4,
    hasLuggageSpace: false,
    insuranceDoc: "",
    images: [],
};
const MAX_CAR_IMAGES = 5;

export default function DriverEditProfile() {
    const { isSignedIn, isLoaded, user } = useUser();
    const navigate = useNavigate();
    const { data: profileData, refresh } = useProfile();

    useEffect(() => {
        if (isLoaded && !isSignedIn) navigate("/");
    }, [isLoaded, isSignedIn, navigate]);

    const emailVerified = user?.primaryEmailAddress?.verification?.status === "verified";
    const verification = profileData?.profile?.verification ?? {};
    const driverMeta = user?.unsafeMetadata || {};

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
            <Navbar />
            <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10">
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
                            Manage verification details, backend documents, and full vehicle information.
                        </p>
                    </div>
                </div>

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
                            {user?.primaryEmailAddress?.emailAddress ?? "-"}
                        </p>
                        <span
                            className="inline-block mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full"
                            style={{ backgroundColor: "rgba(19,236,91,0.15)", color: "var(--color-primary-dark)" }}
                        >
                            Driver
                        </span>
                    </div>
                    <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
                        <VerificationProgress verification={verification} emailVerified={emailVerified} driverMeta={driverMeta} />
                    </div>
                </div>

                <div className="flex flex-col gap-5">
                    <EmailSection user={user} verified={emailVerified} />
                    <PhoneSection userId={user?.id} verification={verification} profileData={profileData} refresh={refresh} />
                    <AadhaarSection user={user} driverMeta={driverMeta} />
                    <DrivingLicenceSection user={user} driverMeta={driverMeta} />
                    <DriverDocumentsSection userId={user?.id} documents={profileData?.profile?.documents ?? {}} refresh={refresh} />
                    <VehicleRegistrationSection userId={user?.id} vehicles={profileData?.vehicles || []} refresh={refresh} />
                </div>
            </main>
            <Footer />
        </div>
    );
}

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

function EmailSection({ user, verified }) {
    return (
        <VerificationCard
            icon={<Mail size={18} />}
            title="Email Verification"
            subtitle="Email for ride notifications and receipts"
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

function PhoneSection({ userId, verification, profileData, refresh }) {
    const phoneVerified = verification.phoneVerified;
    const [phone, setPhone] = useState(profileData?.profile?.phoneNumber || "");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("send");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setPhone(profileData?.profile?.phoneNumber || "");
    }, [profileData?.profile?.phoneNumber]);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await sendPhoneVerification(phone, userId);
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
            await registerDriver(userId);
            await verifyPhoneOtp(phone, otp, userId);
            await updatePhoneOnProfile(userId, phone);
            refresh();
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
            subtitle="For rider and driver communication"
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
                                <button
                                    type="button"
                                    onClick={() => setStep("send")}
                                    className="text-xs font-bold px-4 py-2 rounded-lg"
                                    style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
                                >
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
                        <InfoField label="Name" value={driverMeta.aadhaar?.name || name || "-"} />
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
                                required
                                type="text"
                                placeholder="e.g. Delhi"
                                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--color-text-primary)" }}>Expiry Date</label>
                            <input
                                required
                                type="date"
                                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                                value={expiry}
                                onChange={(e) => setExpiry(e.target.value)}
                            />
                        </div>
                    </div>
                    <ActionBtn loading={loading} text="Verify Licence" />
                </form>
            )}
        </VerificationCard>
    );
}

function DriverDocumentsSection({ userId, documents, refresh }) {
    const [form, setForm] = useState({
        drivingLicense: documents.drivingLicense || "",
        vehicleRegistration: documents.vehicleRegistration || "",
        insurance: documents.insurance || "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [docNames, setDocNames] = useState({
        drivingLicense: "",
        vehicleRegistration: "",
        insurance: "",
    });

    useEffect(() => {
        setForm({
            drivingLicense: documents.drivingLicense || "",
            vehicleRegistration: documents.vehicleRegistration || "",
            insurance: documents.insurance || "",
        });
    }, [documents]);

    const handleDocFileChange = async (key, file) => {
        if (!file) return;
        setDocNames((prev) => ({ ...prev, [key]: file.name }));
        try {
            const dataUrl = await readFileAsDataUrl(file, { maxSizeMB: 6, compressImages: true, maxDimension: 1600, quality: 0.82 });
            try {
                const uploadedUrl = await uploadFile({
                    dataUrl,
                    filename: file.name,
                    folder: "driver-docs",
                });
                setForm((prev) => ({ ...prev, [key]: uploadedUrl }));
            } catch {
                setForm((prev) => ({ ...prev, [key]: dataUrl }));
            }
            setError(null);
        } catch (err) {
            setError(err.message || "Failed to read selected file.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await registerDriver(userId);
            await uploadDriverDocs(userId, form);
            setSuccess("Driver documents saved.");
            refresh();
        } catch (err) {
            setError(err.message || "Failed to save driver documents.");
        } finally {
            setLoading(false);
        }
    };

    const completed = Object.values(form).filter(Boolean).length;

    return (
        <VerificationCard
            icon={<CreditCard size={18} />}
            title="Vehicle Documents"
            subtitle={`${completed}/3 required backend documents added`}
            verified={completed === 3}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && <ErrorText text={error} />}
                {success && <SuccessText text={success} />}
                <div>
                    <label className="text-xs font-bold block mb-1" style={{ color: "var(--color-text-primary)" }}>Driving License File</label>
                    <FilePickerButton
                        label="Choose File"
                        accept="image/*,.pdf"
                        onChange={(files) => handleDocFileChange("drivingLicense", files?.[0])}
                        fileText={docNames.drivingLicense ? `Selected: ${docNames.drivingLicense}` : ""}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold block mb-1" style={{ color: "var(--color-text-primary)" }}>Vehicle Registration File</label>
                    <FilePickerButton
                        label="Choose File"
                        accept="image/*,.pdf"
                        onChange={(files) => handleDocFileChange("vehicleRegistration", files?.[0])}
                        fileText={docNames.vehicleRegistration ? `Selected: ${docNames.vehicleRegistration}` : ""}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold block mb-1" style={{ color: "var(--color-text-primary)" }}>Insurance File</label>
                    <FilePickerButton
                        label="Choose File"
                        accept="image/*,.pdf"
                        onChange={(files) => handleDocFileChange("insurance", files?.[0])}
                        fileText={docNames.insurance ? `Selected: ${docNames.insurance}` : ""}
                    />
                </div>
                <ActionBtn loading={loading} text="Save Documents" />
            </form>
        </VerificationCard>
    );
}

function VehicleRegistrationSection({ userId, vehicles, refresh }) {
    const [showForm, setShowForm] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [vehicle, setVehicle] = useState(EMPTY_VEHICLE);
    const [insuranceDocName, setInsuranceDocName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const startAdd = () => {
        setEditingIndex(null);
        setVehicle(EMPTY_VEHICLE);
        setInsuranceDocName("");
        setShowForm(true);
        setError(null);
    };

    const startEdit = (currentVehicle, index) => {
        setEditingIndex(index);
        setVehicle({
            ...EMPTY_VEHICLE,
            ...currentVehicle,
            images: currentVehicle.images || [],
            totalSeats: currentVehicle.totalSeats || 4,
            hasLuggageSpace: Boolean(currentVehicle.hasLuggageSpace),
        });
        setInsuranceDocName("");
        setShowForm(true);
        setError(null);
    };

    const handleVehicleImagesChange = async (files) => {
        if (!files?.length) return;
        if (vehicle.images.length >= MAX_CAR_IMAGES) {
            setError(`You can upload up to ${MAX_CAR_IMAGES} car images.`);
            return;
        }
        try {
            const allowedCount = Math.max(0, MAX_CAR_IMAGES - vehicle.images.length);
            const selectedFiles = Array.from(files).slice(0, allowedCount);
            const imageDataUrls = await readFilesAsDataUrls(selectedFiles, { maxSizeMB: 3, compressImages: true, maxDimension: 1280, quality: 0.78 });
            const uploadedUrls = await Promise.all(
                imageDataUrls.map(async (dataUrl, index) => {
                    try {
                        return await uploadFile({
                            dataUrl,
                            filename: selectedFiles[index]?.name || `vehicle-${index + 1}.jpg`,
                            folder: "vehicle-images",
                        });
                    } catch {
                        return dataUrl;
                    }
                }),
            );
            setVehicle((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
            if (Array.from(files).length > allowedCount) {
                setError(`Only ${MAX_CAR_IMAGES} images are allowed. Extra files were ignored.`);
            } else {
                setError(null);
            }
        } catch (err) {
            setError(err.message || "Failed to read vehicle images.");
        }
    };

    const handleInsuranceDocChange = async (file) => {
        if (!file) return;
        setInsuranceDocName(file.name);
        try {
            const dataUrl = await readFileAsDataUrl(file, { maxSizeMB: 6, compressImages: true, maxDimension: 1600, quality: 0.82 });
            try {
                const uploadedUrl = await uploadFile({
                    dataUrl,
                    filename: file.name,
                    folder: "vehicle-docs",
                });
                setVehicle((prev) => ({ ...prev, insuranceDoc: uploadedUrl }));
            } catch {
                setVehicle((prev) => ({ ...prev, insuranceDoc: dataUrl }));
            }
            setError(null);
        } catch (err) {
            setError(err.message || "Failed to read insurance document.");
        }
    };

    const removeImage = (index) => {
        setVehicle((prev) => ({
            ...prev,
            images: prev.images.filter((_, imageIndex) => imageIndex !== index),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (editingIndex === null) {
                await registerDriver(userId);
                await addDriverVehicle(userId, vehicle);
            } else {
                await updateDriverVehicle(userId, editingIndex, vehicle);
            }
            setShowForm(false);
            setEditingIndex(null);
            setVehicle(EMPTY_VEHICLE);
            setInsuranceDocName("");
            refresh();
        } catch (err) {
            setError(err.message || "Failed to save vehicle.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (index) => {
        setLoading(true);
        setError(null);
        try {
            await deleteDriverVehicle(userId, index);
            if (editingIndex === index) {
                setShowForm(false);
                setEditingIndex(null);
                setVehicle(EMPTY_VEHICLE);
                setInsuranceDocName("");
            }
            refresh();
        } catch (err) {
            setError(err.message || "Failed to delete vehicle.");
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
            {error && <ErrorText text={error} />}

            {vehicles.length > 0 && (
                <div className="flex flex-col gap-4 mb-4">
                    {vehicles.map((currentVehicle, index) => (
                        <div
                            key={`${currentVehicle.licensePlate}-${index}`}
                            className="rounded-2xl p-4"
                            style={{ backgroundColor: "var(--color-surface-muted)", border: "1px solid var(--color-border)" }}
                        >
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div
                                    className="w-full sm:w-32 h-28 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                                    style={{ backgroundColor: "var(--color-border)" }}
                                >
                                    {currentVehicle.images?.[0] ? (
                                        <img src={currentVehicle.images[0]} alt={`${currentVehicle.brand} ${currentVehicle.model}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <Car size={24} style={{ color: "var(--color-text-muted)" }} />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                                                {currentVehicle.brand} {currentVehicle.model} {currentVehicle.year ? `(${currentVehicle.year})` : ""}
                                            </p>
                                            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                                                {currentVehicle.licensePlate} · {currentVehicle.color} · {currentVehicle.totalSeats || 4} seats
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => startEdit(currentVehicle, index)}
                                                className="text-xs font-bold px-4 py-2 rounded-lg"
                                                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-dark)" }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(index)}
                                                className="text-xs font-bold px-4 py-2 rounded-lg"
                                                style={{ backgroundColor: "rgba(231,42,8,0.08)", color: "var(--color-danger)" }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <Tag text={currentVehicle.hasLuggageSpace ? "Luggage space" : "No luggage space"} />
                                        {currentVehicle.insuranceDoc && <Tag text="Insurance doc linked" />}
                                        {currentVehicle.images?.length > 0 && <Tag text={`${currentVehicle.images.length} image(s)`} />}
                                    </div>

                                    {currentVehicle.images?.length > 1 && (
                                        <div className="grid grid-cols-3 gap-2 mt-3">
                                            {currentVehicle.images.slice(0, 3).map((image, imageIndex) => (
                                                <img key={`${image}-${imageIndex}`} src={image} alt={`Vehicle ${imageIndex + 1}`} className="h-16 w-full object-cover rounded-lg border border-[var(--color-border)]" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!showForm ? (
                <button
                    onClick={startAdd}
                    className="self-start flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: "var(--color-primary)", color: "var(--color-dark)" }}
                >
                    <Plus size={14} />
                    Add Vehicle
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <SmallInput label="Brand" placeholder="e.g. Maruti" value={vehicle.brand} onChange={(e) => setVehicle({ ...vehicle, brand: e.target.value })} />
                        <SmallInput label="Model" placeholder="e.g. Swift" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} />
                        <SmallInput label="Year" placeholder="2022" type="number" value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} />
                        <SmallInput label="Color" placeholder="White" value={vehicle.color} onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })} />
                        <SmallInput label="Vehicle Number" placeholder="DL 01 AB 1234" value={vehicle.licensePlate} onChange={(e) => setVehicle({ ...vehicle, licensePlate: e.target.value.toUpperCase() })} />
                        <SmallInput label="Seats" placeholder="4" type="number" value={vehicle.totalSeats} onChange={(e) => setVehicle({ ...vehicle, totalSeats: Number(e.target.value) })} />
                    </div>

                    <div>
                        <label className="text-xs font-bold block mb-1" style={{ color: "var(--color-text-primary)" }}>Insurance Document File</label>
                        <FilePickerButton
                            label="Choose Insurance File"
                            accept="image/*,.pdf"
                            onChange={(files) => handleInsuranceDocChange(files?.[0])}
                            fileText={insuranceDocName ? `Selected: ${insuranceDocName}` : ""}
                        />
                    </div>

                    <label className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                        <input
                            type="checkbox"
                            checked={vehicle.hasLuggageSpace}
                            onChange={(e) => setVehicle({ ...vehicle, hasLuggageSpace: e.target.checked })}
                            className="h-4 w-4"
                        />
                        <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Vehicle has luggage space</span>
                    </label>

                    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                        <div className="flex items-center gap-2 mb-3">
                            <ImageIcon size={16} style={{ color: "var(--color-text-secondary)" }} />
                            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>Car Images</p>
                        </div>
                        <FilePickerButton
                            label="Choose Car Images"
                            multiple
                            accept="image/*"
                            onChange={handleVehicleImagesChange}
                            fileText={vehicle.images.length ? `${vehicle.images.length}/${MAX_CAR_IMAGES} image(s) selected` : `Max ${MAX_CAR_IMAGES} images`}
                        />

                        {vehicle.images.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                                {vehicle.images.map((image, index) => (
                                    <div key={`${image}-${index}`} className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
                                        <img src={image} alt={`Vehicle ${index + 1}`} className="w-full h-24 object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="w-full flex items-center justify-center gap-1 text-xs font-bold py-2"
                                            style={{ color: "var(--color-danger)" }}
                                        >
                                            <Trash2 size={12} />
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setEditingIndex(null);
                                setVehicle(EMPTY_VEHICLE);
                                setInsuranceDocName("");
                                setError(null);
                            }}
                            className="text-xs font-bold px-4 py-2 rounded-lg"
                            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
                        >
                            Cancel
                        </button>
                        <ActionBtn loading={loading} text={editingIndex === null ? "Save Vehicle" : "Update Vehicle"} />
                    </div>
                </form>
            )}
        </VerificationCard>
    );
}

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
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                maxLength={maxLength}
                required={required}
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
                required
                type={type}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                value={value}
                onChange={onChange}
            />
        </div>
    );
}

function ActionBtn({ loading, text }) {
    return (
        <button
            type="submit"
            disabled={loading}
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
        <div
            className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg"
            style={{ backgroundColor: "rgba(231,42,8,0.07)", color: "var(--color-danger)" }}
        >
            <AlertCircle size={14} /> {text}
        </div>
    );
}

function Tag({ text }) {
    return (
        <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
        >
            {text}
        </span>
    );
}
