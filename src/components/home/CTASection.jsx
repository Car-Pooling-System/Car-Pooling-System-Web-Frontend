import { SignInButton } from "@clerk/clerk-react";
import { Smartphone, Play } from "lucide-react";

export default function CTASection() {
    return (
        <section id="cta" className="w-full py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div
                    className="rounded-3xl px-8 md:px-16 py-14 md:py-20 text-center flex flex-col items-center gap-6"
                    style={{ backgroundColor: "var(--color-dark)" }}
                >
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight max-w-2xl">
                        Ready for your next adventure?
                    </h2>
                    <p className="text-sm md:text-base max-w-md leading-relaxed" style={{ color: "#a0c4ab" }}>
                        Join thousands of users who are already traveling smarter with CarPool. Sign up
                        free and book your first ride in minutes.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <SignInButton mode="modal">
                            <button
                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
                                style={{
                                    backgroundColor: "var(--color-primary)",
                                    color: "var(--color-dark)",
                                }}
                            >
                                <Smartphone size={16} />
                                Get Started Free
                            </button>
                        </SignInButton>

                        <button
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border transition-all hover:opacity-80"
                            style={{
                                borderColor: "rgba(255,255,255,0.2)",
                                color: "white",
                                backgroundColor: "transparent",
                            }}
                        >
                            <Play size={16} />
                            Watch Demo
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
