import React, { useState, useEffect } from 'react';
import type { Partner, Branch, User, PartnerAnalytics as AnalyticsType, Delivery } from '../types';
import { PlusIcon, TrashIcon, BuildingOfficeIcon as BuildingIcon, MapPinIcon, PhoneIcon, DirectionsIcon, DocumentChartBarIcon, TruckIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';
import { MedicineRouteAnalysis } from './MedicineRouteAnalysis';
import { PartnerAnalytics } from './PartnerAnalytics';
import { DeliveryTracking } from './DeliveryTracking';

interface PartnersPageProps {
    user: User;
    onBack: () => void;
    isAdmin: boolean;
}

const PARTNERS_STORAGE_KEY = 'artha_partners';
const BRANCHES_STORAGE_KEY = 'artha_branches';

export const PartnersPage: React.FC<PartnersPageProps> = ({ user, onBack, isAdmin }) => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [branches, setBranches] = useState<{ [partnerId: string]: Branch[] }>({});
    const [isAddingPartner, setIsAddingPartner] = useState(false);
    const [isAddingBranch, setIsAddingBranch] = useState<string | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [autoFetchRoute, setAutoFetchRoute] = useState(false);
    const [selectedPartnerForAnalytics, setSelectedPartnerForAnalytics] = useState<Partner | null>(null);
    const [selectedBranchForAnalytics, setSelectedBranchForAnalytics] = useState<Branch | null>(null);
    const [selectedBranchForTracking, setSelectedBranchForTracking] = useState<Branch | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState<{ type: 'partner' | 'branch', partnerId: string, branchId?: string } | null>(null);

    const [newPartner, setNewPartner] = useState({ name: '', description: '', logoUrl: '' });
    const [newBranch, setNewBranch] = useState({ name: '', location: '', contact: '' });

    useEffect(() => {
        const loadData = () => {
            try {
                const storedPartners = localStorage.getItem(PARTNERS_STORAGE_KEY);
                const partnersData = storedPartners ? JSON.parse(storedPartners) : [];
                setPartners(partnersData);

                const storedBranches = localStorage.getItem(BRANCHES_STORAGE_KEY);
                const branchesData = storedBranches ? JSON.parse(storedBranches) : {};
                setBranches(branchesData);
            } catch (error) {
                console.error("Error loading partners/branches from localStorage:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
        
        // Listen for storage changes in other tabs/components
        window.addEventListener('storage', loadData);
        return () => window.removeEventListener('storage', loadData);
    }, []);

    const savePartners = (newPartners: Partner[]) => {
        localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(newPartners));
        setPartners(newPartners);
        // Trigger storage event for same-window listeners
        window.dispatchEvent(new Event('storage'));
    };

    const saveBranches = (newBranches: { [partnerId: string]: Branch[] }) => {
        localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(newBranches));
        setBranches(newBranches);
        window.dispatchEvent(new Event('storage'));
    };

    const handleAddPartner = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPartner.name) return;

        const partner: Partner = {
            id: Date.now().toString(),
            ...newPartner,
            createdAt: new Date().toISOString()
        };

        const updatedPartners = [partner, ...partners];
        savePartners(updatedPartners);
        setNewPartner({ name: '', description: '', logoUrl: '' });
        setIsAddingPartner(false);
    };

    const handleAddBranch = (e: React.FormEvent, partnerId: string) => {
        e.preventDefault();
        if (!newBranch.name || !newBranch.location) return;

        const branch: Branch = {
            id: Date.now().toString(),
            ...newBranch,
            partnerId,
            createdAt: new Date().toISOString()
        };

        const partnerBranches = branches[partnerId] || [];
        const updatedBranches = {
            ...branches,
            [partnerId]: [branch, ...partnerBranches]
        };
        saveBranches(updatedBranches);
        setNewBranch({ name: '', location: '', contact: '' });
        setIsAddingBranch(null);
    };

    const handleDeletePartner = (id: string) => {
        const updatedPartners = partners.filter(p => p.id !== id);
        savePartners(updatedPartners);

        const updatedBranches = { ...branches };
        delete updatedBranches[id];
        saveBranches(updatedBranches);
        
        setConfirmDelete(null);
    };

    const handleDeleteBranch = (partnerId: string, branchId: string) => {
        const partnerBranches = branches[partnerId] || [];
        const updatedPartnerBranches = partnerBranches.filter(b => b.id !== branchId);
        const updatedBranches = {
            ...branches,
            [partnerId]: updatedPartnerBranches
        };
        saveBranches(updatedBranches);
        setConfirmDelete(null);
    };

    const generateMockAnalytics = (): AnalyticsType => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonthIdx = new Date().getMonth();
        const monthlyData = months.slice(0, currentMonthIdx + 1).map(month => ({
            month,
            orders: Math.floor(Math.random() * 150) + 50,
            revenue: Math.floor(Math.random() * 5000) + 1000
        }));
        
        return {
            totalOrders: monthlyData.reduce((sum, d) => sum + d.orders, 0),
            monthlyData
        };
    };

    const generateMockDeliveries = (branchId: string): Delivery[] => {
        const statuses: Delivery['status'][] = ['pending', 'in-transit', 'delayed', 'delivered'];
        const items = ['Paracetamol 500mg', 'Amoxicillin 250mg', 'Insulin Glargine', 'Metformin 850mg', 'Atorvastatin 20mg', 'Lisinopril 10mg'];
        
        return Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, i) => {
            const distance = Math.floor(Math.random() * 50) + 10;
            const duration = Math.floor(distance * 1.5) + 5;
            return {
                id: `DEL-${Math.floor(Math.random() * 100000)}`,
                branchId,
                items: Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map(() => items[Math.floor(Math.random() * items.length)]),
                status: statuses[Math.floor(Math.random() * statuses.length)],
                estimatedArrival: `${Math.floor(duration / 60)}h ${duration % 60}m`,
                currentLocation: Math.random() > 0.3 ? 'Main Highway, Sector 4' : undefined,
                lastUpdated: '15 mins ago',
                from: 'Central Medical Warehouse, Delhi',
                to: 'Apollo Hospital, Sector 15',
                distance,
                duration,
                route: {
                    id: 'R-1',
                    name: 'Express Route A',
                    time: `${duration} mins`,
                    trafficCondition: 'Moderate',
                    weatherCondition: 'Clear',
                    alertStatus: 'green',
                    description: 'Fastest route via bypass',
                    isBest: true,
                    distance,
                    duration
                }
            };
        });
    };

    const handleViewAnalytics = (entity: Partner | Branch) => {
        if (!entity.analytics) {
            entity.analytics = generateMockAnalytics();
        }
        
        if ('partnerId' in entity) {
            setSelectedBranchForAnalytics(entity as Branch);
        } else {
            setSelectedPartnerForAnalytics(entity as Partner);
        }
    };

    const handleTrackDeliveries = (branch: Branch) => {
        if (!branch.activeDeliveries) {
            branch.activeDeliveries = generateMockDeliveries(branch.id);
        }
        setSelectedBranchForTracking(branch);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Hospital Partners</h1>
                    <p className="text-slate-500">Manage and analyze delivery routes for our partner hospitals.</p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => setIsAddingPartner(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add Partner
                    </button>
                )}
            </div>

            {isAddingPartner && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4">
                    <h2 className="text-xl font-bold text-slate-800">New Partner Hospital</h2>
                    <form onSubmit={handleAddPartner} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                            type="text" 
                            placeholder="Hospital Name" 
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            value={newPartner.name}
                            onChange={e => setNewPartner({...newPartner, name: e.target.value})}
                            required
                        />
                        <input 
                            type="text" 
                            placeholder="Logo URL (optional)" 
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            value={newPartner.logoUrl}
                            onChange={e => setNewPartner({...newPartner, logoUrl: e.target.value})}
                        />
                        <textarea 
                            placeholder="Description" 
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                            value={newPartner.description}
                            onChange={e => setNewPartner({...newPartner, description: e.target.value})}
                        />
                        <div className="flex gap-2 md:col-span-2">
                            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Save Partner</button>
                            <button type="button" onClick={() => setIsAddingPartner(false)} className="bg-slate-100 text-slate-600 px-6 py-2 rounded-xl font-bold">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {partners.length === 0 && !isAddingPartner && (
                    <div className="lg:col-span-2 bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-4">
                        <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                            <BuildingIcon className="w-10 h-10" />
                        </div>
                        <div className="max-w-md mx-auto">
                            <h3 className="text-xl font-bold text-slate-800">No Hospital Partners Yet</h3>
                            <p className="text-slate-500 mt-2">
                                {isAdmin 
                                    ? "As an administrator, you can start by adding your first hospital partner and then adding its branches."
                                    : "There are currently no hospital partners registered in the system. Please check back later or contact support."}
                            </p>
                            {isAdmin && (
                                <button 
                                    onClick={() => setIsAddingPartner(true)}
                                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-blue-100"
                                >
                                    Add Your First Partner
                                </button>
                            )}
                        </div>
                    </div>
                )}
                {(partners || []).map(partner => (
                    <div key={partner.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div 
                            className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start cursor-pointer hover:bg-slate-100/50 transition-colors"
                            onClick={() => handleViewAnalytics(partner)}
                        >
                            <div className="flex items-center gap-4">
                                {partner.logoUrl ? (
                                    <img src={partner.logoUrl} alt={partner.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                        <BuildingIcon className="w-6 h-6" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{partner.name}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-1">{partner.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <button 
                                    onClick={() => handleViewAnalytics(partner)}
                                    className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                    title="View Partner Analytics"
                                >
                                    <DocumentChartBarIcon className="w-5 h-5" />
                                </button>
                                {isAdmin && (
                                    <button onClick={() => setConfirmDelete({ type: 'partner', partnerId: partner.id })} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-6 flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Branches</h4>
                                {isAdmin && (
                                    <button 
                                        onClick={() => setIsAddingBranch(partner.id)}
                                        className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Add Branch
                                    </button>
                                )}
                            </div>

                            {isAddingBranch === partner.id && (
                                <form onSubmit={e => handleAddBranch(e, partner.id)} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                    <input 
                                        type="text" 
                                        placeholder="Branch Name" 
                                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newBranch.name}
                                        onChange={e => setNewBranch({...newBranch, name: e.target.value})}
                                        required
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Location (Address)" 
                                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newBranch.location}
                                        onChange={e => setNewBranch({...newBranch, location: e.target.value})}
                                        required
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Contact Info" 
                                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newBranch.contact}
                                        onChange={e => setNewBranch({...newBranch, contact: e.target.value})}
                                    />
                                    <div className="flex gap-2">
                                        <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Save</button>
                                        <button type="button" onClick={() => setIsAddingBranch(null)} className="bg-white text-slate-600 px-4 py-1.5 rounded-lg text-xs font-bold border border-slate-200">Cancel</button>
                                    </div>
                                </form>
                            )}

                            <div className="space-y-3">
                                {(branches[partner.id] || []).length ? (
                                    (branches[partner.id] || []).map(branch => (
                                        <div key={branch.id} className="group bg-white p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start">
                                                <div 
                                                    className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity flex-1"
                                                    onClick={() => handleViewAnalytics(branch)}
                                                >
                                                    <h5 className="font-bold text-slate-700">{branch.name}</h5>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <MapPinIcon className="w-3 h-3" />
                                                        {branch.location}
                                                    </div>
                                                    {branch.contact && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <PhoneIcon className="w-3 h-3" />
                                                            {branch.contact}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => handleTrackDeliveries(branch)}
                                                        className="text-slate-400 hover:text-emerald-600 p-2 rounded-lg transition-all"
                                                        title="Track Active Deliveries"
                                                    >
                                                        <TruckIcon className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleViewAnalytics(branch)}
                                                        className="text-slate-400 hover:text-blue-600 p-2 rounded-lg transition-all"
                                                        title="View Branch Analytics"
                                                    >
                                                        <DocumentChartBarIcon className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedBranch(branch);
                                                            setAutoFetchRoute(true);
                                                        }}
                                                        className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                                                        title="Analyze Delivery Route"
                                                    >
                                                        <DirectionsIcon className="w-4 h-4" />
                                                    </button>
                                                    {isAdmin && (
                                                        <button 
                                                            onClick={() => setConfirmDelete({ type: 'branch', partnerId: partner.id, branchId: branch.id })}
                                                            className="text-rose-400 hover:text-rose-600 p-2"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center py-4 text-slate-400 text-sm italic">No branches added yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedBranch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Delivery Route Analysis</h3>
                                <p className="text-sm text-slate-500">To: {selectedBranch.name} ({selectedBranch.location})</p>
                            </div>
                            <button onClick={() => {
                                setSelectedBranch(null);
                                setAutoFetchRoute(false);
                            }} className="text-slate-400 hover:text-slate-600 p-2">
                                <PlusIcon className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <MedicineRouteAnalysis defaultTo={selectedBranch.location} autoFetch={autoFetchRoute} />
                        </div>
                    </div>
                </div>
            )}

            {selectedPartnerForAnalytics && (
                <PartnerAnalytics 
                    name={selectedPartnerForAnalytics.name}
                    analytics={selectedPartnerForAnalytics.analytics!}
                    onClose={() => setSelectedPartnerForAnalytics(null)}
                />
            )}

            {selectedBranchForAnalytics && (
                <PartnerAnalytics 
                    name={selectedBranchForAnalytics.name}
                    analytics={selectedBranchForAnalytics.analytics!}
                    onClose={() => setSelectedBranchForAnalytics(null)}
                />
            )}

            {selectedBranchForTracking && (
                <DeliveryTracking 
                    branchName={selectedBranchForTracking.name}
                    deliveries={selectedBranchForTracking.activeDeliveries!}
                    onClose={() => setSelectedBranchForTracking(null)}
                    onViewRoute={() => {
                        setSelectedBranch(selectedBranchForTracking);
                        setAutoFetchRoute(true);
                        setSelectedBranchForTracking(null);
                    }}
                />
            )}

            {confirmDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 space-y-6 animate-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                            <TrashIcon className="w-8 h-8" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-slate-800">Confirm Deletion</h3>
                            <p className="text-slate-500 text-sm">
                                {confirmDelete.type === 'partner' 
                                    ? "Are you sure you want to delete this partner and all its branches? This action cannot be undone."
                                    : "Are you sure you want to delete this branch? This action cannot be undone."}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => confirmDelete.type === 'partner' 
                                    ? handleDeletePartner(confirmDelete.partnerId) 
                                    : handleDeleteBranch(confirmDelete.partnerId, confirmDelete.branchId!)}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                Delete
                            </button>
                            <button 
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
