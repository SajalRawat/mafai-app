"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Globe, Shield, ArrowLeft, RefreshCcw, MoreHorizontal, Settings, FileText, Activity, Lock, Users, Zap, Terminal, ShieldAlert } from "lucide-react";
import { DefenseModeModal } from "@/components/applications/DefenseModeModal";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Application {
    _id: string;
    name: string;
    domain: string;
    ports: { protocol: string; port: string }[];
    upstreams: string[];
    type: string;
    defenseMode?: "Defense" | "Audited" | "Offline";
    defenseStatus: boolean;
    loggingEnabled: boolean;
    aiModel?: string;
    aiSystemPrompt?: string;
    policyHistory?: any[];
}

export default function ApplicationDetailPage() {
    const params = useParams();
    const [app, setApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDefenseModalOpen, setIsDefenseModalOpen] = useState(false);

    // New State for Policy Feature
    const [activeTab, setActiveTab] = useState<'BASIC' | 'RULES' | 'ADVANCED' | 'ROUTINGS' | 'AI_POLICY'>('BASIC');
    const [systemPrompt, setSystemPrompt] = useState("");
    const [isSavingPolicy, setIsSavingPolicy] = useState(false);

    useEffect(() => {
        if (params.id) {
            fetchApp(params.id as string);
        }
    }, [params.id]);

    const fetchApp = async (id: string) => {
        try {
            const res = await fetch(`/api/applications?id=${id}`); // Assuming API supports get by ID or filter
            // Note: Current API returns ALL apps on GET /. We might need to filter client side if API doesn't support ID param yet
            // Let's assume for now we might need to fetch all and find, or update API. 
            // Checking existing API... usually GET /api/applications returns list.
            // Let's generic fetch all and find for now to be safe without changing API yet.
            const data = await res.json();
            if (data.data) {
                const found = data.data.find((a: any) => a._id === id || a.id === id);
                setApp(found);
            } else if (Array.isArray(data)) {
                const found = data.find((a: any) => a._id === id || a.id === id);
                setApp(found);

                // Set initial system prompt if exists
                if (found.aiSystemPrompt) {
                    setSystemPrompt(found.aiSystemPrompt);
                } else {
                    setSystemPrompt("");
                }
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
                fetchApp(app._id); // Refresh local data
            }
        } catch (e) {
            alert("Failed to update");
        }
    };

    const handlePolicySave = async () => {
        if (!app) return;
        if (!systemPrompt.trim()) return alert("Please enter a system prompt");

        setIsSavingPolicy(true);
        try {
            const res = await fetch(`/api/applications/${app._id}/policy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt })
            });

            if (res.ok) {
                alert("Policy saved and model created successfully!");
                fetchApp(app._id); // Refresh to see new model and history
            } else {
                const err = await res.json();
                alert("Failed to save policy: " + (err.error || "Unknown error"));
            }
        } catch (e) {
            console.error(e);
            alert("Failed to save policy");
        } finally {
            setIsSavingPolicy(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!app) return <div className="p-10 text-center">Application not found</div>;

    const Icon = app.type === 'Reverse Proxy' ? Globe : Shield;

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <Link href="/applications" className="hover:text-teal-500 transition-colors">Applications</Link>
                <span>/</span>
                <span className="text-slate-900">Detail</span>
            </div>

            {/* Header Card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-teal-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900">{app.name}</h1>
                            <button className="text-slate-400 hover:text-teal-500 transition-colors">
                                <span className="sr-only">Edit</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                            </button>
                        </div>
                        <div className="text-slate-500 text-sm font-medium">{app.domain}</div>
                    </div>
                </div>

                <div className="flex items-center gap-12">
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={() => setIsDefenseModalOpen(true)}
                            className={cn(
                                "px-4 py-1.5 border rounded font-bold text-xs tracking-widest uppercase cursor-pointer transition-colors flex items-center gap-2",
                                (!app.defenseMode || app.defenseMode === 'Defense') ? "border-teal-500 text-teal-500 hover:bg-teal-50" :
                                    app.defenseMode === 'Audited' ? "border-amber-500 text-amber-500 hover:bg-amber-50" :
                                        "border-red-500 text-red-500 hover:bg-red-50"
                            )}
                        >
                            {app.defenseMode || 'DEFENSE'} MODE
                            <Settings className="w-3 h-3" />
                        </button>
                        <span className="text-[10px] font-medium text-teal-500">
                            {(!app.defenseMode || app.defenseMode === 'Defense') ? "Attacks will be blocked" :
                                app.defenseMode === 'Audited' ? "Log only strategy" : "All Blocking strategy"}
                        </span>
                    </div>

                    <div className="flex gap-8">
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">RQS TD</div>
                            <div className="text-sm font-black text-slate-900">18</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">BLK TD</div>
                            <div className="text-sm font-black text-slate-900">18</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('BASIC')}
                    className={cn(
                        "px-6 py-3 text-sm font-bold transition-colors uppercase border-t border-x rounded-t-lg mb-[-1px]",
                        activeTab === 'BASIC' ? "bg-white border-slate-200 border-b-white text-teal-500" : "bg-slate-50 border-transparent text-slate-500 hover:text-teal-500"
                    )}
                >
                    BASIC
                </button>
                <button
                    onClick={() => setActiveTab('RULES')}
                    className={cn(
                        "px-6 py-3 text-sm font-bold transition-colors uppercase border-t border-x rounded-t-lg mb-[-1px]",
                        activeTab === 'RULES' ? "bg-white border-slate-200 border-b-white text-teal-500" : "bg-slate-50 border-transparent text-slate-500 hover:text-teal-500"
                    )}
                >
                    FORWARDING RULES
                </button>
                <button
                    onClick={() => setActiveTab('ADVANCED')}
                    className={cn(
                        "px-6 py-3 text-sm font-bold transition-colors uppercase border-t border-x rounded-t-lg mb-[-1px] flex items-center gap-1",
                        activeTab === 'ADVANCED' ? "bg-white border-slate-200 border-b-white text-teal-500" : "bg-slate-50 border-transparent text-slate-500 hover:text-teal-500"
                    )}
                >
                    ADVANCED <Shield className="w-3 h-3" />
                </button>
                <button
                    onClick={() => setActiveTab('ROUTINGS')}
                    className={cn(
                        "px-6 py-3 text-sm font-bold transition-colors uppercase border-t border-x rounded-t-lg mb-[-1px]",
                        activeTab === 'ROUTINGS' ? "bg-white border-slate-200 border-b-white text-teal-500" : "bg-slate-50 border-transparent text-slate-500 hover:text-teal-500"
                    )}
                >
                    ROUTINGS
                </button>
                <button
                    onClick={() => setActiveTab('AI_POLICY')}
                    className={cn(
                        "px-6 py-3 text-sm font-bold transition-colors uppercase border-t border-x rounded-t-lg mb-[-1px] flex items-center gap-1 group",
                        activeTab === 'AI_POLICY' ? "bg-white border-slate-200 border-b-white text-teal-500" : "bg-slate-50 border-transparent text-slate-500 hover:text-teal-500"
                    )}
                >
                    AI POLICY <Terminal className="w-3 h-3 group-hover:text-teal-500 transition-colors" />
                </button>
            </div>

            {/* Basic Content */}
            {activeTab === 'BASIC' && (
                <div className="bg-white p-8 rounded-b-xl rounded-tr-xl border border-t-0 border-slate-100 shadow-sm space-y-10">
                    {/* ... Existing Basic Content ... */}
                    {/* Basic Info Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-slate-900">Basic</h2>
                            <button className="text-slate-400 hover:text-teal-500 transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-[200px_1fr] gap-y-6 text-sm">
                            <div className="text-slate-400 font-medium">Application</div>
                            <div className="text-slate-500">{app.domain}</div>

                            <div className="text-slate-400 font-medium">Port</div>
                            <div className="flex gap-2">
                                {(app.ports || []).map((p, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded text-xs font-bold font-mono">
                                        {p.port}/{p.protocol}
                                    </span>
                                ))}
                            </div>

                            <div className="text-slate-400 font-medium">Access method</div>
                            <div>
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold border border-slate-200">
                                    {app.type}
                                </span>
                            </div>

                            <div className="text-slate-400 font-medium">Upstream</div>
                            <div className="font-mono text-slate-600 bg-slate-50 px-3 py-1 rounded w-fit border border-slate-200">
                                {app.upstreams?.[0] || app.domain}
                            </div>

                            <div className="text-slate-400 font-medium">AI Model</div>
                            <div className="font-mono text-slate-600 bg-purple-50 px-3 py-1 rounded w-fit border border-purple-200 text-purple-700">
                                {app.aiModel || 'mistral'}
                            </div>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="space-y-6">
                        <h2 className="text-base font-bold text-slate-900">Security</h2>
                        <div className="flex flex-wrap gap-4">
                            <button className="flex items-center gap-3 px-4 py-2 bg-cyan-50 border border-cyan-200 rounded text-cyan-600 text-xs font-bold uppercase hover:bg-cyan-100 transition-colors min-w-[140px]">
                                <ShieldAlert className="w-3.5 h-3.5" /> ATTACKS
                            </button>
                        </div>
                    </div>

                    {/* Data Statistics */}
                    <div className="space-y-6">
                        <h2 className="text-base font-bold text-slate-900">Data Statistics</h2>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/statistics" className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs font-bold uppercase hover:bg-slate-100 transition-colors">
                                TRAFFIC ANALYSIS <Activity className="w-3.5 h-3.5 text-teal-500" />
                            </Link>
                            <button className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs font-bold uppercase hover:bg-slate-100 transition-colors">
                                SECURITY POSTURE <Shield className="w-3.5 h-3.5 text-teal-500" />
                            </button>
                        </div>
                    </div>

                    {/* Logs */}
                    <div className="space-y-6">
                        <h2 className="text-base font-bold text-slate-900">Logs</h2>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/allow-deny" className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs font-bold uppercase hover:bg-slate-100 transition-colors">
                                <FileText className="w-3.5 h-3.5" /> ACCESS LOG
                            </Link>
                            <Link href="/attacks" className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs font-bold uppercase hover:bg-slate-100 transition-colors">
                                <FileText className="w-3.5 h-3.5" /> ERROR LOG
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Policy Content */}
            {activeTab === 'AI_POLICY' && (
                <div className="bg-white p-8 rounded-b-xl rounded-tr-xl border border-t-0 border-slate-100 shadow-sm space-y-10">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Custom AI WAF Policy</h2>
                                <p className="text-sm text-slate-500 mt-1">Define specific instructions for the AI to analyze traffic for this application.</p>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">CURRENT MODEL</div>
                                <div className="text-sm font-mono font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded inline-block">
                                    {app.aiModel || 'mistral'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                                System Prompt
                            </label>
                            <textarea
                                className="w-full h-64 p-4 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
                                placeholder="You are a WAF optimized for e-commerce. Block any attempts to manipulate prices..."
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handlePolicySave}
                                    disabled={isSavingPolicy}
                                    className="px-6 py-2.5 bg-teal-500 text-white font-bold text-sm rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSavingPolicy ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                    SAVE & BUILD MODEL
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Policy History */}
                    <div className="space-y-6 pt-6 border-t border-slate-100">
                        <h3 className="text-base font-bold text-slate-900">Policy History</h3>
                        <div className="overflow-hidden rounded-lg border border-slate-200">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Model Name</th>
                                        <th className="px-4 py-3">Prompt Summary</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(app.policyHistory || []).map((policy: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                                {new Date(policy.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-purple-600">
                                                {policy.modelName}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 truncate max-w-[300px]">
                                                {policy.prompt}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!app.policyHistory || app.policyHistory.length === 0) && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">
                                                No custom policies created yet. Using default 'mistral'.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <DefenseModeModal
                isOpen={isDefenseModalOpen}
                onClose={() => setIsDefenseModalOpen(false)}
                currentMode={app.defenseMode || 'Defense'}
                onSave={handleDefenseModeSave}
            />
        </div>
    );
}
