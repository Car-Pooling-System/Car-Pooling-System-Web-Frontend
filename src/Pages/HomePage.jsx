import Navbar from "../components/layout/Navbar.jsx";
import Footer from "../components/layout/Footer.jsx";
import HeroSection from "../components/home/HeroSection.jsx";
import FeaturesSection from "../components/home/FeaturesSection.jsx";
import ReviewsSection from "../components/home/ReviewsSection.jsx";
import CTASection from "../components/home/CTASection.jsx";

export default function HomePage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
                <HeroSection />
                <FeaturesSection />
                <ReviewsSection />
                <CTASection />
            </main>
            <Footer />
        </div>
    );
}
