import { SignIn } from "@clerk/clerk-react";
import { Car } from "lucide-react";

export default function SignInPage() {
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
            style={{ backgroundColor: "var(--color-bg)" }}
        >
            {/* Brand header */}
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

            <SignIn
                routing="hash"
                afterSignInUrl="/"
                afterSignUpUrl="/"
                appearance={{
                    variables: {
                        colorPrimary: "#13ec5b",
                        colorText: "#111813",
                        colorBackground: "#ffffff",
                        colorInputBackground: "#f0f4f2",
                        colorInputText: "#111813",
                        borderRadius: "12px",
                        fontFamily: "Inter, sans-serif",
                    },
                    elements: {
                        card: "shadow-sm border border-[var(--color-border)] rounded-2xl",
                        headerTitle: "font-extrabold text-xl",
                        socialButtonsBlockButton:
                            "border border-[var(--color-border)] rounded-xl font-semibold text-sm",
                        formButtonPrimary:
                            "bg-[var(--color-primary)] text-[var(--color-dark)] font-bold rounded-xl hover:opacity-90",
                    },
                }}
            />
        </div>
    );
}
