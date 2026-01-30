"use client";

import React, { useState } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { Shield, ShieldAlert, Activity, Zap, Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DonutChartCard } from "./DonutChartCard";
import { ProgressBarCard } from "./ProgressBarCard";

// --- Mock Data ---

const attackTrend = Array.from({ length: 24 }).map((_, i) => ({
    name: `${i}:00`,
    value: i === 0 ? 180 : Math.floor(Math.random() * 5) + 3 // Sharp L shape
}));

const allowDenyTrend = Array.from({ length: 24 }).map((_, i) => ({
    name: `${i}:00`,
    value: i === 0 ? 150 : Math.floor(Math.random() * 50) + 10
}));

const webAttackData = [
    { name: "XSS", value: 6, color: "#2dd4bf" },
    { name: "SQL Inj", value: 4, color: "#6366f1" },
    { name: "Leaking", value: 3, color: "#f59e0b" },
    { name: "Code Inj", value: 2, color: "#f43f5e" },
    { name: "-", value: 0, color: "#14b8a6" },
];

const ruleHitData = [
    { name: "Search Engine Spi...", value: 1, color: "#2dd4bf" },
    { name: "-", value: 0, color: "#6366f1" },
    { name: "-", value: 0, color: "#f59e0b" },
    { name: "-", value: 0, color: "#f43f5e" },
    { name: "-", value: 0, color: "#14b8a6" },
];

const realtimeEvents = [
    { type: "Anti-Bot", title: "Anti-Replay Demo", time: "21:34:24" },
    { type: "Anti-Bot", title: "Anti-Replay Demo", time: "21:30:30" },
    { type: "Anti-Bot", title: "Anti-Replay Demo", time: "21:28:33" },
    { type: "Anti-Bot", title: "CAPTCHA Challen...", time: "19:51:42" },
    { type: "Attacks", title: "Untitled", time: "19:19:20" },
    { type: "Anti-Bot", title: "CAPTCHA Challen...", time: "19:01:38" },
    { type: "Attacks", title: "Untitled", time: "18:59:47" },
];

const attackedPages = [
    { path: "47.242.104.253/.git/config", count: 4 },
    { path: "demo.maf.chaitin.com:10084/hello.html", count: 4 },
    { path: "demo.maf.chaitin.com:10083/axis2/services/...", count: 2 },
    { path: "demo.maf.chaitin.com:10087/axis2/services/...", count: 2 },
    { path: "47.242.104.253:10083/axis2/services/Version", count: 2 },
];

const topIPs = [
    { ip: "47.92.73.113", count: 8 },
    { ip: "123.56.31.234", count: 7 },
    { ip: "47.97.186.51", count: 6 },
    { ip: "47.94.232.35", count: 6 },
    { ip: "120.27.215.134", count: 6 },
];

const StatItem = ({ label, value, icon: Icon }: any) => (
    <div className="flex flex-col gap-1 pr-8 border-r border-slate-100 last:border-0">
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            {label} hey
            {Icon && <Icon className="w-3 h-3" />}
        </div>
        <div className="text-2xl font-black text-slate-800">{value}</div>
    </div>
);

