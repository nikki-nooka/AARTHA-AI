
import React, { useState, useEffect } from 'react';
import type { User, ActivityLogItem } from '../types';
import { LockClosedIcon, ListBulletIcon, ScanIcon, ClipboardListIcon, BrainCircuitIcon, StethoscopeIcon, UserGroupIcon, DocumentChartBarIcon, ShieldCheckIcon, UsersIcon, ActivityIcon as ActivityChartIcon, ArrowTrendingUpIcon, GlobeAltIcon, ClockIcon } from './icons';
import { BackButton } from './BackButton';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../src/lib/supabase';

const USERS_KEY = 'artha_users';
const GLOBAL_ACTIVITY_HISTORY_KEY = 'artha_global_activity_history';

const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return dateString;
    }
};

const ActivityIcon: React.FC<{ type: ActivityLogItem['type'] }> = ({ type }) => {
    switch (type) {
        case 'image-analysis': return <ScanIcon className="w-5 h-5 text-blue-500" />;
        case 'prescription-analysis': return <ClipboardListIcon className="w-5 h-5 text-green-500" />;
        case 'mental-health': return <BrainCircuitIcon className="w-5 h-5 text-indigo-500" />;
        case 'symptom-checker': return <StethoscopeIcon className="w-5 h-5 text-teal-500" />;
        case 'login': return <LockClosedIcon className="w-5 h-5 text-slate-500" />;
        default: return <ListBulletIcon className="w-5 h-5 text-slate-500" />;
    }
};

interface AdminDashboardPageProps {
  onBack: () => void;
  onSyncUser?: (user: User) => Promise<void>;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onBack, onSyncUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [activities, setActivities] = useState<ActivityLogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Fetch users from Supabase
            const { data: supabaseUsers, error: usersError } = await supabase
                .from('users')
                .select('*');
            
            if (usersError) {
                console.warn("Supabase users fetch error:", usersError.message);
                throw usersError;
            }

            // Fetch activities from Supabase
            const { data: supabaseActivities, error: activitiesError } = await supabase
                .from('activity_history')
                .select('*');
            
            if (activitiesError) {
                console.warn("Supabase activities fetch error:", activitiesError.message);
                throw activitiesError;
            }

            setUsers((supabaseUsers || []).map((u: any) => ({
                ...u,
                isAdmin: u.is_admin || false
            })));
            
