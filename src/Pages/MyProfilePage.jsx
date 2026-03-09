import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Edit3 } from "lucide-react";
import Navbar from "../components/layout/Navbar.jsx";
import Footer from "../components/layout/Footer.jsx";
import { useProfile } from "../hooks/useProfile.js";
import { ProfileHeader, DriverBody, RiderBody } from "./ProfilePage.jsx";

export default function MyProfilePage() {
    const { isSignedIn, isLoaded, user } = useUser();
    const navigate = useNavigate();
    const { data, loading, error } = useProfile();

    useEffect(() => {
        if (isLoaded && !isSignedIn) navigate("/");
    }, [isLoaded, isSignedIn, navigate]);

    const role = data?.role || user?.unsafeMetadata?.role || "rider";

    const handleEdit = () => {
        if (role === "driver") {
            navigate("/driver/edit-profile");
        } else {
            navigate("/rider/edit-profile");
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg)" }}>
            <Navbar />
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-3">
                        <div className="animate-spin" style={{ color: "var(--color-primary)" }}>⏳</div>
                        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading your profile…</p>
                    </div>
                ) : error ? (
                    <div className="p-4 bg-red-100 border border-red-400 rounded">
                        <p style={{ color: "var(--color-danger)" }}>{error}</p>
                    </div>
                ) : (
                    <>
                        {/* Profile Header + Edit Button */}
                        <div className="relative">
                            <ProfileHeader user={user} data={data} />
                            <button
                                onClick={handleEdit}
                                className="absolute top-5 right-5 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:shadow-md"
                                style={{
                                    backgroundColor: "var(--color-primary)",
                                    color: "var(--color-dark)",
                                }}
                            >
                                <Edit3 size={14} />
                                Edit Profile
                            </button>
                        </div>

                        {/* Body based on role */}
                        {data?.role === "driver" ? (
                            <DriverBody data={data} user={user} />
                        ) : (
                            <RiderBody data={data} />
                        )}
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
