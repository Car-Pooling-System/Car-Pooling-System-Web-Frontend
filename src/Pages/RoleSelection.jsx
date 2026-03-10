import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Car, User, Loader2, ChevronRight, Shield, MapPin } from "lucide-react";

export default function RoleSelection() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleContinue = async () => {
        if (!selected || !user) return;
        setLoading(true);
        try {
            await user.update({ unsafeMetadata: { ...user.unsafeMetadata, role: selected } });
            navigate("/");
        } catch (err) {
            console.error("Failed to set role:", err);
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        {
            id: "rider",
            title: "Rider",
            subtitle: "Find and book affordable rides",
            icon: <User size={28} />,
            features: ["Search available rides", "Book seats instantly", "Track your ride in real-time", "Rate your experience"],
            gradient: "linear-gradient(135deg, rgba(19,236,91,0.12) 0%, rgba(14,196,76,0.06) 100%)",
            borderColor: "var(--color-primary)",
        },
        {
            id: "driver",
            title: "Driver",
            subtitle: "Offer rides and earn money",
            icon: <Car size={28} />,
            features: ["Create and manage rides", "Set your own pricing", "Flexible scheduling", "Build your reputation"],
            gradient: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(37,99,235,0.06) 100%)",
            borderColor: "#3b82f6",
        },
    ];

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
            style={{ backgroundColor: "var(--color-bg)" }}
        >
            {/* Background glow effects */}
            <div
                style={{
                    position: "fixed", top: "-20%", left: "-10%", width: "50%", height: "50%",
                    background: "radial-gradient(circle, rgba(19,236,91,0.08) 0%, transparent 70%)",
                    pointerEvents: "none", zIndex: 0,
                }}
            />
            <div
                style={{
                    position: "fixed", bottom: "-20%", right: "-10%", width: "50%", height: "50%",
                    background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
                    pointerEvents: "none", zIndex: 0,
                }}
            />

            <div className="relative z-10 w-full max-w-2xl">
                {/* Brand */}
                <div className="flex items-center gap-2 justify-center mb-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "var(--color-primary)" }}
                    >
                        <Car size={18} color="#0d1f13" strokeWidth={2.5} />
                    </div>
                    <span className="text-2xl font-extrabold" style={{ color: "var(--color-text-primary)" }}>
                        Swiftly
                    </span>
                </div>

                {/* Header */}
                <div className="text-center mb-10">
                    <h1
                        className="text-3xl sm:text-4xl font-extrabold mb-3"
                        style={{ color: "var(--color-text-primary)" }}
                    >
                        How will you use Swiftly?
                    </h1>
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                        Select your role to get started. You can always switch later from your profile.
                    </p>
                </div>

                {/* Role Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                    {roles.map((role) => {
                        const isSelected = selected === role.id;
                        return (
                            <button
                                key={role.id}
                                onClick={() => setSelected(role.id)}
                                className="text-left rounded-2xl p-6 transition-all duration-300 relative overflow-hidden"
                                style={{
                                    background: isSelected ? role.gradient : "var(--color-surface)",
                                    border: `2px solid ${isSelected ? role.borderColor : "var(--color-border)"}`,
                                    boxShadow: isSelected
                                        ? `0 0 0 3px ${role.borderColor}22, 0 8px 32px ${role.borderColor}15`
                                        : "0 1px 3px rgba(0,0,0,0.04)",
                                    transform: isSelected ? "scale(1.02)" : "scale(1)",
                                }}
                            >
                                {/* Selection indicator */}
                                <div
                                    className="absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                                    style={{
                                        borderColor: isSelected ? role.borderColor : "var(--color-border)",
                                        backgroundColor: isSelected ? role.borderColor : "transparent",
                                    }}
                                >
                                    {isSelected && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path d="M3 6L5.5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>

                                {/* Icon */}
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                                    style={{
                                        backgroundColor: isSelected ? `${role.borderColor}20` : "var(--color-surface-muted)",
                                        color: isSelected ? role.borderColor : "var(--color-text-muted)",
                                    }}
                                >
                                    {role.icon}
                                </div>

                                <h3
                                    className="text-xl font-extrabold mb-1"
                                    style={{ color: "var(--color-text-primary)" }}
                                >
                                    {role.title}
                                </h3>
                                <p
                                    className="text-sm font-medium mb-4"
                                    style={{ color: "var(--color-text-secondary)" }}
                                >
                                    {role.subtitle}
                                </p>

                                {/* Features list */}
                                <ul className="flex flex-col gap-2">
                                    {role.features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                            <div
                                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                                style={{ backgroundColor: isSelected ? role.borderColor : "var(--color-text-muted)" }}
                                            />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </button>
                        );
                    })}
                </div>

                {/* Continue Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleContinue}
                        disabled={!selected || loading}
                        className="flex items-center gap-2 px-10 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-40"
                        style={{
                            backgroundColor: selected ? "var(--color-primary)" : "var(--color-border)",
                            color: selected ? "var(--color-dark)" : "var(--color-text-muted)",
                        }}
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Continue as {selected ? (selected === "driver" ? "Driver" : "Rider") : "..."}
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Trust */}
                <div className="flex items-center justify-center gap-4 mt-8">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        <Shield size={12} />
                        <span>Secured with Clerk</span>
                    </div>
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "var(--color-border)" }} />
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        <MapPin size={12} />
                        <span>Available across India</span>
                    </div>
                </div>
            </div>
        </div>
    );
}


