import { Route, MessageCircle, Leaf, ShieldCheck } from "lucide-react";

const FEATURES = [
    {
        icon: <Route size={22} />,
        title: "Route Optimization",
        desc: "Plan efficient pick-up and drop-off routes to reduce delays and travel time.",
    },
    {
        icon: <MessageCircle size={22} />,
        title: "Chat Feature",
        desc: "Coordinate quickly with riders and drivers using in-app messaging.",
    },
    {
        icon: <Leaf size={22} />,
        title: "Carbon Footprint",
        desc: "Promote shared rides to lower emissions and make daily commuting greener.",
    },
    {
        icon: <ShieldCheck size={22} />,
        title: "Secure Booking",
        desc: "Bank-level encryption for all your transactions and personal travel data.",
    },
];

export default function FeaturesSection() {
    return (
        <section id="features" style={{ backgroundColor: "var(--color-bg)" }} className="w-full py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <p
                        className="text-xs font-bold uppercase tracking-widest mb-3"
                        style={{ color: "var(--color-primary-dark)" }}
                    >
                        Key Benefits
                    </p>
                    <h2
                        className="text-3xl md:text-4xl font-extrabold mb-4"
                        style={{ color: "var(--color-text-primary)" }}
                    >
                        Everything you need to travel smarter
                    </h2>
                    <p
                        className="text-sm max-w-md mx-auto leading-relaxed"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        Swiftly connects you with the best routes, the safest rides, and the most
                        reliable scheduling in the industry.
                    </p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {FEATURES.map((f) => (
                        <div
                            key={f.title}
                            className="rounded-2xl p-6 flex flex-col gap-3 transition-all hover:-translate-y-1 hover:shadow-md"
                            style={{
                                backgroundColor: "var(--color-surface)",
                                border: "1px solid var(--color-border)",
                            }}
                        >
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center"
                                style={{
                                    backgroundColor: "var(--color-primary-soft)",
                                    color: "var(--color-primary-dark)",
                                }}
                            >
                                {f.icon}
                            </div>
                            <h3
                                className="text-base font-bold"
                                style={{ color: "var(--color-text-primary)" }}
                            >
                                {f.title}
                            </h3>
                            <p
                                className="text-sm leading-relaxed"
                                style={{ color: "var(--color-text-secondary)" }}
                            >
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}


