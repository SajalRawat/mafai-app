"use client";

import { X, Trash, Plus, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AddApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
}

export function AddApplicationModal({ isOpen, onClose, initialData }: AddApplicationModalProps) {
    const [appName, setAppName] = useState("");
    const [defenseMode, setDefenseMode] = useState("DEFENSE");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && initialData) {
            setAppName(initialData.name || "");
            setDefenseMode(initialData.defenseMode || "DEFENSE");
        } else if (isOpen) {
            setAppName("");
            setDefenseMode("DEFENSE");
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!appName.trim()) {
            alert("Application Name is required");
            return;
        }

        setLoading(true);
        try {
            const isEdit = !!initialData;
            const url = '/api/applications';
            const method = isEdit ? 'PUT' : 'POST';

            let body: any = {
                name: appName,
                defenseMode
            };

            if (isEdit) {
                body.id = initialData.id || initialData._id;
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save application');
            }

            window.location.reload();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to save application');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">{initialData ? "Edit" : "Add"} Application</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-md transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Application Name</label>
                        <input
                            type="text"
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            placeholder="My Secure App"
                            className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Defense Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['DEFENSE', 'AUDITED', 'OFFLINE'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setDefenseMode(mode)}
                                    className={cn(
                                        "py-2 px-3 rounded-lg text-xs font-bold border transition-all",
                                        defenseMode === mode
                                            ? "bg-teal-500 border-teal-500 text-white shadow-md"
                                            : "bg-white border-slate-200 text-slate-500 hover:border-teal-200"
                                    )}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Information</p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            {defenseMode === 'DEFENSE' && "Active blocking of malicious requests. Threats are logged and denied."}
                            {defenseMode === 'AUDITED' && "Passive monitoring. Malicious requests are allowed but flagged and logged."}
                            {defenseMode === 'OFFLINE' && "Protection is disabled. All traffic passes through without inspection."}
                        </p>
                    </div>
                </div>

                {/* Footer buttons */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                    <button onClick={onClose} className="px-6 py-2.5 text-slate-500 font-bold text-sm uppercase tracking-wide hover:text-slate-800 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm rounded-lg transition-colors shadow-lg shadow-teal-200 uppercase tracking-wide disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
}
