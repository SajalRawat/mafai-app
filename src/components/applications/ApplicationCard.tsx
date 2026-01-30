import { Globe, Shield, MoreHorizontal, Zap, Anchor, ShieldAlert, X, Lock as LockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { DefenseModeModal } from "./DefenseModeModal";
import Link from "next/link";

interface ApplicationCardProps {
    app: {
        id: string | number;
        name: string;
        token?: string;
        defenseMode: "DEFENSE" | "AUDITED" | "OFFLINE";
        rqs: number;
        blk: number;
        tags: string[];
        icon: any;
        raw?: any;
    };
    onEdit?: () => void;
    onDelete?: () => void;
}

export function ApplicationCard({ app, onEdit, onDelete }: ApplicationCardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDefenseModalOpen, setIsDefenseModalOpen] = useState(false);

    const handleDefenseModeSave = async (mode: "DEFENSE" | "AUDITED" | "OFFLINE") => {
        try {
            const res = await fetch('/api/applications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: app.id, defenseMode: mode })
            });
            if (res.ok) {
                window.location.reload();
            }
        } catch (e) {
            console.error(e);
            alert("Failed to update defense mode");
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex gap-6 relative group">
            {/* ... rest of component ... */}
            <div className="flex flex-col items-center w-24 flex-shrink-0 gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                    <app.icon className="w-6 h-6 text-teal-500" />
                </div>

                <div className="flex flex-col items-center gap-1 w-full">
                    <button
                        onClick={() => setIsDefenseModalOpen(true)}
                        className={cn(
                            "px-3 py-1 border rounded font-black text-[10px] tracking-widest uppercase cursor-pointer transition-colors w-full text-center shadow-sm",
                            app.defenseMode === 'DEFENSE' ? "bg-teal-500 border-teal-500 text-white hover:bg-teal-600" :
                                app.defenseMode === 'AUDITED' ? "bg-amber-500 border-amber-500 text-white hover:bg-amber-600" :
                                    "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
                        )}
                    >
                        {app.defenseMode}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full pt-1">
                    <div className="text-center">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">RQS TD</div>
                        <div className="text-sm font-black text-slate-800">{app.rqs}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">BLK TD</div>
                        <div className="text-sm font-black text-slate-800">{app.blk}</div>
                    </div>
                </div>
            </div>

            {/* Right Content: Header, Details, Tags */}
            <div className="flex-1 flex flex-col justify-between min-h-[140px]">
                {/* Header & Details */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-slate-900 font-bold text-base">{app.name}</h3>
                        <div className="flex items-center gap-3 relative">
                            <Link href={`/applications/${app.id}`} className="text-[10px] font-bold text-teal-500 cursor-pointer hover:text-teal-600 uppercase tracking-wide">DETAIL</Link>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 hover:bg-slate-50 rounded-md transition-colors">
                                <MoreHorizontal className="w-4 h-4 text-teal-400" />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-10 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-teal-500 hover:bg-teal-50 transition-colors uppercase tracking-wide"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            onEdit?.();
                                        }}
                                    >
                                        EDIT
                                    </button>
                                    <button
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors uppercase tracking-wide"
                                        onClick={() => {
                                            if (confirm('Are you sure you want to remove this application?')) {
                                                setIsMenuOpen(false);
                                                onDelete?.();
                                            }
                                        }}
                                    >
                                        REMOVE
                                    </button>
                                </div>
                            )}

                            {/* Backdrop to close */}
                            {isMenuOpen && (
                                <div className="fixed inset-0 z-0" onClick={() => setIsMenuOpen(false)} />
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <LockIcon className="w-3.5 h-3.5 text-slate-300" />
                            <span className="text-[10px] uppercase tracking-wider">SEC TOKEN:</span>
                        </div>
                        <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                            <code className="text-[11px] font-mono font-bold text-slate-600 truncate block">
                                {app.token || 'MISSING_TOKEN'}
                            </code>
                        </div>
                    </div>
                </div>

                {/* Footer Tags */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2 pt-4">
                    {app.tags.map((tag, i) => (
                        <span
                            key={i}
                            className={cn(
                                "px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wide border transition-colors cursor-pointer min-w-[80px] text-center",
                                tag === "HTTP FLOOD" ? "bg-cyan-50 text-cyan-500 border-cyan-200" :
                                    tag === "BOT PROTECT" ? "bg-slate-50 text-slate-500 border-slate-100" :
                                        tag === "AUTH" ? "bg-slate-50 text-slate-500 border-slate-100" :
                                            "bg-white text-teal-500 border-teal-200"
                            )}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
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
