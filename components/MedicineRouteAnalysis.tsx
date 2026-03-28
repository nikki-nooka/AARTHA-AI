
import React, { useState, useEffect } from 'react';
import { getMedicineRouteAnalysis, getRealTimeAlertsByLocation } from '../services/geminiService';
import type { MedicineRouteAnalysisResult, MedicineRoute, Alert } from '../types';
import { useI18n } from './I18n';
import { LoadingSpinner } from './LoadingSpinner';
import { DirectionsIcon, MapIcon, SummaryIcon, HazardIcon, AlertTriangleIcon, NewspaperIcon, CloudIcon } from './icons';

interface MedicineRouteAnalysisProps {
    defaultTo?: string;
    autoFetch?: boolean;
}

export const MedicineRouteAnalysis: React.FC<MedicineRouteAnalysisProps> = ({ defaultTo = "", autoFetch = false }) => {
    const [from, setFrom] = useState("Main Warehouse, Central City");
    const [to, setTo] = useState(defaultTo || "");
    const [mode, setMode] = useState<'land' | 'water' | 'air'>('land');
    const [analysis, setAnalysis] = useState<MedicineRouteAnalysisResult | null>(null);
    const [realTimeAlerts, setRealTimeAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { language } = useI18n();

    useEffect(() => {
        if (defaultTo) {
            setTo(defaultTo);
        }
    }, [defaultTo]);

    useEffect(() => {
        if (autoFetch && from && to) {
            fetchAnalysis();
        }
    }, [autoFetch, from, to]);

    const fetchAnalysis = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!from || !to) return;

        setIsLoading(true);
        setError(null);
        try {
            const [routeResult, alertsResult] = await Promise.all([
                getMedicineRouteAnalysis(from, to, mode, language),
                getRealTimeAlertsByLocation(to, language)
            ]);
            setAnalysis(routeResult);
            setRealTimeAlerts(alertsResult);
        } catch (err) {
            console.error("Route analysis failed:", err);
            setError("Failed to analyze routes. Please check your inputs and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigate = (routeName?: string) => {
        let travelMode = 'driving';
        if (mode === 'water') travelMode = 'transit'; // Best approximation for water if ferry available
        if (mode === 'air') travelMode = 'driving'; // Air doesn't have a mode in standard maps, using driving to destination
        
        const query = routeName ? `${to} via ${routeName}` : to;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=${travelMode}`;
        window.open(url, '_blank');
    };

    const getStatusColor = (status: MedicineRoute['alertStatus']) => {
        switch (status) {
            case 'red': return 'bg-rose-500';
            case 'orange': return 'bg-orange-500';
            case 'green': return 'bg-emerald-500';
            default: return 'bg-slate-500';
        }
    };

    const getStatusBg = (status: MedicineRoute['alertStatus']) => {
        switch (status) {
            case 'red': return 'bg-rose-50 border-rose-200';
            case 'orange': return 'bg-orange-50 border-orange-200';
            case 'green': return 'bg-emerald-50 border-emerald-200';
            default: return 'bg-slate-50 border-slate-200';
        }
    };

    const getStatusText = (status: MedicineRoute['alertStatus']) => {
        switch (status) {
            case 'red': return 'text-rose-700';
            case 'orange': return 'text-orange-700';
            case 'green': return 'text-emerald-700';
            default: return 'text-slate-700';
        }
    };

    const getAlertIcon = (category: string) => {
        switch (category) {
            case 'weather': return <CloudIcon className="w-4 h-4" />;
            case 'news': return <NewspaperIcon className="w-4 h-4" />;
            default: return <AlertTriangleIcon className="w-4 h-4" />;
        }
    };

    const getSeverityColor = (severity?: string) => {
        switch (severity) {
            case 'high': return 'text-rose-600 bg-rose-50 border-rose-100';
            case 'medium': return 'text-orange-600 bg-orange-50 border-orange-100';
            default: return 'text-blue-600 bg-blue-50 border-blue-100';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
                <DirectionsIcon className="w-8 h-8 text-blue-500" />
                <div>
                    <h4 className="text-lg font-bold text-slate-800">Medicine Route Analysis</h4>
                    <p className="text-slate-500 text-sm">Optimized emergency delivery paths</p>
                </div>
            </div>

            <form onSubmit={fetchAnalysis} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">From (Origin)</label>
                        <input 
                            type="text" 
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            placeholder="Current location or facility"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">To (Destination)</label>
                        <input 
                            type="text" 
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="Patient location or hospital"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Transport Category</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['land', 'water', 'air'] as const).map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMode(m)}
                                className={`py-2 px-3 rounded-lg text-xs font-bold capitalize transition-all border-2 ${mode === m ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200'}`}
                            >
                                {m} Way
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading ? <LoadingSpinner /> : <MapIcon className="w-5 h-5" />}
                    {isLoading ? 'Analyzing...' : 'Find Best Route'}
                </button>
            </form>

            {isLoading && (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                    <LoadingSpinner />
                    <p className="mt-4 text-slate-600 font-medium">Analyzing medicine delivery routes...</p>
                    <p className="text-xs text-slate-400 mt-1">Calculating traffic and weather impact for {mode} transport</p>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {analysis && !isLoading && (
                <div className="space-y-6">
                    {/* Real-time Alerts Section */}
                    {realTimeAlerts.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <AlertTriangleIcon className="w-4 h-4 text-orange-500" />
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Real-time Area Alerts</h5>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {realTimeAlerts.map((alert) => (
                                    <div key={alert.id} className={`p-3 rounded-xl border flex gap-3 items-start transition-all hover:shadow-sm ${getSeverityColor(alert.severity)}`}>
                                        <div className="mt-0.5">
                                            {getAlertIcon(alert.category)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h6 className="text-sm font-bold leading-tight">{alert.title}</h6>
                                                <span className="text-[10px] font-black uppercase opacity-60">{alert.category}</span>
                                            </div>
                                            <p className="text-xs mt-1 opacity-90 leading-relaxed">{alert.detailedInfo}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4">
                        {(analysis.routes || [])
                            .sort((a, b) => (b.isBest ? 1 : 0) - (a.isBest ? 1 : 0))
                            .map((route) => (
                            <div 
                                key={route.id} 
                                className={`relative p-4 rounded-xl border-2 transition-all ${route.isBest ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200'} ${getStatusBg(route.alertStatus)}`}
                            >
                                {route.isBest && (
                                    <div className="absolute -top-3 left-4 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                        Recommended
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${getStatusColor(route.alertStatus)} shadow-sm`} />
                                        <h5 className="font-bold text-slate-800">{route.name}</h5>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-black text-slate-900">{route.time}</span>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Est. Arrival</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                                    <div className="bg-white/60 backdrop-blur-sm p-2 rounded-lg border border-slate-200/50">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Traffic</p>
                                        <p className={`text-xs font-semibold ${route.trafficCondition === 'Heavy' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {route.trafficCondition}
                                        </p>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-sm p-2 rounded-lg border border-slate-200/50">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Weather</p>
                                        <p className="text-xs font-semibold text-slate-700">{route.weatherCondition}</p>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-sm p-2 rounded-lg border border-slate-200/50">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Delay</p>
                                        <p className={`text-xs font-semibold ${route.delay && route.delay !== 'None' ? 'text-orange-600' : 'text-emerald-600'}`}>
                                            {route.delay || 'None'}
                                        </p>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-sm p-2 rounded-lg border border-slate-200/50">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Load</p>
                                        <p className="text-xs font-semibold text-slate-700">{route.load || 'Normal'}</p>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-sm p-2 rounded-lg border border-slate-200/50">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Distance</p>
                                        <p className="text-xs font-semibold text-slate-700">{route.distance} km</p>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-sm p-2 rounded-lg border border-slate-200/50">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Duration</p>
                                        <p className="text-xs font-semibold text-slate-700">{route.duration} mins</p>
                                    </div>
                                </div>

                                <p className={`text-xs leading-relaxed mb-4 ${getStatusText(route.alertStatus)}`}>
                                    {route.description}
                                </p>

                                <button 
                                    onClick={() => handleNavigate(route.name)}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-white/80 hover:bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-all"
                                >
                                    <DirectionsIcon className="w-4 h-4 text-blue-500" />
                                    Navigate in Google Maps
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <SummaryIcon className="w-5 h-5 text-blue-400" />
                                <h5 className="text-sm font-bold uppercase tracking-widest text-blue-400">Best Route Analysis</h5>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed italic mb-4">
                                "{analysis.bestAnalysis || 'No analysis available for this route.'}"
                            </p>
                            {analysis.routes.find(r => r.isBest) && (
                                <button 
                                    onClick={() => handleNavigate(analysis.routes.find(r => r.isBest)?.name)}
                                    className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                >
                                    <DirectionsIcon className="w-5 h-5" />
                                    Start Best Route Navigation
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
