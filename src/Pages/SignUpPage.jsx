import { SignUp } from "@clerk/clerk-react";
import { Car } from "lucide-react";
import { clerkAuthAppearance } from "../constants/clerkAppearance.js";

export default function SignUpPage() {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
            style={{ backgroundColor: "var(--color-bg)" }}
        >
            <div className="flex items-center gap-2 mb-8">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-primary)" }}
                >
                    <Car size={18} color="#0d1f13" strokeWidth={2.5} />
                </div>
                <span className="text-2xl font-extrabold" style={{ color: "var(--color-text-primary)" }}>
                    CarPool
                </span>
            </div>

            <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                afterSignInUrl="/"
                afterSignUpUrl="/"
                appearance={clerkAuthAppearance}
            />
        </div>
    );
}
