"use client";

import { X, Shield, Eye, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface DefenseModeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentMode: "Defense" | "Audited" | "Offline";
    onSave: (mode: "Defense" | "Audited" | "Offline") => Promise<void>;
}

export function DefenseModeModal({ isOpen, onClose, currentMode, onSave }: DefenseModeModalProps) {
    const [selectedMode, setSelectedMode] = useState<"Defense" | "Audited" | "Offline">(currentMode);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave(selectedMode);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const modes = [
        {
            id: "Defense",
            title: "Defense mode",
            desc: "Attacks will be blocked",
            icon: Shield,
            color: "text-teal-500",
            bg: "bg-teal-50",
            border: "border-teal-500",
            ring: "ring-teal-500/20"
        },
        {
            id: "Audited",
            title: "Audited mode",
            desc: "Log traffic only (No AI Analysis)",
            icon: Eye,
            color: "text-amber-500",
            bg: "bg-amber-50",
            border: "border-amber-500",
            ring: "ring-amber-500/20"
        },
        {
            id: "Offline",
            title: "Offline mode",
            desc: "All users will be blocked",
            icon: WifiOff,
            color: "text-red-500",
            bg: "bg-red-50",
            border: "border-red-500",
            ring: "ring-red-500/20"
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[900px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-8 pb-0">
                    <div className="grid grid-cols-3 gap-6">
                        {modes.map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id as any)}
                                className={cn(
                                    "flex flex-col items-start p-6 rounded-lg border-2 transition-all relative text-left h-[180px]",
                                    selectedMode === mode.id
                                        ? `${mode.border} ${mode.bg}`
                                        : "border-slate-100 hover:border-slate-200 bg-white"
                                )}
                            >
                                <h3 className={cn("text-lg font-bold mb-3", mode.color)}>
                                    {mode.title}
                                </h3>
                                <p className={cn(
                                    "text-sm font-medium",
                                    selectedMode === mode.id ? mode.color : "text-slate-400"
                                )}>
                                    {mode.desc}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer buttons */}
                <div className="p-8 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-teal-500 font-bold text-sm uppercase tracking-wide hover:bg-teal-50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm rounded-lg transition-colors shadow-lg shadow-teal-200 uppercase tracking-wide disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
