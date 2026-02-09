import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Car, Users } from "lucide-react";

export default function RoleSelection() {
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleRoleSelection = async (role) => {
        if (!isLoaded || !user) return;

        try {
            setLoading(true);

            // ✅ Update role in Clerk metadata
            await user.update({
                unsafeMetadata: {
                    ...user.unsafeMetadata,
                    role,
                },
            });

            // ✅ Redirect AFTER successful update
            if (role === "driver") {
                navigate("/reg-driver", { replace: true });
            } else {
                navigate("/reg-rider", { replace: true });
            }
        } catch (err) {
            console.error("Error setting role:", err);
            alert("Failed to set role. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ⏳ Wait for Clerk
    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-500 to-purple-700 px-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4">
                        Welcome to RideShare!
                    </h1>
                    <p className="text-xl text-white/90">
                        Choose how you'd like to get started
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Driver */}
                    <button
                        onClick={() => handleRoleSelection("driver")}
                        disabled={loading}
                        className="group bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl p-8 hover:bg-white/20 transition disabled:opacity-50"
                    >
                        <div className="flex flex-col items-center space-y-6">
                            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center">
                                <Car className="w-12 h-12 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">
                                I'm a Driver
                            </h2>
                        </div>
                    </button>

                    {/* Rider */}
                    <button
                        onClick={() => handleRoleSelection("rider")}
                        disabled={loading}
                        className="group bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl p-8 hover:bg-white/20 transition disabled:opacity-50"
                    >
                        <div className="flex flex-col items-center space-y-6">
                            <div className="w-24 h-24 bg-purple-500 rounded-full flex items-center justify-center">
                                <Users className="w-12 h-12 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">
                                I'm a Rider
                            </h2>
                        </div>
                    </button>
                </div>

                {loading && (
                    <p className="text-center text-white mt-8">
                        Setting up your account...
                    </p>
                )}
            </div>
        </div>
    );
}