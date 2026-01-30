"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shield, ShieldAlert, Activity, FileText, Settings, Trash2, Copy, Check } from "lucide-react";
import { DefenseModeModal } from "@/components/applications/DefenseModeModal";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Application {
    _id: string;
    name: string;
    defenseMode?: "Defense" | "Audited" | "Offline";
    defenseStatus: boolean;
    loggingEnabled: boolean;
    aiModel?: string;
    aiSystemPrompt?: string;
    policyHistory?: any[];
    token?: string;
}

export default function ApplicationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [app, setApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDefenseModalOpen, setIsDefenseModalOpen] = useState(false);

    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'LOGS' | 'SETTINGS'>('DASHBOARD');
    const [tokenCopied, setTokenCopied] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchApp(params.id as string);
        }
    }, [params.id]);

    const fetchApp = async (id: string) => {
        try {
            const res = await fetch(`/api/applications?id=${id}`);
            const data = await res.json();
            if (data.data) {
                // If the API returns a list (which strictly it shouldn't if id is passed but current API structure is loose), find it.
                // If it returns a single object, use it.
                if (Array.isArray(data.data)) {
                    const found = data.data.find((a: any) => a._id === id || a.id === id);
                    setApp(found);
                } else {
                    setApp(data.data);
                }
            } else if (Array.isArray(data)) {
                const found = data.find((a: any) => a._id === id || a.id === id);
                setApp(found);
            }
        } catch (e) {
            console.error("Failed to fetch app", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDefenseModeSave = async (mode: "Defense" | "Audited" | "Offline") => {
        if (!app) return;
        try {
            const res = await fetch('/api/applications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: app._id, defenseMode: mode })
            });
            if (res.ok) {
                fetchApp(app._id);
                setIsDefenseModalOpen(false);
            }
        } catch (e) {
            alert("Failed to update defense mode");
        }
    };

    const handleDelete = async () => {
        if (!app || !confirm("Are you sure you want to delete this application? This action cannot be undone.")) return;
        try {
            const res = await fetch(`/api/applications?id=${app._id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                router.push('/applications');
            } else {
                alert("Failed to delete application");
            }
        } catch (e) {
            console.error(e);
            alert("Error deleting application");
        }
    };

    const copyToken = () => {
        if (app?.token) {
            navigator.clipboard.writeText(app.token);
            setTokenCopied(true);
            setTimeout(() => setTokenCopied(false), 2000);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Loading Application...</div>;
    if (!app) return <div className="p-10 text-center text-red-500">Application not found</div>;

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <Link href="/applications" className="hover:text-teal-500 transition-colors">Applications</Link>
                <span>/</span>
                <span className="text-slate-900">Detail</span>
            </div>

            {/* Header Card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{app.name}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">TOKEN</span>
                                <div className="flex items-center bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200 group hover:border-teal-200 transition-colors">
                                    <code className="text-sm font-mono text-slate-600">{app.token || 'Generating...'}</code>
                                    <button
                                        onClick={copyToken}
                                        className="ml-3 text-slate-400 hover:text-teal-600 transition-colors"
                                        title="Copy Token"
                                    >
                                        {tokenCopied ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsDefenseModalOpen(true)}
                            className={cn(
                                "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-all shadow-sm hover:shadow",
                                app.defenseMode === 'Audited' ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100" :
                                    app.defenseMode === 'Offline' ? "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200" :
                                        "bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100"
                            )}>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full animate-pulse",
                                    app.defenseMode === 'Audited' ? "bg-amber-500" :
                                        app.defenseMode === 'Offline' ? "bg-slate-400" : "bg-teal-500"
                                )} />
                                {app.defenseMode || 'DEFENSE'} MODE
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-1 border-b border-slate-200">
                {['DASHBOARD', 'LOGS', 'SETTINGS'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={cn(
                            "px-6 py-3 text-sm font-bold transition-all uppercase border-t border-x rounded-t-lg mb-[-1px] relative",
                            activeTab === tab
                                ? "bg-white border-slate-200 border-b-white text-teal-600"
                                : "bg-slate-50 border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">

                {/* DASHBOARD TAB */}
                {activeTab === 'DASHBOARD' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Stat Card 1 */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Activity className="w-5 h-5 text-blue-500" />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase">24H</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900 mb-1">0</div>
                            <div className="text-xs font-medium text-slate-500">Total Requests</div>
                        </div>

                        {/* Stat Card 2 */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-red-50 rounded-lg">
                                    <ShieldAlert className="w-5 h-5 text-red-500" />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase">24H</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900 mb-1">0</div>
                            <div className="text-xs font-medium text-slate-500">Threats Blocked</div>
                        </div>

                        {/* Stat Card 3 */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-teal-50 rounded-lg">
                                    <Shield className="w-5 h-5 text-teal-500" />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Current</span>
                            </div>
                            <div className="text-lg font-bold text-teal-600 mb-1">Protected</div>
                            <div className="text-xs font-medium text-slate-500">System Status</div>
                        </div>

                        {/* Big Chart Area Placeholder */}
                        <div className="col-span-1 md:col-span-3 bg-white p-6 rounded-xl border border-slate-100 shadow-sm min-h-[300px] flex items-center justify-center text-slate-400 font-medium">
                            Traffic Analysis Chart Coming Soon
                        </div>
                    </div>
                )}

                {/* LOGS TAB */}
                {activeTab === 'LOGS' && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Recent Requests</h3>
                            <button className="text-xs font-bold text-teal-600 hover:underline">View All</button>
                        </div>
                        <div className="p-8 text-center text-slate-400 italic text-sm">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            No recent logs found for this application token.
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'SETTINGS' && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
                        <div className="p-6">
                            <h3 className="text-base font-bold text-slate-900 mb-1">General Settings</h3>
                            <p className="text-sm text-slate-500 mb-4">Manage basic application details.</p>

                            <div className="grid gap-4 max-w-lg">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Application Name</label>
                                    <input
                                        type="text"
                                        value={app.name}
                                        readOnly
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-red-50/30">
                            <h3 className="text-base font-bold text-red-600 mb-1">Danger Zone</h3>
                            <p className="text-sm text-slate-500 mb-4">Irreversible actions for this application.</p>

                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Application
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <DefenseModeModal
                isOpen={isDefenseModalOpen}
                onClose={() => setIsDefenseModalOpen(false)}
                currentMode={app.defenseMode || 'Defense'}
                onSave={handleDefenseModeSave}
            />
        </div>
    );
}
