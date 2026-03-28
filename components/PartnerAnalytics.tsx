import React from 'react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    LineChart, 
    Line,
    AreaChart,
    Area
} from 'recharts';
import { PartnerAnalytics as AnalyticsType } from '../types';
import { CloseIcon, ArrowTrendingUpIcon } from './icons';

interface PartnerAnalyticsProps {
    name: string;
    analytics: AnalyticsType;
    onClose: () => void;
}

const ShoppingBagIconLocal = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
);

export const PartnerAnalytics: React.FC<PartnerAnalyticsProps> = ({ name, analytics, onClose }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{name} Analytics</h2>
                        <p className="text-slate-500 text-sm">Performance and order analysis report</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <CloseIcon className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500 rounded-lg text-white">
                                    <ShoppingBagIconLocal className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">Total Orders</span>
                            </div>
                            <div className="text-3xl font-black text-blue-900">{analytics.totalOrders}</div>
                            <div className="text-xs text-blue-600 mt-1 font-medium flex items-center gap-1">
                                <ArrowTrendingUpIcon className="w-3 h-3" />
                                +12.5% from last month
                            </div>
                        </div>

                        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-500 rounded-lg text-white">
                                    <ArrowTrendingUpIcon className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Avg. Monthly</span>
                            </div>
                            <div className="text-3xl font-black text-emerald-900">
                                {Math.round(analytics.totalOrders / analytics.monthlyData.length)}
                            </div>
                            <div className="text-xs text-emerald-600 mt-1 font-medium">Consistent growth pattern</div>
                        </div>

                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-500 rounded-lg text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold text-amber-600 uppercase tracking-wider">Peak Month</span>
                            </div>
                            <div className="text-3xl font-black text-amber-900">
                                {[...analytics.monthlyData].sort((a, b) => b.orders - a.orders)[0].month}
                            </div>
                            <div className="text-xs text-amber-600 mt-1 font-medium">Highest activity recorded</div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="space-y-8">
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                                Order Volume Trends
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics.monthlyData}>
                                        <defs>
                                            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis 
                                            dataKey="month" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#fff', 
                                                borderRadius: '16px', 
                                                border: 'none', 
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                                            }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="orders" 
                                            stroke="#3b82f6" 
                                            strokeWidth={4}
                                            fillOpacity={1} 
                                            fill="url(#colorOrders)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                                    Monthly Comparison
                                </h3>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics.monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis 
                                                dataKey="month" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                            />
                                            <Tooltip 
                                                cursor={{ fill: '#f1f5f9' }}
                                                contentStyle={{ 
                                                    backgroundColor: '#fff', 
                                                    borderRadius: '12px', 
                                                    border: 'none', 
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                                                }}
                                            />
                                            <Bar 
                                                dataKey="orders" 
                                                fill="#10b981" 
                                                radius={[6, 6, 0, 0]} 
                                                barSize={30}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <div className="w-2 h-6 bg-amber-500 rounded-full"></div>
                                    Growth Analysis
                                </h3>
                                <div className="space-y-4">
                                    {analytics.monthlyData.slice(-4).map((data, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center font-bold text-slate-400">
                                                    {data.month.substring(0, 3)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-700">{data.month}</div>
                                                    <div className="text-xs text-slate-400">Monthly Performance</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-slate-800">{data.orders}</div>
                                                <div className="text-[10px] font-bold text-emerald-500 uppercase">Completed</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
