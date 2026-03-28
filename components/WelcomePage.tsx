import React, { useState, useEffect, useMemo } from 'react';
import type { User, WaterLogSettings, WaterLogEntry, ActivityLogItem, Partner } from '../types';
import { ScanIcon, StethoscopeIcon, DocumentChartBarIcon, SparklesIcon, ChevronRightIcon, GlassWaterIcon, BuildingOfficeIcon, ActivityIcon as ActivityChartIcon, MapPinIcon, ClockIcon, RouteIcon, TruckIcon, ArrowRightIcon, ShieldCheckIcon, HeartPulseIcon } from './icons';
import { useI18n } from './I18n';
import { getMedicineRouteAnalysis } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const WATER_LOG_SETTINGS_KEY = 'artha_waterlog_settings';
const WATER_LOG_TODAY_KEY = 'artha_waterlog_today';
const ACTIVITY_HISTORY_KEY = 'artha_activity_history';
const PARTNERS_STORAGE_KEY = 'artha_partners_data';

const DEFAULT_SETTINGS: WaterLogSettings = {
  goal: 2500,
  notifications: { enabled: false, startTime: '09:00', endTime: '21:00', frequency: 60, },
};

const Card: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties; delay?: number }> = ({ children, className = '', style, delay = 0 }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={`bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-white/60 ${className}`}
        style={style}
    >
        {children}
    </motion.div>
);

