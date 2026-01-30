"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecurityEvent {
    id: string;
    time: string;
    ip: string;
    type: string;
    action: string;
    severity: string;
}

export function RecentEvents() {
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('/api/events');
                if (!response.ok) throw new Error('Failed to fetch events');
                const data = await response.json();
                setEvents(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                // Keep keeping mock data if API fails could be an option, but let's show error for now or fallback
                // For "real world" simulation, handling error gracefully:
                console.error("API Error, using fallback data not available.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
        // Poll every 10 seconds for real-time updates
        const interval = setInterval(fetchEvents, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading && events.length === 0) {
        return (
            <div className="bg-maf-card border border-maf-border rounded-2xl p-8 flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-maf-blue animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-maf-card border border-maf-border rounded-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-maf-border flex items-center justify-between">
                <div>
                    <h3 className="text-white font-semibold text-lg">Recent Security Events</h3>
                    <p className="text-xs text-maf-text-secondary">Real-time attack logs</p>
                </div>
                <button className="text-xs text-maf-blue hover:underline flex items-center gap-1 font-medium">
                    View All Logs <ExternalLink className="w-3 h-3" />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-maf-dark/50 text-[10px] uppercase tracking-wider text-maf-text-muted font-bold">
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4">Source IP</th>
                            <th className="px-6 py-4">Event Type</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Severity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-maf-border">
                        {events.length > 0 ? (
                            events.map((event) => (
                                <tr key={event.id} className="hover:bg-maf-border/30 transition-colors group">
                                    <td className="px-6 py-4 text-xs text-maf-text-secondary">{event.time}</td>
                                    <td className="px-6 py-4 text-xs font-mono text-maf-text-primary">{event.ip}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-maf-text-primary font-medium">{event.type}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {event.action === "Blocked" ? (
                                                <ShieldAlert className="w-4 h-4 text-red-500" />
                                            ) : event.action === "Passed" ? (
                                                <ShieldCheck className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <Shield className="w-4 h-4 text-yellow-500" />
                                            )}
                                            <span className={cn(
                                                "text-xs font-semibold",
                                                event.action === "Blocked" ? "text-red-500" :
                                                    event.action === "Passed" ? "text-green-500" : "text-yellow-500"
                                            )}>
                                                {event.action}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                            event.severity === "High" ? "bg-red-500/10 text-red-500" :
                                                event.severity === "Medium" ? "bg-yellow-500/10 text-yellow-500" : "bg-green-500/10 text-green-500"
                                        )}>
                                            {event.severity}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr className="text-center">
                                <td colSpan={5} className="py-8 text-maf-text-secondary text-sm">
                                    {error ? "Failed to load events" : "No recent events found"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

