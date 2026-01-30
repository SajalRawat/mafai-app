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
    const [activeTab, setActiveTab] = useState("Reverse Proxy");
    const [ports, setPorts] = useState([{ protocol: 'HTTP', port: '80' }, { protocol: 'HTTPS', port: '443' }]);
    const [upstreams, setUpstreams] = useState(["http://192.168.1.10:8080"]);
    const [domain, setDomain] = useState("");
    const [redirectStatus, setRedirectStatus] = useState(301);
    const [statusOpen, setStatusOpen] = useState(false);
    const [redirectUrl, setRedirectUrl] = useState("");
    const [appName, setAppName] = useState("");
    const [loggingEnabled, setLoggingEnabled] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && initialData) {
            setAppName(initialData.name || "");
            setDomain(initialData.domain || "");
            setPorts(initialData.ports || [{ protocol: 'HTTP', port: '80' }]);
            setUpstreams(initialData.upstreams || [""]);
            setActiveTab(initialData.type || "Reverse Proxy");
            setLoggingEnabled(initialData.loggingEnabled !== undefined ? initialData.loggingEnabled : true);
            setRedirectStatus(initialData.redirectStatus || 301);
            setRedirectUrl(initialData.redirectUrl || "");
        } else if (isOpen) {
            // Reset for add mode
            setAppName("");
            setDomain("");
            setPorts([{ protocol: 'HTTP', port: '80' }, { protocol: 'HTTPS', port: '443' }]);
            setUpstreams(["http://192.168.1.10:8080"]);
            setActiveTab("Reverse Proxy");
            setLoggingEnabled(true);
            setRedirectStatus(301);
            setRedirectUrl("");
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const addPort = () => {
        setPorts([...ports, { protocol: 'HTTP', port: '' }]);
    };

    const removePort = (index: number) => {
        setPorts(ports.filter((_, i) => i !== index));
    };

    const updatePort = (index: number, field: 'protocol' | 'port', value: string) => {
        const newPorts = [...ports];
        newPorts[index] = { ...newPorts[index], [field]: value };
        setPorts(newPorts);
    };

    const addUpstream = () => {
        setUpstreams([...upstreams, ""]);
    };

    const removeUpstream = (index: number) => {
        setUpstreams(upstreams.filter((_, i) => i !== index));
    };

    const updateUpstream = (index: number, value: string) => {
        const newUpstreams = [...upstreams];
        newUpstreams[index] = value;
        setUpstreams(newUpstreams);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const isEdit = !!initialData;
            const url = '/api/applications';
            const method = isEdit ? 'PUT' : 'POST';

            let body: any = {
                name: appName,
                domain,
                ports,
                type: activeTab,
                loggingEnabled
            };

            if (activeTab === 'Reverse Proxy') {
                const cleanUpstreams = upstreams.filter(u => u.trim() !== "");
                if (cleanUpstreams.length === 0) {
                    alert('Please configure at least one upstream server for Reverse Proxy');
                    setLoading(false);
                    return;
                }
                body.upstreams = cleanUpstreams;
            } else if (activeTab === 'Redirect') {
                if (!redirectUrl.trim()) {
                    alert('Please configure the Redirect Address');
                    setLoading(false);
                    return;
                }
                body.redirectStatus = redirectStatus;
                body.redirectUrl = redirectUrl;
                body.upstreams = [redirectUrl]; // Backwards compatibility for engine if needed
            } else if (activeTab === 'Static Files') {
                body.upstreams = []; // No upstreams for static
            }

            if (isEdit) {
                body.id = initialData.id || initialData._id;
            }

            console.log("Submitting application:", { url, method, body });

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
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
            <div className="bg-white rounded-xl shadow-2xl w-[700px] max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">{initialData ? "Edit" : "Add"} Application</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-md transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* Domain Field */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Domain</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                placeholder="www.example.com, support *"
                                className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Port Fields */}
                    {ports.map((p, i) => (
                        <div key={i} className="flex items-end gap-3">
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Port <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={p.port}
                                    onChange={(e) => updatePort(i, 'port', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold font-mono text-slate-800 focus:outline-none focus:border-teal-500"
                                />
                            </div>
                            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                                <button
                                    onClick={() => updatePort(i, 'protocol', 'HTTP')}
                                    className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", p.protocol === 'HTTP' ? "bg-white text-slate-800 shadow-sm" : "text-slate-400")}
                                >
                                    HTTP
                                </button>
                                <button
                                    onClick={() => updatePort(i, 'protocol', 'HTTPS')}
                                    className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", p.protocol === 'HTTPS' ? "bg-teal-500 text-white shadow-sm" : "text-slate-400")}
                                >
                                    HTTPS
                                </button>
                            </div>
                            <button onClick={() => removePort(i)} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors">
                                <Trash className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={addPort}
                        className="w-full py-2.5 border-2 border-dashed border-teal-200 rounded-lg text-teal-500 font-bold text-xs uppercase tracking-wide hover:bg-teal-50 hover:border-teal-300 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Listening Port
                    </button>

                    {/* Tabs (Reverse Proxy / Static / Redirect) */}
                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-6 mb-6">
                            {["Reverse Proxy", "Static Files", "Redirect"].map(tab => (
                                <label key={tab} className="flex items-center gap-2 cursor-pointer group">
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                        activeTab === tab ? "border-teal-500" : "border-slate-300 group-hover:border-teal-400"
                                    )}>
                                        {activeTab === tab && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
                                    </div>
                                    <span className={cn(
                                        "text-sm font-bold",
                                        activeTab === tab ? "text-slate-800" : "text-slate-500 group-hover:text-slate-700"
                                    )}>{tab}</span>
                                    <input type="radio" name="appType" className="hidden" checked={activeTab === tab} onChange={() => setActiveTab(tab)} />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Reverse Proxy Mode */}
                    {activeTab === "Reverse Proxy" && (
                        <div className="space-y-4">
                            {upstreams.map((upstream, i) => (
                                <div key={i} className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Upstream <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={upstream}
                                            onChange={(e) => updateUpstream(i, e.target.value)}
                                            placeholder="http://192.168.1.10:8080, not support path"
                                            className="flex-1 pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                                        />
                                        <button onClick={() => removeUpstream(i)} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors">
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={addUpstream}
                                className="w-full py-2.5 border-2 border-dashed border-teal-200 rounded-lg text-teal-500 font-bold text-xs uppercase tracking-wide hover:bg-teal-50 hover:border-teal-300 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Upstream
                            </button>
                        </div>
                    )}

                    {/* Static Files Mode */}
                    {activeTab === "Static Files" && (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-sm">
                            After the site is successfully added, you can manage static files on the site details page.
                        </div>
                    )}

                    {/* Redirect Mode */}
                    {activeTab === "Redirect" && (
                        <div className="flex gap-4">
                            <div className="w-1/3 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Status Code</label>
                                <div className="relative">
                                    <button
                                        onClick={() => setStatusOpen(!statusOpen)}
                                        onBlur={() => setTimeout(() => setStatusOpen(false), 200)}
                                        className={cn(
                                            "w-full pl-4 pr-8 py-2.5 bg-white border rounded-lg text-sm font-bold text-slate-700 focus:outline-none transition-all text-left flex items-center justify-between",
                                            statusOpen ? "border-teal-500 ring-2 ring-teal-500/20" : "border-slate-200"
                                        )}
                                    >
                                        {redirectStatus}
                                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", statusOpen && "rotate-180")} />
                                    </button>

                                    {statusOpen && (
                                        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                            {[301, 302, 307, 308].map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => { setRedirectStatus(status); setStatusOpen(false); }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-2 text-sm font-bold transition-colors",
                                                        redirectStatus === status
                                                            ? "bg-blue-600 text-white"
                                                            : "text-slate-700 hover:bg-slate-50"
                                                    )}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="w-2/3 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Address <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={redirectUrl}
                                    onChange={(e) => setRedirectUrl(e.target.value)}
                                    placeholder="http://192.168.1.10:8080, not support path"
                                    className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Application Name</label>
                        <input
                            type="text"
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            placeholder="Application Name"
                            className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                id="loggingEnabled"
                                checked={loggingEnabled}
                                onChange={(e) => setLoggingEnabled(e.target.checked)}
                                className="peer h-4.5 w-4.5 cursor-pointer appearance-none rounded border border-slate-300 bg-white checked:border-red-500 checked:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                            />
                            <svg
                                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="3.5"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        </div>
                        <label htmlFor="loggingEnabled" className="text-sm font-bold text-slate-700 select-none cursor-pointer">
                            Enable Traffic Logging
                        </label>
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