const WaterLogWidget: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
    const [settings, setSettings] = useState<WaterLogSettings>(DEFAULT_SETTINGS);
    const [log, setLog] = useState<WaterLogEntry[]>([]);
    
    useEffect(() => {
        try {
            const storedSettings = localStorage.getItem(WATER_LOG_SETTINGS_KEY);
            if (storedSettings) setSettings(JSON.parse(storedSettings));

            const storedLog = localStorage.getItem(WATER_LOG_TODAY_KEY);
            if (storedLog) {
                const todayLog = JSON.parse(storedLog);
                const today = new Date().toDateString();
                const filteredLog = todayLog.filter((entry: WaterLogEntry) => new Date(entry.timestamp).toDateString() === today);
                setLog(filteredLog);
            }
        } catch (e) { console.error("Failed to load water log data", e); }
    }, []);

    const totalIntake = useMemo(() => log.reduce((sum, entry) => sum + entry.amount, 0), [log]);
    const progress = useMemo(() => Math.min((totalIntake / settings.goal) * 100, 100), [totalIntake, settings.goal]);

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-cyan-100 rounded-xl">
                        <GlassWaterIcon className="w-5 h-5 text-cyan-600" />
                    </div>
                    Hydration
                </h3>
                <div className="px-3 py-1 bg-cyan-50 text-cyan-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-cyan-100">Daily</div>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center gap-8">
                <div className="relative w-44 h-44">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                        <motion.circle 
                            cx="50" cy="50" r="45" 
                            fill="none" stroke="url(#waterGradient)" strokeWidth="8" 
                            strokeDasharray="282.7" 
                            initial={{ strokeDashoffset: 282.7 }}
                            animate={{ strokeDashoffset: 282.7 - (282.7 * progress) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round" 
                        />
                        <defs>
                            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-4xl font-black text-slate-900">{Math.round(progress)}%</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Goal</span>
                    </div>
                </div>
                <div className="text-center">
                    <div className="flex items-baseline justify-center gap-1">
                        <p className="text-4xl font-black text-slate-900">{totalIntake}</p>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">ml</p>
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-2">Target: {settings.goal} ml</p>
                </div>
            </div>
            <button 
                onClick={onNavigate} 
                className="mt-8 w-full py-4 bg-cyan-500 text-white rounded-2xl font-black text-sm hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-100 flex items-center justify-center gap-2 group"
            >
                Log Intake
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
};

const ActivityChart: React.FC = () => {
    const [data, setData] = useState<{ name: string; value: number }[]>([]);

    useEffect(() => {
        try {
            const history: ActivityLogItem[] = JSON.parse(localStorage.getItem(ACTIVITY_HISTORY_KEY) || '[]');
            const activityByDay = Array(7).fill(0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            history.forEach(item => {
                const itemDate = new Date(item.timestamp);
                itemDate.setHours(0, 0, 0, 0);
                const diffDays = Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 3600 * 24));
                if (diffDays >= 0 && diffDays < 7) {
                    const dayIndex = (today.getDay() - diffDays + 7) % 7;
                    activityByDay[dayIndex]++;
                }
            });

            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayOfWeek = today.getDay();
            const orderedData = [];
            for (let i = 0; i < 7; i++) {
                const index = (dayOfWeek + 1 + i) % 7;
                orderedData.push({ name: days[index], value: activityByDay[index] });
            }
            setData(orderedData);
        } catch (e) {
            console.error("Failed to process activity data", e);
        }
    }, []);

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-xl">
                        <ActivityChartIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    Activity
                </h3>
                <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100">Weekly</div>
            </div>
            <div className="flex-grow w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="100%">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.6} />
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                            dy={10}
                        />
                        <Tooltip 
                            cursor={{ fill: '#f8fafc', radius: 12 }}
                            contentStyle={{ 
                                borderRadius: '24px', 
                                border: 'none', 
                                boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                                padding: '16px 20px',
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(20px)'
                            }}
                            itemStyle={{ fontWeight: 900, fontSize: '14px', color: '#1e293b' }}
                            labelStyle={{ fontWeight: 900, fontSize: '11px', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        />
                        <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={28}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 6 ? 'url(#barGradient)' : '#f1f5f9'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const LogisticsWidget: React.FC = () => {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [result, setResult] = useState<{ distance: string; time: string; analysis?: string; routeName?: string } | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const handleCalculate = async () => {
        if (!from || !to) return;
        setIsCalculating(true);
        try {
            const analysis = await getMedicineRouteAnalysis(from, to, 'land', 'English');
            const bestRoute = analysis.routes.find(r => r.isBest) || analysis.routes[0];
            
            setResult({
                distance: `${bestRoute.distance} km`,
                time: `${bestRoute.duration} mins`,
                analysis: analysis.bestAnalysis,
                routeName: bestRoute.name
            });
        } catch (error) {
            console.error("Failed to calculate route:", error);
            // Fallback to simulation if API fails, but with a warning
            const dist = (Math.random() * 50 + 5).toFixed(1);
            const time = Math.round(parseFloat(dist) * 2.5 + Math.random() * 10);
            setResult({
                distance: `${dist} km (Simulated)`,
                time: `${time} mins (Simulated)`,
                analysis: "Real-time analysis unavailable. Showing estimated values based on distance."
            });
        } finally {
            setIsCalculating(false);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-xl">
                        <TruckIcon className="w-5 h-5 text-orange-600" />
                    </div>
                    Logistics
                </h3>
                <div className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-orange-100">Smart Route</div>
            </div>

            <div className="space-y-6 flex-grow relative">
                {/* Route Connector Line */}
                <div className="absolute left-[22px] top-[44px] bottom-[110px] w-[2px] bg-slate-100 z-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-orange-500/50 to-transparent"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center shadow-sm">
                            <MapPinIcon className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Origin</p>
                            <input 
                                type="text" 
                                placeholder="Enter starting point" 
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center shadow-sm">
                            <RouteIcon className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Destination</p>
                            <input 
                                type="text" 
                                placeholder="Enter destination" 
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleCalculate}
                    disabled={isCalculating || !from || !to}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-slate-200 mt-4"
                >
                    {isCalculating ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            Calculate Route
                            <ArrowRightIcon className="w-4 h-4" />
                        </>
                    )}
                </button>

                <AnimatePresence>
                    {result && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mt-6 space-y-4"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Distance</p>
                                    <p className="text-xl font-black text-blue-900">{result.distance}</p>
                                </div>
                                <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100/50">
                                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-1">Est. Time</p>
                                    <p className="text-xl font-black text-teal-900">{result.time}</p>
                                </div>
                            </div>
                            
                            {result.routeName && (
                                <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Recommended Route</p>
                                    <p className="text-sm font-bold text-orange-900">{result.routeName}</p>
                                </div>
                            )}

                            {result.analysis && (
                                <div className="p-4 bg-slate-900 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Expert Analysis</p>
                                    <p className="text-xs font-medium text-slate-300 leading-relaxed">{result.analysis}</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const PartnersWidget: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPartners = () => {
            try {
                const storedPartners = localStorage.getItem(PARTNERS_STORAGE_KEY);
                const partnersData = storedPartners ? JSON.parse(storedPartners) : [];
                setPartners(partnersData);
            } catch (error) {
                console.error("Error loading partners from localStorage:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPartners();
        window.addEventListener('storage', loadPartners);
        return () => window.removeEventListener('storage', loadPartners);
    }, []);

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-rose-100 rounded-xl">
                        <BuildingOfficeIcon className="w-5 h-5 text-rose-600" />
                    </div>
                    Medical Network
                </h3>
                <button onClick={onNavigate} className="w-8 h-8 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-full transition-all flex items-center justify-center group">
                    <ChevronRightIcon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                </button>
            </div>
            
            <div className="flex-grow">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : partners.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {partners.slice(0, 3).map(partner => (
                            <div key={partner.id} className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-xl hover:border-rose-100 transition-all duration-500 group cursor-pointer">
                                <div className="relative shrink-0">
                                    {partner.logoUrl ? (
                                        <img src={partner.logoUrl} alt={partner.name} className="w-12 h-12 rounded-2xl object-cover shadow-sm" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                                            <BuildingOfficeIcon className="w-6 h-6" />
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-900 truncate group-hover:text-rose-600 transition-colors">{partner.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest mt-0.5">{partner.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                        <BuildingOfficeIcon className="w-10 h-10 text-slate-300 mb-4" />
                        <p className="text-sm font-bold text-slate-500">No partners connected</p>
                        <button onClick={onNavigate} className="text-[10px] font-black text-rose-600 mt-4 uppercase tracking-[0.2em] hover:text-rose-700 transition-colors">
                            Connect Now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const QuickActionCard: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; onClick: () => void; color: string }> = ({ icon, title, subtitle, onClick, color }) => (
    <motion.button
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="group flex items-center gap-5 p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-500 text-left w-full"
    >
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-lg shadow-current/10 group-hover:scale-110 transition-transform duration-500 shrink-0`}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-black text-slate-900 tracking-tight text-base">{title}</p>
            <p className="text-xs font-bold text-slate-400 mt-1 leading-relaxed truncate">{subtitle}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shrink-0">
            <ChevronRightIcon className="w-4 h-4" />
        </div>
    </motion.button>
);

interface WelcomePageProps {
  user: User;
  onAnalyze: () => void;
  onAnalyzePrescription: () => void;
  onAnalyzeMentalHealth: () => void;
  onCheckSymptoms: () => void;
  onWaterLog: () => void;
  onNavigateToPartners: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ user, onAnalyze, onAnalyzePrescription, onAnalyzeMentalHealth, onCheckSymptoms, onWaterLog, onNavigateToPartners }) => {
    const { t } = useI18n();
    
    const actions = [
        { icon: <ScanIcon className="w-6 h-6 text-white" />, title: t('area_scan'), subtitle: t('area_scan_desc'), onClick: onAnalyze, color: 'bg-blue-500' },
        { icon: <StethoscopeIcon className="w-6 h-6 text-white" />, title: t('symptom_checker'), subtitle: t('symptom_checker_desc'), onClick: onCheckSymptoms, color: 'bg-teal-500' },
        { icon: <DocumentChartBarIcon className="w-6 h-6 text-white" />, title: t('script_reader'), subtitle: t('script_reader_desc'), onClick: onAnalyzePrescription, color: 'bg-orange-500' },
        { icon: <SparklesIcon className="w-6 h-6 text-white" />, title: t('mind_check'), subtitle: t('mind_check_desc'), onClick: onAnalyzeMentalHealth, color: 'bg-indigo-500' },
        { icon: <GlassWaterIcon className="w-6 h-6 text-white" />, title: t('water_log'), subtitle: t('water_log_desc'), onClick: onWaterLog, color: 'bg-cyan-500' },
    ];

    return (
        <div className="relative w-full min-h-screen overflow-y-auto bg-[#f8fafc] selection:bg-blue-100">
            {/* Decorative Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/40 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto p-6 sm:p-8 lg:p-12">
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                            {t('welcome_user', { name: user.name.split(' ')[0] })}
                            <span className="text-blue-500">.</span>
                        </h1>
                        <p className="text-lg font-medium text-slate-500 mt-2">{t('what_today')}</p>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex items-center gap-4 p-2 bg-white rounded-3xl shadow-sm border border-slate-100"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xl">
                            {user.name.charAt(0)}
                        </div>
                        <div className="pr-4">
                            <p className="text-sm font-black text-slate-900">{user.name}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Premium Member</p>
                        </div>
                    </motion.div>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
                    {/* Left Column: Health & Activity */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Daily Summary Header */}
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group border border-white/5"
                        >
                            {/* Animated Background Orbs */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full -mr-48 -mt-48 group-hover:bg-blue-500/30 transition-colors duration-1000"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full -ml-32 -mb-32 group-hover:bg-indigo-500/20 transition-colors duration-1000"></div>
                            
                            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                <div className="max-w-md">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Daily Intelligence</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-green-500"></span>
                                            Live Analysis
                                        </p>
                                    </div>
                                    <h2 className="text-4xl font-black tracking-tighter mb-3 leading-tight">
                                        Health <span className="text-blue-500">Summary</span>
                                    </h2>
                                    <p className="text-slate-400 font-medium text-base leading-relaxed">
                                        Your overall wellness score is looking exceptional today. We've analyzed your recent activity and hydration levels.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 sm:flex gap-4">
                                    <div className="flex-1 sm:w-40 p-6 bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 hover:border-white/20 transition-all duration-500 group/stat">
                                        <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover/stat:scale-110 transition-transform">
                                            <HeartPulseIcon className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Wellness</p>
                                        <div className="flex items-baseline gap-1">
                                            <p className="text-3xl font-black text-white">84</p>
                                            <p className="text-sm font-bold text-blue-400">%</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 sm:w-40 p-6 bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 hover:border-white/20 transition-all duration-500 group/stat">
                                        <div className="w-10 h-10 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover/stat:scale-110 transition-transform">
                                            <SparklesIcon className="w-5 h-5 text-teal-400" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Efficiency</p>
                                        <div className="flex items-baseline gap-1">
                                            <p className="text-3xl font-black text-white">92</p>
                                            <p className="text-sm font-bold text-teal-400">%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="md:col-span-1" delay={0.3}>
                                <WaterLogWidget onNavigate={onWaterLog} />
                            </Card>
                            <Card className="md:col-span-1" delay={0.4}>
                                <ActivityChart />
                            </Card>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="md:col-span-1" delay={0.5}>
                                <LogisticsWidget />
                            </Card>
                            <Card className="md:col-span-1" delay={0.6}>
                                <PartnersWidget onNavigate={onNavigateToPartners} />
                            </Card>
                        </div>
                    </div>

                    {/* Right Column: Quick Actions */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Quick Actions</h3>
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100">
                                <SparklesIcon className="w-4 h-4 text-indigo-500" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {actions.map((action, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: 0.5 + (index * 0.1) }}
                                >
                                    <QuickActionCard {...action} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
