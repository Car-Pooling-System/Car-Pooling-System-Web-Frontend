import React, { useState } from 'react';
import axios from 'axios';
import { MapPin, Calendar, Clock, Cloud, Zap, AlertCircle } from 'lucide-react';

const CITIES = ['Chennai', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Coimbatore'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEATHER = ['Sunny', 'Cloudy', 'Rainy'];

const DemandPredictor = () => {
    const [formData, setFormData] = useState({
        origin: 'Chennai',
        destination: 'Bangalore',
        day_of_week: 'Monday',
        hour: 12,
        weather: 'Sunny'
    });

    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setPrediction(null);

        try {
            // Calling our Node.js Backend Proxy
            const response = await axios.post('http://localhost:3000/api/ml/predict-demand', formData);
            setPrediction(response.data);
        } catch (err) {
            console.error('Prediction error:', err);
            setError(err.response?.data?.message || 'ML service unavailable. Please ensure both Backend and ML service are running.');
        } finally {
            setLoading(false);
        }
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.85) return 'bg-emerald-50 border-emerald-200 text-emerald-800';
        if (confidence >= 0.75) return 'bg-amber-50 border-amber-200 text-amber-800';
        return 'bg-rose-50 border-rose-200 text-rose-800';
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-slate-50 min-h-screen">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Smart Demand Predictor</h1>
                <p className="text-slate-600">AI-powered ride demand forecasting for smarter carpooling.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-indigo-500" /> Origin
                                </label>
                                <select
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                    value={formData.origin}
                                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                >
                                    {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-emerald-500" /> Destination
                                </label>
                                <select
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                    value={formData.destination}
                                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                >
                                    {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-amber-500" /> Day of Week
                            </label>
                            <select
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                value={formData.day_of_week}
                                onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                            >
                                {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-violet-500" /> Hour (0-23)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                    value={formData.hour}
                                    onChange={(e) => setFormData({ ...formData, hour: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Cloud className="w-4 h-4 text-sky-500" /> Weather
                                </label>
                                <select
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                    value={formData.weather}
                                    onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                                >
                                    {WEATHER.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Predicting...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5 fill-current" />
                                    Generate Prediction
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Results Card */}
                <div className="flex flex-col gap-4">
                    {!prediction && !error && !loading && (
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-12 text-center text-slate-400">
                            <Zap className="w-12 h-12 mb-4 opacity-20" />
                            <p>Enter trip details to see demand forecast</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-4 text-rose-800">
                            <AlertCircle className="w-6 h-6 shrink-0" />
                            <div>
                                <h3 className="font-bold">Error</h3>
                                <p className="text-sm opacity-90">{error}</p>
                            </div>
                        </div>
                    )}

                    {prediction && (
                        <div className={`p-8 rounded-2xl border-2 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 ${getConfidenceColor(prediction.confidence)}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Predicted Demand</h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-black">{prediction.predicted_demand}</span>
                                        <span className="text-xl font-bold opacity-60">Requests</span>
                                    </div>
                                </div>
                                <div className="px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-current/10 text-xs font-bold whitespace-nowrap">
                                    {(prediction.confidence * 100).toFixed(0)}% Confidence
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-current/10">
                                <div className="flex items-center gap-4 text-sm font-semibold">
                                    <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center shadow-sm">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    {prediction.route}
                                </div>
                                <div className="flex items-center gap-4 text-sm font-semibold">
                                    <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center shadow-sm">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    {prediction.inputs.day_of_week}, {prediction.time} ({prediction.inputs.weather})
                                </div>
                            </div>

                            <div className="mt-8 p-6 rounded-xl bg-white/40 border border-white/50 shadow-sm">
                                <p className="text-sm font-medium leading-relaxed italic">
                                    "{prediction.recommendation}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DemandPredictor;
