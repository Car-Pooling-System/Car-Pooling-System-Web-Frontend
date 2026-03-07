import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

// Unsplash portrait photos — free to use
const REVIEWS = [
    {
        id: 1,
        name: "Sarah Johnson",
        role: "Frequent Traveler",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=80&h=80&fit=crop&crop=faces",
        rating: 5,
        text: "The AI routing saved me from a 2-hour traffic jam in Delhi. Absolutely seamless experience from booking to arrival.",
        route: "Connaught Place → Cyber City",
        date: "Feb 18, 2026",
    },
    {
        id: 2,
        name: "Marcus Chen",
        role: "Business Consultant",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
        rating: 5,
        text: "Personalized travel assistance is a game changer. The driver was punctual and the car was spotless — 10/10.",
        route: "Bangalore → Mysore",
        date: "Feb 19, 2026",
    },
    {
        id: 3,
        name: "Elena Rodriguez",
        role: "Adventure Blogger",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces",
        rating: 5,
        text: "I've tried many apps, but CarPool's tracking and safety features give me true peace of mind when traveling alone.",
        route: "Mumbai → Pune",
        date: "Feb 20, 2026",
    },
    {
        id: 4,
        name: "Rahul Mehta",
        role: "Software Engineer",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
        rating: 4,
        text: "Great value for money. The pet-friendly option was a lifesaver for my weekend trip with my dog.",
        route: "Hyderabad → Vijayawada",
        date: "Feb 17, 2026",
    },
    {
        id: 5,
        name: "Aisha Tremblay",
        role: "University Student",
        avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=80&h=80&fit=crop&crop=faces",
        rating: 5,
        text: "Split the cost with 3 classmates and saved so much compared to a cab. The booking flow is super smooth!",
        route: "Chennai → Pondicherry",
        date: "Feb 16, 2026",
    },
    {
        id: 6,
        name: "Priya Kapoor",
        role: "Content Creator",
        avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&crop=faces",
        rating: 5,
        text: "Verified drivers, real-time tracking and instant OTP verification — feels very secure. Highly recommend!",
        route: "Jaipur → Delhi",
        date: "Feb 15, 2026",
    },
];

const CARDS_PER_PAGE = 3;

export default function ReviewsSection() {
    const [page, setPage] = useState(0);
    const totalPages = Math.ceil(REVIEWS.length / CARDS_PER_PAGE);
    const visible = REVIEWS.slice(page * CARDS_PER_PAGE, page * CARDS_PER_PAGE + CARDS_PER_PAGE);

    return (
        <section id="reviews" style={{ backgroundColor: "var(--color-bg)" }} className="w-full py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
                    <div>
                        <h2
                            className="text-3xl md:text-4xl font-extrabold mb-2"
                            style={{ color: "var(--color-text-primary)" }}
                        >
                            What Our Customers Say
                        </h2>
                        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            Trusted by over 50,000 travelers worldwide.
                        </p>
                    </div>

                    {/* Prev / Next arrows */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                            style={{
                                border: "1px solid var(--color-border)",
                                backgroundColor: "var(--color-surface)",
                                color: "var(--color-text-secondary)",
                            }}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page === totalPages - 1}
                            className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                            style={{
                                border: "1px solid var(--color-border)",
                                backgroundColor: "var(--color-surface)",
                                color: "var(--color-text-secondary)",
                            }}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visible.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>

                {/* Dot indicators */}
                <div className="flex items-center justify-center gap-2 mt-8">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i)}
                            className="rounded-full transition-all"
                            style={{
                                width: i === page ? "24px" : "8px",
                                height: "8px",
                                backgroundColor: i === page ? "var(--color-primary)" : "var(--color-border)",
                            }}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function ReviewCard({ review }) {
    return (
        <div
            className="rounded-2xl p-6 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-md"
            style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
            }}
        >
            {/* Stars */}
            <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        size={14}
                        fill={i < review.rating ? "var(--color-primary)" : "none"}
                        stroke={i < review.rating ? "var(--color-primary)" : "var(--color-border)"}
                    />
                ))}
            </div>

            {/* Review text */}
            <p
                className="text-sm leading-relaxed flex-1"
                style={{ color: "var(--color-text-primary)" }}
            >
                &ldquo;{review.text}&rdquo;
            </p>

            {/* Route tag */}
            <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full self-start"
                style={{
                    backgroundColor: "var(--color-primary-soft)",
                    color: "var(--color-primary-dark)",
                }}
            >
                {review.route}
            </span>

            {/* User info */}
            <div
                className="flex items-center gap-3 pt-3 border-t"
                style={{ borderColor: "var(--color-border)" }}
            >
                <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=13ec5b&color=0d1f13`;
                    }}
                />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
                        {review.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                        {review.role}
                    </p>
                </div>
                <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
                    {review.date}
                </span>
            </div>
        </div>
    );
}
