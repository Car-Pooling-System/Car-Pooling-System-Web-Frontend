import { Car } from "lucide-react";

const FOOTER_LINKS = {
    Company: ["About Us", "Careers", "Blog", "Press"],
    Support: ["Help Center", "Safety Center", "Community", "Contact"],
    Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Compliance"],
};

export default function Footer() {
    return (
        <footer
            className="w-full py-12"
            style={{
                backgroundColor: "var(--color-surface)",
                borderTop: "1px solid var(--color-border)",
            }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-3">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: "var(--color-primary)" }}
                            >
                                <Car size={16} color="#0d1f13" strokeWidth={2.5} />
                            </div>
                            <span className="text-base font-extrabold" style={{ color: "var(--color-text-primary)" }}>
                                CarPool
                            </span>
                        </div>
                        <p className="text-xs leading-relaxed max-w-[200px]" style={{ color: "var(--color-text-secondary)" }}>
                            Revolutionizing the way you travel with predictive AI intelligence and real-time navigation tools.
                        </p>
                    </div>

                    {/* Link columns */}
                    {Object.entries(FOOTER_LINKS).map(([section, links]) => (
                        <div key={section}>
                            <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--color-text-muted)" }}>
                                {section}
                            </h4>
                            <ul className="flex flex-col gap-2">
                                {links.map((link) => (
                                    <li key={link}>
                                        <a
                                            href="#"
                                            className="text-sm transition-opacity hover:opacity-60"
                                            style={{ color: "var(--color-text-secondary)" }}
                                        >
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div
                    className="border-t pt-6 text-center text-xs"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                >
                    © 2026 CarPool. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
