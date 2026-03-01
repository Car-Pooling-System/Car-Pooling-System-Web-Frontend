import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Clock, MapPin, TrendingUp, TrendingDown, BarChart2, Loader2 } from 'lucide-react';
import { format, parseISO, getHours } from 'date-fns';

/**
 * DemandInsightWidget - A compact, auto-updating ML-powered widget
 * 
 * Props:
 * @param {string} origin - Origin city name
 * @param {string} destination - Destination city name
 * @param {string} date - ISO date string (e.g., "2024-02-21")
 * @param {string} time - Time string in HH:mm format (e.g., "18:30")
 */
const DemandInsightWidget = ({ origin, destination, date, time }) => {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [timeoutError, setTimeoutError] = useState(false);

    useEffect(() => {
        // Requirements: Automatically fetches prediction when origin AND destination are both filled
        if (!origin || !destination || !date || !time) {
            setPrediction(null);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setTimeoutError(false);

            // Requirements: Handle loading takes > 5 seconds
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                setTimeoutError(true);
                setLoading(false);
                console.log("DemandInsightWidget: Prediction request timed out after 5s");
            }, 5000);

            try {
                // Requirements: Extract hour from time prop
                const hour = parseInt(time.split(':')[0], 10);

                // Requirements: Convert date to day_of_week
                const day_of_week = format(parseISO(date), 'EEEE');

                const payload = {
                    origin,
                    destination,
                    day_of_week,
                    hour,
                    weather: "Clear" // Requirements: Default weather to "Clear"
                };

                // Requirements: API Call POST to /api/ml/predict-demand
                const response = await axios.post('http://localhost:3000/api/ml/predict-demand', payload, {
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                setPrediction(response.data);
                setLoading(false);
            } catch (err) {
                clearTimeout(timeoutId);
                setLoading(false);
                // Requirements: If API fails, show nothing (log for debugging)
                console.error("DemandInsightWidget Error:", err.message);
            }
        };

        fetchData();
    }, [origin, destination, date, time]);

    // Requirements: Show nothing if origin or destination is empty, or if error/timeout
    if (!origin || !destination || timeoutError) return null;

    // Requirements: Shows loading skeleton while fetching
    if (loading) {
        return (
            <div className="mb-4 p-4 rounded-xl border-2 border-slate-100 bg-slate-50 animate-pulse shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                </div>
                <div className="h-10 w-24 bg-slate-200 rounded mb-2"></div>
                <div className="h-4 w-full bg-slate-200 rounded"></div>
            </div>
        );
    }

    if (!prediction) return null;

    // Determine styles based on confidence
    const getConfidenceConfig = (confidence) => {
        // Requirements: Green for high, Yellow for medium, Red for low
        if (confidence >= 0.85) {
            return {
                bg: "bg-gradient-to-br from-emerald-500 to-teal-600",
                border: "border-emerald-600",
                icon: <TrendingUp className="w-5 h-5" />,
                emoji: "🔥",
                label: "High Demand"
            };
        } else if (confidence >= 0.75) {
            return {
                bg: "bg-gradient-to-br from-amber-400 to-orange-500",
                border: "border-amber-500",
                icon: <BarChart2 className="w-5 h-5" />,
                emoji: "📊",
                label: "Moderate Demand"
            };
        } else {
            return {
                bg: "bg-gradient-to-br from-rose-500 to-pink-600",
                border: "border-rose-600",
                icon: <TrendingDown className="w-5 h-5" />,
                emoji: "📉",
                label: "Low Demand"
            };
        }
    };

    const config = getConfidenceConfig(prediction.confidence);

    return (
        <div className={`mb-4 p-4 rounded-xl border-2 ${config.border} ${config.bg} text-white shadow-sm transition-all duration-300 transform hover:scale-[1.01]`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider font-bold opacity-80 flex items-center gap-1">
                        {config.icon} {config.label}
                    </span>
                    {/* Requirements: Show large number for predicted_demand */}
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black">{prediction.predicted_demand}</span>
                        <span className="text-xs font-bold opacity-90">requests expected</span>
                    </div>
                </div>
                {/* Requirements: Small "Powered by ML" badge */}
                <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold border border-white/30 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" /> ML POWERED
                </div>
            </div>

            <div className="space-y-1 mt-3 pt-3 border-t border-white/20">
                {/* Requirements: Show route */}
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="w-3.5 h-3.5 opacity-80" />
                    <span>{origin} → {destination}</span>
                </div>
                {/* Requirements: Show time */}
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="w-3.5 h-3.5 opacity-80" />
                    <span>{format(parseISO(date), 'EEEE')} {time}</span>
                </div>
            </div>

            {/* Requirements: Show recommendation text with emoji */}
            <div className="mt-4 p-3 rounded-lg bg-black/10 border border-white/10 text-xs font-medium leading-relaxed italic">
                <span className="mr-1 text-base leading-none">{config.emoji}</span>
                "{prediction.recommendation}"
            </div>
        </div>
    );
};

export default DemandInsightWidget;
