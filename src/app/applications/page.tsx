"use client";

import { useEffect, useState } from "react";
import { Search, Globe, Shield, Loader2, AlertCircle } from "lucide-react";
import { ApplicationCard } from "@/components/applications/ApplicationCard";
import { AddApplicationModal } from "@/components/applications/AddApplicationModal";

interface Application {
    _id: string;
    name: string;
    domain: string;
    ports: { protocol: string; port: string }[];
    type: string;
    defenseStatus: boolean;
    defenseMode?: string;
}

export default function ApplicationsPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    const [editingApp, setEditingApp] = useState<Application | null>(null);

    useEffect(() => {
        fetchApps();
    }, []);

    const fetchApps = async () => {
        try {
            const response = await fetch('/api/applications');
            if (response.ok) {
                const responseData = await response.json();
                setApps(responseData.data || responseData);
            }
        } catch (error) {
            console.error("Failed to fetch apps", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (app: Application) => {
        setEditingApp(app);
        setIsAddModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setEditingApp(null);
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/applications?id=${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                fetchApps(); // Refresh list
            } else {
                alert('Failed to delete application');
            }
        } catch (error) {
            console.error("Failed to delete app", error);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">
            {/* ... modal and header ... */}
            <AddApplicationModal
                isOpen={isAddModalOpen}
                onClose={handleCloseModal}
                initialData={editingApp}
            />
            {/* ... header controls ... */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <span className="text-slate-500 font-bold text-sm whitespace-nowrap">{apps.length} Applications</span>
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Application"
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="px-4 py-2 bg-white text-teal-500 border border-teal-200 hover:bg-teal-50 font-bold text-xs rounded-lg transition-colors uppercase tracking-wide">
                        Advanced
                    </button>
                    <button
                        onClick={() => {
                            setEditingApp(null);
                            setIsAddModalOpen(true);
                        }}
                        className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-lg transition-colors shadow-md shadow-teal-200 flex items-center gap-2 uppercase tracking-wide"
                    >
                        Add Application
                    </button>
                </div>
            </div>

            {/* Applications Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                </div>
            ) : apps.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                    {apps.map(app => (
                        <ApplicationCard
                            key={app._id}
                            app={{
                                id: app._id,
                                name: app.name,
                                domain: app.domain,
                                port: (app.ports || []).map(p => `${p.port}/${p.protocol}`).join(' '),
                                defenseStatus: app.defenseStatus,
                                defenseMode: (app as any).defenseMode, // Map defenseMode
                                rqs: 0,
                                blk: 0,
                                tags: ["Protection Active"],
                                icon: app.type === 'Reverse Proxy' ? Globe : Shield,
                                raw: app
                            }}
                            onEdit={() => handleEdit(app)}
                            onDelete={() => handleDelete(app._id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-slate-600">No Applications Found</h3>
                    <p className="text-sm">Add your first application to get started.</p>
                </div>
            )}
        </div>
    );
}
