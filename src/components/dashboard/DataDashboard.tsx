"use client";

import { FileText, Download, Filter, Search, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AccessLog {
    id: string;
    time: string;
    ip: string;
    method: string;
    uri: string;
    status: number;
    size: string;
}

export function DataDashboard() {
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch('/api/logs');
                if (!response.ok) throw new Error('Failed to fetch logs');
                const data = await response.json();
                setLogs(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                console.error("API Error (Logs)", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading && logs.length === 0) {
        return (
            <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden p-8 flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teal-500" />
                        <h3 className="text-slate-800 font-bold text-sm">Access Logs</h3>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                className="pl-9 pr-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-48 text-slate-700"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                            <Filter className="w-3.5 h-3.5 text-slate-400" />
                            Filter
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500 text-white text-xs font-bold hover:bg-teal-600 transition-colors shadow-sm cursor-pointer">
                            <Download className="w-3.5 h-3.5" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Time</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Source IP</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Method</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">URI</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Size</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-4 text-xs font-bold text-slate-600 font-mono">{log.time}</td>
                                        <td className="p-4 text-xs font-bold text-slate-700 font-mono">{log.ip}</td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "text-[10px] px-2 py-0.5 rounded font-black uppercase",
                                                log.method === "POST" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                                            )}>
                                                {log.method}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs font-medium text-slate-600 truncate max-w-[200px]">{log.uri}</td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "flex items-center gap-1.5 text-xs font-bold",
                                                log.status === 200 ? "text-teal-600" : "text-red-500"
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", log.status === 200 ? "bg-teal-500" : "bg-red-500")} />
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs font-bold text-slate-400">{log.size}</td>
                                        <td className="p-4">
                                            <button className="p-1 rounded hover:bg-slate-200 transition-colors cursor-pointer">
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="text-center">
                                    <td colSpan={7} className="py-8 text-slate-500 text-sm">
                                        {error ? "Failed to load access logs" : "No logs available"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