const TrendCard = ({ title, data, color = "#2dd4bf", onMoreClick, topIPs = [] }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col h-[320px]">
        <h3 className="text-slate-800 font-bold text-sm mb-6">{title}</h3>
        <div className="flex-1 flex gap-8">
            {/* Chart Area */}
            <div className="flex-1 relative min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={data}>
                        <defs>
                            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.1} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
                            itemStyle={{ fontSize: "12px", fontWeight: "bold", color: color }}
                        />
                        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* IP List Area */}
            <div className="w-56 flex-shrink-0 flex flex-col bg-slate-50/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-slate-900">IPs</span>
                    <span
                        onClick={onMoreClick}
                        className="text-[11px] font-bold text-teal-500 cursor-pointer hover:text-teal-600 transition-colors"
                    >
                        MORE
                    </span>
                </div>
                <div className="space-y-4">
                    {(topIPs.length ? topIPs : []).slice(0, 5).map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between group cursor-pointer">
                            <span className="text-[12px] font-medium text-slate-400 group-hover:text-teal-500 transition-colors font-mono tracking-tight">{item.ip}</span>
                            <span className="text-[12px] font-black text-slate-900">{item.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const moreIPsData = Array.from({ length: 20 }).map((_, i) => ({
    ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    count: Math.floor(Math.random() * 10) + 1,
    color: ["#2dd4bf", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"][Math.floor(Math.random() * 5)]
}));

const IPModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">IPs</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-md transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {moreIPsData.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-[13px] font-medium text-slate-600 font-mono tracking-tight">{item.ip}</span>
                            </div>
                            <span className="text-[13px] font-bold text-slate-900">{item.count}</span>
                        </div>
                    ))}
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm shadow-teal-200"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export function SecurityPosture() {
    const [isIPModalOpen, setIsIPModalOpen] = useState(false);
    const [stats, setStats] = useState<any>(null);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/stats/security');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (e) {
                console.error("Failed to fetch security stats", e);
            }
        };
        fetchStats();
        // Poll every 5s
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    // Derived states with fallbacks
    const kpi = stats?.kpi || { attacks: 0, allowDeny: 0, rateLimit: 0, waitingRoom: 0, antiBot: 0, auth: 0 };
    const trends = stats?.trends || { attacks: [], allowDeny: [] };
    const realtimeEventsList = (stats?.realtimeEvents || []).filter((e: any) => e.type !== "Anti-Bot");

    const webAttackDataList = (stats?.charts?.webAttack || []).map((d: any, i: number) => ({
        ...d,
        color: ["#2dd4bf", "#6366f1", "#f59e0b", "#f43f5e", "#14b8a6"][i % 5]
    }));

    const attackedPagesList = (stats?.charts?.attackedPages || []).map((d: any) => ({
        label: d.path,
        value: d.count,
        percent: 100, // Simplified
        color: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]"
    }));

    const topIPsList = stats?.charts?.topIPs || [];

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <IPModal isOpen={isIPModalOpen} onClose={() => setIsIPModalOpen(false)} />

            {/* 1. Top Stats Row */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between overflow-x-auto">
                <StatItem label="Attacks" value={kpi.attacks.toLocaleString()} icon={ShieldAlert} />
                <StatItem label="Allow & Deny" value={kpi.allowDeny.toLocaleString()} icon={Shield} />
                <StatItem label="Waiting Room" value={kpi.waitingRoom} icon={Lock} />
                <StatItem label="Auth" value={kpi.auth} icon={Shield} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column - Trends (Charts) */}
                <div className="lg:col-span-8 space-y-4">
                    <TrendCard title="Attacks Trends" data={trends.attacks.length ? trends.attacks : attackTrend} color="#2dd4bf" onMoreClick={() => setIsIPModalOpen(true)} topIPs={topIPsList} />
                    <TrendCard title="Allow & Deny Trends" data={trends.allowDeny.length ? trends.allowDeny : allowDenyTrend} color="#f43f5e" onMoreClick={() => setIsIPModalOpen(true)} topIPs={topIPsList} />
                </div>

                {/* Right Column - Sidebars (Lists, Donuts) */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Real-time Events */}
                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                        <h3 className="text-slate-800 font-bold text-sm mb-4">Real-time Events</h3>
                        <div className="space-y-3">
                            {realtimeEventsList.map((event: any, i: number) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <span className={cn(
                                            "text-[9px] font-black px-1.5 py-0.5 rounded border uppercase",
                                            event.type === "Anti-Bot" ? "bg-cyan-50 text-cyan-500 border-cyan-100" : "bg-teal-50 text-teal-500 border-teal-100"
                                        )}>
                                            {event.type}
                                        </span>
                                        <span className="text-[11px] font-bold text-slate-600 truncate max-w-[120px]">{event.title}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 font-mono">{event.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Web Attack Donut */}
                    <DonutChartCard
                        title="Web Attack"
                        data={webAttackDataList.length ? webAttackDataList : [{ name: "No Data", value: 1, color: "#e2e8f0" }]}
                        onMore={() => { }}
                    />


                    {/* Rule Hit Donut */}
                    <DonutChartCard
                        title="Allow & Deny Rule Hit"
                        data={[{ name: "No Data", value: 0, color: "#e2e8f0" }]} // Mock
                        onMore={() => { }}
                    />

                    {/* Attacked Pages List */}
                    <ProgressBarCard
                        title="Attacked Pages"
                        data={attackedPagesList}
                        onMore={() => { }}
                    />
                </div>
            </div>
        </div>
    );
}
