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
    token: string;
    defenseMode: "DEFENSE" | "AUDITED" | "OFFLINE";
    aiModel?: string;
    createdAt: string;
}

export default function ApplicationDetailPage() {
    const params = useParams();
    const [app, setApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDefenseModalOpen, setIsDefenseModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'BASIC' | 'ADVANCED' | 'AI_POLICY'>('BASIC');
    const [systemPrompt, setSystemPrompt] = useState("");
    const [isSavingPolicy, setIsSavingPolicy] = useState(false);
    const [copied, setCopied] = useState(false);

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
                const found = data.data.find((a: any) => a._id === id || a.id === id);
                setApp(found);
            }
        } catch (e) {
            console.error("Failed to fetch app", e);
        } finally {
            setLoading(false);
        }
    };

    const copyToken = () => {
        if (!app?.token) return;
        navigator.clipboard.writeText(app.token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDefenseModeSave = async (mode: "DEFENSE" | "AUDITED" | "OFFLINE") => {
        if (!app) return;
        try {
            const res = await fetch('/api/applications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: app._id, defenseMode: mode })
            });
            if (res.ok) fetchApp(app._id);
        } catch (e) {
            alert("Failed to update");
        }
    };

    if (loading) return <div className="p-10 text-center font-mono text-slate-500">Initializing Security Context...</div>;
    if (!app) return <div className="p-10 text-center text-red-500 font-bold">APPLICATION NOT FOUND</div>;

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen space-y-6">
            <div className="flex items-center gap-2 text-sm text-slate-500 font-bold uppercase tracking-wider">
                <Link href="/applications" className="hover:text-teal-500 transition-colors">Applications</Link>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-slate-900">{app.name}</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-200">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            {app.name}
                            <div className={cn("w-2 h-2 rounded-full", app.defenseMode === 'OFFLINE' ? "bg-red-500" : "bg-emerald-500 animate-pulse")} />
                        </h1>
                        <div className="flex items-center gap-3 mt-1.5">
                            <code className="text-[11px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                {app.token}
                            </code>
                            <button
                                onClick={copyToken}
                                className="text-[10px] font-bold text-teal-500 hover:text-teal-600 uppercase tracking-widest transition-colors"
                            >
                                {copied ? "COPIED" : "COPY TOKEN"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <button
                        onClick={() => setIsDefenseModalOpen(true)}
                        className={cn(
                            "px-6 py-2.5 rounded-lg font-black text-xs tracking-widest uppercase transition-all flex items-center gap-3 shadow-sm border",
                            app.defenseMode === 'DEFENSE' ? "bg-teal-500 border-teal-500 text-white hover:bg-teal-600" :
                                app.defenseMode === 'AUDITED' ? "bg-amber-500 border-amber-500 text-white hover:bg-amber-600" :
                                    "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
                        )}
                    >
                        {app.defenseMode} MODE
                        <Settings className="w-4 h-4" />
                    </button>

                    <div className="h-10 w-[1px] bg-slate-100" />

                    <div className="flex gap-10">
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</div>
                            <div className="text-sm font-black text-emerald-500 uppercase">ACTIVE</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Decisions Today</div>
                            <div className="text-sm font-black text-slate-900">0</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-1 border-b border-slate-200 h-12">
                {[
                    { id: 'BASIC', label: 'Identity', icon: Lock },
                    { id: 'AI_POLICY', label: 'Security Policy', icon: Terminal },
                    { id: 'ADVANCED', label: 'Developer', icon: Shield }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "px-8 flex items-center gap-2 text-xs font-black tracking-widest uppercase transition-all relative",
                            activeTab === tab.id ? "text-teal-500" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-b-xl border border-slate-100 shadow-sm p-10">
                {activeTab === 'BASIC' && (
                    <div className="grid grid-cols-2 gap-16">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Application Integrity</h3>
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Name</span>
                                        <span className="text-base font-bold text-slate-800">{app.name}</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Platform Key</span>
                                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                                            <code className="text-sm font-mono font-bold text-slate-600">{app.token}</code>
                                            <button onClick={copyToken} className="p-1.5 hover:bg-white rounded transition-colors">
                                                <RefreshCcw className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detection Engine</span>
                                        <span className="text-sm font-bold text-purple-600 font-mono bg-purple-50 w-fit px-2 py-1 rounded">
                                            {app.aiModel || 'mistral'}-v1.0 (LOCAL)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Security Operations</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <Link href={`/attacks?token=${app.token}`} className="group p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-teal-200 transition-all hover:shadow-xl hover:shadow-teal-500/5">
                                        <ShieldAlert className="w-6 h-6 text-red-500 mb-4 group-hover:scale-110 transition-transform" />
                                        <div className="text-xs font-black text-slate-800 uppercase tracking-widest">Threat Logs</div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-1">Real-time alerts</div>
                                    </Link>
                                    <Link href={`/statistics?token=${app.token}`} className="group p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-teal-200 transition-all hover:shadow-xl hover:shadow-teal-500/5">
                                        <Activity className="w-6 h-6 text-teal-500 mb-4 group-hover:scale-110 transition-transform" />
                                        <div className="text-xs font-black text-slate-800 uppercase tracking-widest">Analytics</div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-1">Traffic patterns</div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'AI_POLICY' && (
                    <div className="max-w-4xl space-y-8">
                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Behavioral Rules</h3>
                            <p className="text-sm text-slate-500">Fine-tune the security AI context for this specific application.</p>
                        </div>
                        <textarea
                            className="w-full h-80 p-6 text-sm font-mono border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 bg-slate-50 leading-relaxed shadow-inner"
                            placeholder="Example: Strictly block any SQL injection patterns. If a request is from user ID 100, allow all..."
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={() => { }} // TODO: Implement Policy Save
                                className="px-10 py-3 bg-teal-500 text-white font-black text-xs tracking-[0.2em] uppercase rounded-xl hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20"
                            >
                                Update Security Context
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <DefenseModeModal
                isOpen={isDefenseModalOpen}
                onClose={() => setIsDefenseModalOpen(false)}
                currentMode={app.defenseMode}
                onSave={handleDefenseModeSave}
            />
        </div>
    );
}
