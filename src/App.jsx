import { Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";

import HomePage from "./pages/HomePage.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import RiderRides from "./pages/rider/RiderRides.jsx";
import DriverRides from "./pages/driver/DriverRides.jsx";

/* PAYMENT MODULE */
import PaymentSummaryPage from "./payment/pages/PaymentSummaryPage.jsx";
import PaymentPage from "./payment/pages/PaymentPage.jsx";
import PaymentSuccess from "./payment/pages/PaymentSuccess.jsx";
import PaymentFailed from "./payment/pages/PaymentFailed.jsx";
import PaymentHistoryPage from "./payment/pages/PaymentHistoryPage.jsx";
import DriverEarningsPage from "./payment/pages/DriverEarningsPage.jsx";
import DriverCommissionPage from "./payment/pages/DriverCommissionPage.jsx";
import DriverBankSetupPage from "./payment/pages/DriverBankSetupPage.jsx";
import PaymentReceiptPage from "./payment/pages/PaymentReceiptPage.jsx";

function RoleInitializer() {

    const { isSignedIn, user } = useUser();

    useEffect(() => {

        if (!isSignedIn || !user) return;

        if (!user.unsafeMetadata?.role) {

            user.update({
                unsafeMetadata: {
                    ...user.unsafeMetadata,
                    role: "rider"
                }
            });

        }

    }, [isSignedIn, user]);

    return null;
}

export default function App() {

    const { user, isLoaded } = useUser();

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    const role = user?.unsafeMetadata?.role || "rider";

    return (

        <>
            <RoleInitializer />

            <Routes>

                {/* MAIN ROUTES */}

                <Route path="/" element={<HomePage />} />

                <Route path="/sign-in" element={<SignInPage />} />

                <Route path="/profile" element={<ProfilePage />} />

                <Route
                    path="/my-rides"
                    element={role === "driver"
                        ? <DriverRides />
                        : <RiderRides />}
                />

                {/* PAYMENT MODULE */}

                <Route path="/payment-summary" element={<PaymentSummaryPage />} />

                <Route path="/payment" element={<PaymentPage />} />

                <Route path="/payment-success" element={<PaymentSuccess />} />

                <Route path="/payment-failed" element={<PaymentFailed />} />

                <Route path="/payment-history" element={<PaymentHistoryPage />} />

                <Route path="/driver-earnings" element={<DriverEarningsPage />} />

                <Route path="/driver-commission" element={<DriverCommissionPage />} />

                <Route path="/driver-bank" element={<DriverBankSetupPage />} />

                <Route path="/payment-receipt" element={<PaymentReceiptPage />} />

                {/* FALLBACK */}

                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>

        </>
    );
}