"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { useEffect, useState } from "react";

export function TrafficChart() {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const fetchTraffic = async () => {
            try {
                const res = await fetch('/api/stats/traffic');
                if (res.ok) {
                    const json = await res.json();
                    if (json.requests && json.blocked) {
                        // Merge requests and blocked arrays
                        const merged = json.requests.map((r: any, i: number) => ({
                            time: r.time, // "1/27, 03:00 PM" - simplify if needed
                            requests: r.value,
                            blocked: json.blocked[i] ? json.blocked[i].value : 0
                        }));
                        setData(merged);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch traffic chart data", e);
            }
        };

        fetchTraffic();
        const interval = setInterval(fetchTraffic, 5000);
        return () => clearInterval(interval);
    }, []);

    // Custom tick formatter to show simpler time on axis if needed
    const formatXAxis = (tickItem: string) => {
        // tickItem is "M/D, HH:MM PM". Extract HH:MM PM or just HH:MM
        if (!tickItem) return "";
        const parts = tickItem.split(', ');
        return parts.length > 1 ? parts[1] : tickItem;
    };

    return (
        <div className="bg-maf-card border border-maf-border p-6 rounded-2xl h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-white font-semibold text-lg">Traffic Trend</h3>
                    <p className="text-xs text-maf-text-secondary">Requests vs Blocked attacks (Last 24h)</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-maf-blue" />
                        <span className="text-xs text-maf-text-secondary font-medium">Requests</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-xs text-maf-text-secondary font-medium">Blocked</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full -ml-4 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00A6FB" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#00A6FB" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorBlock" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D333B" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#484F58"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            tickFormatter={formatXAxis}
                        />
                        <YAxis
                            stroke="#484F58"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#161B22",
                                borderColor: "#30363D",
                                borderRadius: "12px",
                                fontSize: "12px",
                                color: "#F0F6FC"
                            }}
                            itemStyle={{ color: "#F0F6FC" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="requests"
                            stroke="#00A6FB"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorReq)"
                        />
                        <Area
                            type="monotone"
                            dataKey="blocked"
                            stroke="#ef4444"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorBlock)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
