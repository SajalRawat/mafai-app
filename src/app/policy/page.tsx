"use client";

import { useState, useEffect } from "react";
import { Send, FileText, Database, RefreshCw } from "lucide-react";
import { createPolicyModel, getMafModels } from "./actions";

export default function PolicyPage() {
    const [policy, setPolicy] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [models, setModels] = useState<any[]>([]);

    const fetchModels = async () => {
        const m = await getMafModels();
        setModels(m);
    };

    useEffect(() => {
        fetchModels();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await createPolicyModel(policy);

            if (result.success) {
                alert("Policy updated successfully! Ollama model 'maf-policeman' created.");
                setPolicy("");
                fetchModels(); // Refresh list
            } else {
                alert(`Failed to update policy: ${result.error}`);
            }
        } catch (error) {
            alert("An unexpected error occurred.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 space-y-4 max-w-[1600px] mx-auto bg-slate-50/30 min-h-screen">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-teal-500/10 rounded-lg">
                    <FileText className="w-6 h-6 text-teal-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Company Policy & AI Models</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-7xl mx-auto">
                {/* Left Column: Policy Form */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <h2 className="text-lg font-bold text-slate-900">Update Policy</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="policy" className="block text-sm font-semibold text-slate-700">
                                Policy Content
                            </label>
                            <p className="text-xs text-slate-500 mb-2">
                                Enter the detailed company policy below. This will be used to generate the 'maf-policeman' model.
                            </p>
                            <textarea
                                id="policy"
                                value={policy}
                                onChange={(e) => setPolicy(e.target.value)}
                                placeholder="Enter company policy here..."
                                required
                                className="w-full min-h-[400px] p-4 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono text-sm resize-y"
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-50">
                            <button
                                type="submit"
                                disabled={isSubmitting || !policy.trim()}
                                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all
                  ${isSubmitting || !policy.trim()
                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        : "bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20 active:scale-95"
                                    }
                `}
                            >
                                {isSubmitting ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        Submit Policy <Send className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Column: Models List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sm:p-8 h-fit">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-slate-400" />
                            <h2 className="text-lg font-bold text-slate-900">Active MAF Models</h2>
                        </div>
                        <button onClick={fetchModels} className="text-slate-400 hover:text-teal-500 transition-colors p-1">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                                <tr>
                                    <th className="px-4 py-3">Model Name</th>
                                    <th className="px-4 py-3">Last Modified</th>
                                    <th className="px-4 py-3 text-right">Size</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {models.length > 0 ? (
                                    models.map((m, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-4 py-3 font-mono text-purple-600 font-medium">
                                                {m.name}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {new Date(m.modified_at).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 text-right font-mono">
                                                {(m.size / 1024 / 1024 / 1024).toFixed(2)} GB
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">
                                            No 'maf' models found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
