import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Construction } from 'lucide-react';

export default function RiderRegistration() {
    const navigate = useNavigate();

    useEffect(() => {
        // Auto-redirect to home after 3 seconds
        const timer = setTimeout(() => {
            navigate('/home');
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-500 to-purple-700 px-4">
            <div className="max-w-2xl w-full bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl p-12 text-center">
                <Construction className="w-24 h-24 text-yellow-300 mx-auto mb-6 animate-bounce" />

                <h1 className="text-4xl font-bold text-white mb-4">
                    Rider Registration
                </h1>

                <div className="bg-yellow-500/20 border border-yellow-300/30 rounded-lg p-6 mb-6">
                    <p className="text-2xl text-white font-semibold mb-2">
                        🚧 Under Construction 🚧
                    </p>
                    <p className="text-white/90 text-lg">
                        We're working hard to bring you the rider registration experience.
                    </p>
                </div>

                <p className="text-white/80 text-lg mb-4">
                    You'll be redirected to the home page in a moment...
                </p>

                <div className="flex justify-center items-center space-x-2">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-75"></div>
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-150"></div>
                </div>
            </div>
        </div>
    );
}
