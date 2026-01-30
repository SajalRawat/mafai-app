import React from "react";
import { cn } from "@/lib/utils";

interface SecurityTableProps {
    view: "EVENTS" | "LOGS";
    data: any[];
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
}

export function SecurityTable({ view, data, currentPage = 1, totalPages = 1, onPageChange }: SecurityTableProps) {
    const [selectedLog, setSelectedLog] = React.useState<any>(null);

    const PaginationFooter = () => (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white text-xs">
            <span className="text-slate-500 font-medium">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
                <button
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange?.(currentPage - 1)}
                    className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
                >
                    Previous
                </button>
                <button
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange?.(currentPage + 1)}
                    className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
                >
                    Next
                </button>
            </div>
        </div>
    );

    if (view === "EVENTS") {
        return (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="px-6 py-4">IP Addr</th>
                                <th className="px-6 py-4">Applications</th>
                                <th className="px-6 py-4 text-center">Attack Count</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Start At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors text-xs font-medium">
                                    <td className="px-6 py-4">
                                        <div className="text-slate-800 font-bold">{row.ip}</div>
                                        <div className="text-slate-400 text-[10px]">{row.country}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{row.apps}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <div className="px-4 py-1 border border-red-200 rounded text-red-500 font-black text-[11px] bg-red-50/30">
                                                {row.count}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-800">{row.duration}</td>
                                    <td className="px-6 py-4 text-slate-800">{row.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationFooter />
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">URL</th>
                                <th className="px-6 py-4">Attack Type</th>
                                <th className="px-6 py-4">IP Addr</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors text-xs font-medium">
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded font-black text-[10px] uppercase text-white",
                                            row.action === "BLOCKED" ? "bg-red-500" : "bg-emerald-500"
                                        )}>
                                            {row.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-[400px] truncate text-slate-600 font-mono text-[11px]">
                                            {row.method && <span className="font-bold mr-2 text-slate-800">{row.method}</span>}
                                            {row.url}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-800 font-bold">{row.type}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-800 font-bold">{row.ip}</div>
                                        <div className="text-slate-400 text-[10px]">{row.country}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-800">{row.time}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span
                                            onClick={() => setSelectedLog(row)}
                                            className="text-teal-500 font-black text-[10px] cursor-pointer hover:text-teal-600 uppercase tracking-wider"
                                        >
                                            Detail
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationFooter />
            </div>

            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Request Details</h3>
                                <div className="text-xs text-slate-500 mt-1 font-mono">{selectedLog.id}</div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</div>
                                    <div className={cn(
                                        "font-bold text-sm",
                                        selectedLog.action === "BLOCKED" ? "text-red-600" : "text-emerald-600"
                                    )}>{selectedLog.action}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">IP Address</div>
                                    <div className="font-bold text-slate-800 text-sm">{selectedLog.ip}</div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Request</div>
                                <div className="font-mono text-sm break-all text-slate-700">
                                    <span className="font-bold text-slate-900">{selectedLog.method}</span> {selectedLog.url}
                                </div>
                            </div>

                            {selectedLog.analysis && (
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">AI Analysis</div>
                                    <pre className="whitespace-pre-wrap font-mono text-xs text-slate-600 bg-white p-3 rounded border border-slate-200 shadow-sm overflow-x-auto">
                                        {selectedLog.analysis}
                                    </pre>
                                </div>
                            )}

                            {!selectedLog.analysis && (
                                <div className="text-center text-slate-400 text-sm py-4 italic">
                                    No AI analysis details available for this request.
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-right">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
