import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Delivery, DeliveryStatus, Alert } from '../types';
import { getRealTimeAlertsByLocation } from '../services/geminiService';
import { useI18n } from './I18n';
import { 
    TruckIcon, 
    CheckCircleIcon, 
    ClockIcon, 
    AlertTriangleIcon, 
    MapPinIcon, 
    PackageIcon,
    ArrowRightIcon,
    CloseIcon,
    CloudIcon,
    NewspaperIcon
} from './icons';

interface DeliveryTrackingProps {
    branchName: string;
    deliveries: Delivery[];
    onClose: () => void;
    onViewRoute: () => void;
}

const statusConfig: Record<DeliveryStatus, { icon: any, color: string, label: string, bg: string }> = {
    'pending': { icon: ClockIcon, color: 'text-amber-500', label: 'Pending', bg: 'bg-amber-50' },
    'in-transit': { icon: TruckIcon, color: 'text-blue-500', label: 'In Transit', bg: 'bg-blue-50' },
    'delivered': { icon: CheckCircleIcon, color: 'text-emerald-500', label: 'Delivered', bg: 'bg-emerald-50' },
    'delayed': { icon: AlertTriangleIcon, color: 'text-rose-500', label: 'Delayed', bg: 'bg-rose-50' }
};

export const DeliveryTracking: React.FC<DeliveryTrackingProps> = ({ branchName, deliveries, onClose, onViewRoute }) => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
    const { language } = useI18n();

    useEffect(() => {
        const fetchAlerts = async () => {
            setIsLoadingAlerts(true);
            try {
                const result = await getRealTimeAlertsByLocation(branchName, language);
                setAlerts(result);
            } catch (error) {
                console.error("Failed to fetch alerts for branch:", error);
            } finally {
                setIsLoadingAlerts(false);
            }
        };

        if (branchName) {
            fetchAlerts();
        }
    }, [branchName, language]);

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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-scale-in">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                            <TruckIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Live Delivery Tracking</h2>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
                                </div>
                            </div>
                            <p className="text-slate-500 text-sm">Active shipments to <span className="font-bold text-blue-600">{branchName}</span></p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <CloseIcon className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                    {/* Real-time Alerts for the Area */}
                    {alerts.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <AlertTriangleIcon className="w-4 h-4 text-orange-500" />
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Real-time Alerts for {branchName}</h5>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {alerts.map((alert) => (
                                    <motion.div 
                                        key={alert.id} 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`p-3 rounded-xl border flex gap-3 items-start transition-all hover:shadow-sm ${getSeverityColor(alert.severity)}`}
                                    >
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
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {deliveries.length === 0 ? (
                        <div className="text-center py-20 space-y-4">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                <TruckIcon className="w-10 h-10" />
                            </div>
                            <p className="text-slate-500 font-medium">No active deliveries for this branch.</p>
                        </div>
                    ) : (
                        deliveries.map((delivery, idx) => {
                            const config = statusConfig[delivery.status];
                            const StatusIcon = config.icon;
                            
                            return (
                                <motion.div 
                                    key={delivery.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                                >
                                    <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 ${config.bg} ${config.color} rounded-xl`}>
                                                <StatusIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID: {delivery.id}</div>
                                                <div className={`text-sm font-black ${config.color}`}>{config.label}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Est. Arrival</div>
                                            <div className="text-sm font-black text-slate-800">{delivery.estimatedArrival}</div>
                                        </div>
                                    </div>

                                    <div className="p-5 space-y-6">
                                        {/* Progress Bar */}
                                        <div className="relative pt-2">
                                            <div className="flex mb-2 items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <MapPinIcon className="w-4 h-4 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-500">{delivery.from || 'Warehouse'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-blue-600">{delivery.to || branchName}</span>
                                                    <MapPinIcon className="w-4 h-4 text-blue-600" />
                                                </div>
                                            </div>
                                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-slate-100">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ 
                                                        width: delivery.status === 'delivered' ? '100%' : 
                                                               delivery.status === 'in-transit' ? '65%' : 
                                                               delivery.status === 'delayed' ? '45%' : '10%' 
                                                    }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                                                        delivery.status === 'delayed' ? 'bg-rose-500' : 'bg-blue-500'
                                                    }`}
                                                ></motion.div>
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <PackageIcon className="w-3.5 h-3.5" />
                                                    Shipment Items
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {delivery.items.map((item, i) => (
                                                        <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-slate-50">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                        <MapPinIcon className="w-3.5 h-3.5" />
                                                        Route Details
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 uppercase font-bold">From</p>
                                                            <p className="text-xs font-bold text-slate-700">{delivery.from || 'Warehouse'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 uppercase font-bold">To</p>
                                                            <p className="text-xs font-bold text-slate-700">{delivery.to || branchName}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <ClockIcon className="w-3.5 h-3.5" />
                                                    Last Update
                                                </h4>
                                                <div className="text-sm text-slate-600 font-medium">
                                                    {delivery.currentLocation ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-blue-600 font-bold">{delivery.currentLocation}</span>
                                                            <span className="text-slate-300">•</span>
                                                            <span>{delivery.lastUpdated}</span>
                                                        </div>
                                                    ) : (
                                                        <span>Processing at warehouse • {delivery.lastUpdated}</span>
                                                    )}
                                                </div>
                                                {(delivery.distance || delivery.duration) && (
                                                    <div className="flex items-center gap-4 mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                        {delivery.distance && (
                                                            <div>
                                                                <p className="text-[10px] text-slate-400 uppercase font-bold">Distance</p>
                                                                <p className="text-xs font-bold text-slate-700">{delivery.distance} km</p>
                                                            </div>
                                                        )}
                                                        {delivery.duration && (
                                                            <div>
                                                                <p className="text-[10px] text-slate-400 uppercase font-bold">Duration</p>
                                                                <p className="text-xs font-bold text-slate-700">{delivery.duration} mins</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Route Info if available */}
                                        {delivery.route && (
                                            <button 
                                                onClick={onViewRoute}
                                                className="w-full bg-blue-50/50 hover:bg-blue-100/70 transition-all rounded-xl p-4 border border-blue-100 flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-3 text-left">
                                                    <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                                        <TruckIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Optimized Route</div>
                                                        <div className="text-sm font-bold text-blue-800">{delivery.route.name}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right hidden sm:block">
                                                        <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Time / Distance</div>
                                                        <div className="text-sm font-bold text-blue-800">{delivery.route.time} ({delivery.route.distance} km)</div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:translate-x-1 transition-transform">
                                                        <ArrowRightIcon className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                        Real-time tracking powered by Artha Logistics Engine
                    </p>
                </div>
            </div>
        </div>
    );
};
