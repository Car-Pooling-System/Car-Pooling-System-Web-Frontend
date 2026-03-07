import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, useClerk, SignInButton } from "@clerk/clerk-react";
import {
    User,
    Car,
    LogOut,
    ChevronDown,
    Menu,
    X,
} from "lucide-react";

export default function Navbar() {
    const { isSignedIn, user } = useUser();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate("/");
        setDropdownOpen(false);
    };

    const navLinks = [
        { label: "Find Ride", href: "#hero" },
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#cta" },
        { label: "Support", href: "#reviews" },
    ];

    return (
        <nav
            style={{
                backgroundColor: "var(--color-surface)",
                borderBottom: "1px solid var(--color-border)",
            }}
            className="sticky top-0 z-50 w-full"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 shrink-0">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "var(--color-primary)" }}
                    >
                        <Car size={16} color="#0d1f13" strokeWidth={2.5} />
                    </div>
                    <span
                        className="text-lg font-extrabold tracking-tight"
                        style={{ color: "var(--color-text-primary)" }}
                    >
                        CarPool
                    </span>
                    <span
                        className="text-xs font-semibold px-1.5 py-0.5 rounded"
                        style={{
                            backgroundColor: "var(--color-primary-soft)",
                            color: "var(--color-primary-dark)",
                        }}
                    >
                        AI
                    </span>
                </Link>

                {/* Desktop nav links */}
                <div className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="text-sm font-medium transition-colors hover:opacity-70"
                            style={{ color: "var(--color-text-secondary)" }}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {isSignedIn ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen((v) => !v)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all hover:shadow-sm"
                                style={{
                                    borderColor: "var(--color-border)",
                                    backgroundColor: "var(--color-surface)",
                                }}
                            >
                                <img
                                    src={
                                        user.imageUrl ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || "User")}&background=13ec5b&color=0d1f13`
                                    }
                                    alt="avatar"
                                    className="w-7 h-7 rounded-full object-cover"
                                />
                                <span
                                    className="text-sm font-semibold max-w-[120px] truncate hidden sm:block"
                                    style={{ color: "var(--color-text-primary)" }}
                                >
                                    {user.firstName || user.fullName || "User"}
                                </span>
                                <ChevronDown
                                    size={14}
                                    strokeWidth={2.5}
                                    style={{
                                        color: "var(--color-text-muted)",
                                        transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s",
                                    }}
                                />
                            </button>

                            {/* Dropdown */}
                            {dropdownOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-56 rounded-2xl shadow-lg py-2 z-50"
                                    style={{
                                        backgroundColor: "var(--color-surface)",
                                        border: "1px solid var(--color-border)",
                                    }}
                                >
                                    {/* User info header */}
                                    <div
                                        className="px-4 py-3 border-b"
                                        style={{ borderColor: "var(--color-border)" }}
                                    >
                                        <p
                                            className="text-sm font-bold truncate"
                                            style={{ color: "var(--color-text-primary)" }}
                                        >
                                            {user.fullName || "User"}
                                        </p>
                                        <p
                                            className="text-xs truncate mt-0.5"
                                            style={{ color: "var(--color-text-muted)" }}
                                        >
                                            {user.primaryEmailAddress?.emailAddress}
                                        </p>
                                        <span
                                            className="inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                                            style={{
                                                backgroundColor: "var(--color-primary-soft)",
                                                color: "var(--color-primary-dark)",
                                            }}
                                        >
                                            {user.unsafeMetadata?.role === "driver" ? "🚗 Driver" : "🧍 Rider"}
                                        </span>
                                    </div>

                                    {/* Menu items */}
                                    <DropdownItem
                                        icon={<User size={15} />}
                                        label="My Profile"
                                        onClick={() => { navigate("/profile"); setDropdownOpen(false); }}
                                    />
                                    <DropdownItem
                                        icon={<Car size={15} />}
                                        label="My Rides"
                                        onClick={() => { navigate("/my-rides"); setDropdownOpen(false); }}
                                    />

                                    <div
                                        className="my-1 border-t"
                                        style={{ borderColor: "var(--color-border)" }}
                                    />

                                    <DropdownItem
                                        icon={<LogOut size={15} />}
                                        label="Sign Out"
                                        onClick={handleSignOut}
                                        danger
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <SignInButton mode="modal">
                                <button
                                    className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-80"
                                    style={{ color: "var(--color-text-secondary)" }}
                                >
                                    Sign In
                                </button>
                            </SignInButton>
                            <SignInButton mode="modal">
                                <button
                                    className="text-sm font-bold px-5 py-2 rounded-xl transition-all hover:opacity-90 active:scale-95"
                                    style={{
                                        backgroundColor: "var(--color-primary)",
                                        color: "var(--color-dark)",
                                    }}
                                >
                                    Get App
                                </button>
                            </SignInButton>
                        </>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden p-1"
                        onClick={() => setMobileOpen((v) => !v)}
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div
                    className="md:hidden px-4 pb-4 pt-2 flex flex-col gap-3"
                    style={{
                        backgroundColor: "var(--color-surface)",
                        borderTop: "1px solid var(--color-border)",
                    }}
                >
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="text-sm font-medium py-2"
                            style={{ color: "var(--color-text-secondary)" }}
                            onClick={() => setMobileOpen(false)}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
            )}
        </nav>
    );
}

function DropdownItem({ icon, label, onClick, danger = false }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
            style={{
                color: danger ? "var(--color-danger)" : "var(--color-text-primary)",
                backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = danger
                    ? "rgba(231,42,8,0.06)"
                    : "var(--color-surface-muted)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
            }}
        >
            <span style={{ color: danger ? "var(--color-danger)" : "var(--color-text-muted)" }}>
                {icon}
            </span>
            {label}
        </button>
    );
}