            setActivities((supabaseActivities || []).map((a: any) => ({
                id: a.id,
                userPhone: a.user_phone,
                type: a.type,
                title: a.title,
                data: a.data,
                timestamp: a.timestamp ? new Date(a.timestamp).getTime() : Date.now()
            })));
        } catch (e) {
            console.error("Failed to load admin data from Supabase", e);
            // Fallback to local storage if Supabase fails
            const storedUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
            const storedActivities = JSON.parse(localStorage.getItem(GLOBAL_ACTIVITY_HISTORY_KEY) || '[]');
            setUsers(Array.isArray(storedUsers) ? storedUsers : []);
            setActivities(Array.isArray(storedActivities) ? storedActivities : []);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSyncAll = async () => {
        if (!supabase.supabaseUrl || !supabase.supabaseKey || supabase.supabaseUrl === '' || supabase.supabaseKey === '') {
            setSyncStatus("Error: Supabase URL or Key is missing. Check settings.");
            return;
        }

        setIsSyncing(true);
        setSyncStatus("Starting sync...");
        try {
            const storedUsers: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
            let successCount = 0;
            let failCount = 0;

            const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 8000): Promise<T> => {
                return Promise.race([
                    promise,
                    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeoutMs))
                ]);
            };

            for (const user of storedUsers) {
                try {
                    setSyncStatus(`Syncing user: ${user.name || user.phone}...`);
                    const { error } = await withTimeout(supabase
                        .from('users')
                        .upsert({
                            phone: user.phone,
                            name: user.name,
                            email: user.email,
                            password: user.password,
                            date_of_birth: user.date_of_birth,
                            gender: user.gender,
                            place: user.place,
                            is_admin: user.isAdmin,
                            last_login_at: user.last_login_at || new Date().toISOString()
                        }, { onConflict: 'phone' }));
                    
                    if (error) {
                        console.error(`Failed to sync user ${user.phone}:`, error.message);
                        if (error.message.includes("Invalid API key") || error.message.includes("JWT")) {
                            setSyncStatus("Error: Invalid Supabase API Key. Check settings.");
                            setIsSyncing(false);
                            return; // Stop sync if key is invalid
                        }
                        failCount++;
                    } else {
                        successCount++;
                    }
                } catch (err: any) {
                    console.error(`Exception syncing user ${user.phone}:`, err);
                    if (err.message && (err.message.includes("Invalid API key") || err.message.includes("timeout") || err.message.includes("JWT"))) {
                        setSyncStatus(`Error: ${err.message}`);
                        setIsSyncing(false);
                        return;
                    }
                    failCount++;
                }
            }

            setSyncStatus(`Sync complete: ${successCount} success, ${failCount} failed.`);
            await loadData(); // Refresh list
        } catch (e: any) {
            console.error("Sync all failed:", e);
            setSyncStatus(`Sync failed: ${e.message || "Unknown error"}`);
        } finally {
            setIsSyncing(false);
            setTimeout(() => setSyncStatus(null), 5000);
        }
    };

    const nonAdminUsers = (users || []).filter(u => !u.isAdmin);

    return (
        <div className="relative w-full min-h-screen overflow-y-auto bg-[#f8fafc] selection:bg-indigo-100">
            {/* Decorative Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/40 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/40 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto p-6 sm:p-8 lg:p-12">
                <header className="mb-12">
                    <div className="mb-8">
                        <BackButton onClick={onBack} />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                                    <ShieldCheckIcon className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">System Administrator</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                                Admin Dashboard
                                <span className="text-indigo-500">.</span>
                            </h1>
                            <p className="text-lg font-medium text-slate-500 mt-2">Global Application Activity & User Management</p>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="flex flex-wrap gap-4 items-center"
                        >
                            <button 
                                onClick={handleSyncAll}
                                disabled={isSyncing}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                                    isSyncing 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-sm'
                                }`}
                            >
                                <ArrowTrendingUpIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? 'Syncing...' : 'Sync All to Supabase'}
                            </button>

                            {syncStatus && (
                                <span className="text-xs font-medium text-indigo-500 animate-pulse">{syncStatus}</span>
                            )}

                            <div className="px-6 py-4 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-w-[120px]">
                                <span className="text-2xl font-black text-slate-900">{users.length}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Users</span>
                            </div>
                            <div className="px-6 py-4 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-w-[120px]">
                                <span className="text-2xl font-black text-slate-900">{activities.length}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Events</span>
                            </div>
                        </motion.div>
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Stats Overview */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 hover:shadow-xl hover:border-blue-100 transition-all duration-500 group">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-500">
                                <GlobeAltIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">System Reach</p>
                                <p className="text-3xl font-black text-slate-900">Global</p>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 hover:shadow-xl hover:border-emerald-100 transition-all duration-500 group">
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-500">
                                <ArrowTrendingUpIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Growth Rate</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-black text-slate-900">+12.5</p>
                                    <p className="text-sm font-bold text-emerald-500">%</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 hover:shadow-xl hover:border-amber-100 transition-all duration-500 group">
                            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform duration-500">
                                <ClockIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Avg. Response</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-black text-slate-900">1.2</p>
                                    <p className="text-sm font-bold text-amber-500">sec</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* User Management Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="lg:col-span-8 space-y-8"
                    >
                        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-sm border border-white/40 overflow-hidden">
                            <div className="flex items-center justify-between mb-10">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                   <div className="p-2.5 bg-indigo-50 rounded-2xl">
                                       <UsersIcon className="w-7 h-7 text-indigo-600" />
                                   </div>
                                   User Directory
                                </h2>
                                <div className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100">
                                    {nonAdminUsers.length} Active Node{nonAdminUsers.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                            
                            <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-slate-50/30">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th scope="col" className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User Identity</th>
                                            <th scope="col" className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registration</th>
                                            <th scope="col" className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Active</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {isLoading ? (
                                            Array(3).fill(0).map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td className="px-8 py-8"><div className="h-4 bg-slate-100 rounded-full w-3/4"></div></td>
                                                    <td className="px-8 py-8"><div className="h-4 bg-slate-100 rounded-full w-1/2"></div></td>
                                                    <td className="px-8 py-8"><div className="h-4 bg-slate-100 rounded-full w-1/2"></div></td>
                                                </tr>
                                            ))
                                        ) : nonAdminUsers.length > 0 ? (
                                            nonAdminUsers.map(user => (
                                                <tr key={user.phone} className="hover:bg-white transition-all duration-300 group">
                                                    <td className="px-8 py-6 whitespace-nowrap">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-base group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                                                                {user.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{user.name}</div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{user.email || user.phone}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 whitespace-nowrap text-xs font-bold text-slate-500">{formatDateTime(user.created_at)}</td>
                                                    <td className="px-8 py-6 whitespace-nowrap text-xs font-bold text-slate-500">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                            {formatDateTime(user.last_login_at)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center">
                                                            <UsersIcon className="w-8 h-8 text-slate-200" />
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-400 italic">No users found in the system.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>

                    {/* Activity Feed Section */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="lg:col-span-4"
                    >
                        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-sm border border-white/40 h-full flex flex-col">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-10 flex items-center gap-4">
                               <div className="p-2.5 bg-indigo-50 rounded-2xl">
                                   <ActivityChartIcon className="w-7 h-7 text-indigo-600" />
                               </div>
                               Live Events
                            </h2>
                            <div className="flex-grow overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <div key={i} className="flex gap-4 p-5 bg-slate-50 rounded-3xl animate-pulse">
                                            <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
                                            <div className="flex-1 space-y-3">
                                                <div className="h-4 bg-slate-200 rounded-full w-3/4"></div>
                                                <div className="h-3 bg-slate-200 rounded-full w-1/2"></div>
                                            </div>
                                        </div>
                                    ))
                                ) : activities.length > 0 ? (
                                    <AnimatePresence>
                                        {activities.map((item, index) => (
                                             <motion.div 
                                                key={item.id} 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex items-start gap-5 p-5 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all duration-500 group"
                                            >
                                                 <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-500">
                                                    <ActivityIcon type={item.type} />
                                                 </div>
                                                 <div className="flex-grow min-w-0">
                                                    <p className="font-black text-sm text-slate-900 truncate leading-tight group-hover:text-indigo-600 transition-colors">{item.title}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mt-1.5">
                                                        By {item.userPhone}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
                                                        <p className="text-[10px] font-bold text-slate-400">
                                                            {formatDateTime(item.timestamp)}
                                                        </p>
                                                    </div>
                                                 </div>
                                             </motion.div>
                                        ))}
                                    </AnimatePresence>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6">
                                            <ActivityChartIcon className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 italic">No activity recorded yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

