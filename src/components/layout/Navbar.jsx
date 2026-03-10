import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import {
    User,
    Car,
    LogOut,
    ChevronDown,
    Menu,
    X,
    Loader2,
    Search,
    PlusCircle,
} from "lucide-react";

export default function Navbar() {
    const { isSignedIn, user } = useUser();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [roleSwitching, setRoleSwitching] = useState(false);
    const dropdownRef = useRef(null);

    const currentRole = user?.unsafeMetadata?.role === "driver" ? "driver" : "rider";

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

    const handleRoleSwitch = async (nextRole) => {
        if (!user || roleSwitching || nextRole === currentRole) return;

        setRoleSwitching(true);
        try {
            await user.update({ unsafeMetadata: { ...user.unsafeMetadata, role: nextRole } });
            await user.reload();
            setDropdownOpen(false);
            navigate(nextRole === "driver" ? "/driver/create-ride" : "/search");
        } catch (err) {
            console.error("Failed to switch role:", err);
        } finally {
            setRoleSwitching(false);
        }
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
                        Swiftly
                    </span>
                    <span
                        className="text-xs font-semibold px-1.5 py-0.5 rounded"
                        style={{
                            backgroundColor: "var(--color-primary-soft)",
                            color: "var(--color-primary-dark)",
                        }}
                    >
                        Everywhere
                    </span>
                </Link>

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

                            {dropdownOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-60 rounded-2xl shadow-lg py-2 z-50"
                                    style={{
                                        backgroundColor: "var(--color-surface)",
                                        border: "1px solid var(--color-border)",
                                    }}
                                >
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
                                            {currentRole === "driver" ? "Driver" : "Rider"}
                                        </span>
                                    </div>

                                    <div
                                        className="px-4 py-3 border-b"
                                        style={{ borderColor: "var(--color-border)" }}
                                    >
                                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                                            Switch Role
                                        </p>
                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                            <RoleSwitchButton
                                                label="Rider"
                                                selected={currentRole === "rider"}
                                                disabled={roleSwitching}
                                                onClick={() => handleRoleSwitch("rider")}
                                            />
                                            <RoleSwitchButton
                                                label="Driver"
                                                selected={currentRole === "driver"}
                                                disabled={roleSwitching}
                                                onClick={() => handleRoleSwitch("driver")}
                                            />
                                        </div>
                                        {roleSwitching && (
                                            <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                                                <Loader2 size={12} className="animate-spin" />
                                                Updating role...
                                            </div>
                                        )}
                                    </div>

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
                                    {currentRole === "driver" ? (
                                        <DropdownItem
                                            icon={<PlusCircle size={15} />}
                                            label="Create Ride"
                                            onClick={() => { navigate("/driver/create-ride"); setDropdownOpen(false); }}
                                        />
                                    ) : (
                                        <DropdownItem
                                            icon={<Search size={15} />}
                                            label="Search Rides"
                                            onClick={() => { navigate("/search"); setDropdownOpen(false); }}
                                        />
                                    )}

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
                            <Link
                                to="/sign-in"
                                className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-80"
                                style={{ color: "var(--color-text-secondary)" }}
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/sign-up"
                                className="text-sm font-bold px-5 py-2 rounded-xl transition-all hover:opacity-90 active:scale-95"
                                style={{
                                    backgroundColor: "var(--color-primary)",
                                    color: "var(--color-dark)",
                                }}
                            >
                                Sign Up
                            </Link>
                        </>
                    )}

                    <button
                        className="md:hidden p-1"
                        onClick={() => setMobileOpen((v) => !v)}
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

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

function RoleSwitchButton({ label, selected, disabled, onClick }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || selected}
            className="px-2 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-70"
            style={{
                backgroundColor: selected ? "var(--color-primary-soft)" : "var(--color-surface)",
                borderColor: selected ? "var(--color-primary)" : "var(--color-border)",
                color: selected ? "var(--color-primary-dark)" : "var(--color-text-secondary)",
            }}
        >
            {label}
        </button>
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

