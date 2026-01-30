"use client";

import React, { useState } from "react";
import {
    Users,
    Send,
    Activity,
    AlertTriangle,
    Info,
    Zap,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const GeoLocation = dynamic(() => import("@/components/dashboard/GeoLocation").then(mod => mod.GeoLocation), { ssr: false });
import { QPSChart, RequestsStatusChart, BlockingStatusChart } from "./VerticalCharts";
import { DonutChartCard } from "./DonutChartCard";
import { ProgressBarCard } from "./ProgressBarCard";
import { DetailsModal } from "./DetailsModal";

// Mock Data for new reports
const userClientsData = [
    { name: "Windows", value: 427, color: "#2dd4bf" },
    { name: "Unknown", value: 106, color: "#f59e0b" },
    { name: "MacOS", value: 81, color: "#14b8a6" },
    { name: "Mozilla", value: 127, color: "#6366f1" },
    { name: "Firefox", value: 82, color: "#f43f5e" },
];

const chromeData = [
    { name: "Mozilla", value: 139, color: "#6366f1" },
    { name: "Android", value: 93, color: "#f43f5e" },
    { name: "Chrome", value: 392, color: "#2dd4bf" },
    { name: "Unknown", value: 102, color: "#f59e0b" },
    { name: "Chrome Mobile", value: 75, color: "#14b8a6" },
];

const responseStatusData = [
    { name: "404", value: 448, color: "#2dd4bf" },
    { name: "405", value: 39, color: "#f59e0b" },
    { name: "304", value: 2, color: "#14b8a6" },
    { name: "467", value: 25, color: "#6366f1" },
    { name: "403", value: 15, color: "#f43f5e" },
];

const requestsByStatus = [
    { name: "200", value: 361, color: "#6366f1" },
    { name: "400", value: 27, color: "#f43f5e" },
    { name: "468", value: 53, color: "#2dd4bf" },
    { name: "502", value: 17, color: "#f59e0b" },
    { name: "429", value: 7, color: "#14b8a6" },
];

const referringAppData = [
    { label: "www.baidu.com", value: 7, percent: 80, color: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]" },
    { label: "demo.maf.chaitin.com", value: 4, percent: 50, color: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]" },
    { label: "www.google.com", value: 1, percent: 15, color: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]" },
    { label: "-", value: 0, percent: 0, color: "bg-blue-400" },
    { label: "-", value: 0, percent: 0, color: "bg-blue-400" },
];

const referringPageData = [
    { label: "http://www.baidu.com/link?url=www.so.com&url=www.soso.com&url=www.sogou.com", value: 7, percent: 80, color: "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.4)]" },
    { label: "https://demo.maf.chaitin.com/", value: 4, percent: 50, color: "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.4)]" },
    { label: "https://www.google.com/", value: 1, percent: 15, color: "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.4)]" },
    { label: "-", value: 0, percent: 0, color: "bg-orange-400" },
    { label: "-", value: 0, percent: 0, color: "bg-orange-400" },
];

const popularAppData = [
    { label: "47.242.104.253", value: 431, percent: 90 },
    { label: "demo.maf.chaitin.com:10083", value: 90, percent: 30 },
    { label: "demo.maf.chaitin.com", value: 84, percent: 28 },
    { label: "47.242.104.253:8443", value: 51, percent: 20 },
    { label: "47.242.104.253:10083", value: 41, percent: 18 },
];

const popularPageData = [
    { label: "https://47.242.104.253/", value: 158, percent: 90, color: "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.4)]" },
    { label: "https://demo.maf.chaitin.com/", value: 67, percent: 60, color: "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.4)]" },
    { label: "http://47.242.104.253/", value: 62, percent: 55, color: "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.4)]" },
    { label: "https://47.242.104.253/favicon.ico", value: 43, percent: 40, color: "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.4)]" },
    { label: "https://demo.maf.chaitin.com/hello.html", value: 35, percent: 30, color: "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.4)]" },
];

const HumanIcon = (props: any) => (
    // ... icons remain same ...
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M19 8v9m3-3h-6" />
    </svg>
);

const PaperPlaneIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

const UsersIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

export function TrafficAnalysis() {
    const [activeModal, setActiveModal] = useState<{ title: string; data: any[]; type: "DONUT" | "PROGRESS" } | null>(null);
    const [stats, setStats] = useState<any>({
        responseStatus: [],
        userClients: [],
        popularApp: [],
        popularPage: []
    });

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/stats/analysis');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (e) {
                console.error("Failed to fetch analysis stats", e);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    const { userClients, responseStatus, popularApp, popularPage, summary } = stats;

    const safeUserClients = userClients && userClients.length ? userClients : [{ name: "No Data", value: 1, color: "#e2e8f0" }];
    const safeResponseStatus = responseStatus && responseStatus.length ? responseStatus : [{ name: "No Data", value: 1, color: "#e2e8f0" }];
    const safePopularApp = popularApp || [];
    const safePopularPage = popularPage || [];

    // Calculate dynamic rates
    const errorRate = summary?.requests ? ((summary.error4xx + summary.error5xx) / summary.requests * 100).toFixed(2) + "%" : "0%";
    const blockedRate = summary?.requests ? (summary.blocked / summary.requests * 100).toFixed(2) + "%" : "0%";

    return (
        <div className="space-y-4">
            {/* Row 1: KPI Cards + QPS Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-9 space-y-4">
                    {/* Group 1 Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                        <StatCard label="Requests" value={summary?.requests?.toLocaleString() || "0"} icon={HumanIcon} variant="teal" />
                        <StatCard label="Views (PV)" value={summary?.pv?.toLocaleString() || "0"} icon={PaperPlaneIcon} variant="teal" />
                        <StatCard label="Visitors(UV)" value={summary?.uv?.toLocaleString() || "0"} icon={UsersIcon} variant="teal" />
                        <StatCard label="Unique IP" value={summary?.uniqueIp?.toLocaleString() || "0"} iconLabel="IP" variant="orange" />
                        <StatCard label="Blocked" value={summary?.blocked?.toLocaleString() || "0"} icon={Info} variant="teal" />
                        <StatCard label="IP Addr" value={summary?.ipAddr?.toLocaleString() || "0"} iconLabel="IP" variant="orange" />
                    </div>

                    {/* Group 2 Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                        <StatCard label="4xx Errors" value={summary?.error4xx?.toLocaleString() || "0"} icon={AlertTriangle} variant="red" />
                        <StatCard label="Error Rate" value={errorRate} icon={AlertTriangle} variant="red" />
                        <StatCard label="4xx Blocked" value={summary?.blocked?.toLocaleString() || "0"} icon={AlertTriangle} variant="red" />
                        <StatCard label="Blocked Rate" value={blockedRate} icon={AlertTriangle} variant="red" />
                        <StatCard label="5xx Errors" value={summary?.error5xx?.toLocaleString() || "0"} icon={AlertTriangle} variant="teal" />
                        <StatCard label="Error Rate" value={errorRate} icon={AlertTriangle} variant="red" />
                    </div>
                </div>
                <div className="lg:col-span-3">
                    <QPSChart />
                </div>
            </div>

            {/* Row 2: Geo Location + Requests/Blocking Status */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-9">
                    <GeoLocation data={stats.geo} />
                </div>
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <RequestsStatusChart />
                    <BlockingStatusChart />
                </div>
            </div>

            {/* Row 3: Analytical Donut Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DonutChartCard
                    title="User Clients"
                    data={safeUserClients}
                    secondaryData={[]}
                    onMore={() => setActiveModal({ title: "User Clients", data: safeUserClients, type: "DONUT" })}
                />
                <DonutChartCard
                    title="Response Status"
                    data={safeResponseStatus}
                    secondaryData={[]}
                    onMore={() => setActiveModal({ title: "Response Status", data: safeResponseStatus, type: "DONUT" })}
                />
            </div>

            {/* Row 4: Referring Reports */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProgressBarCard
                    title="Referring Application (Mock)" // API simplified, this might be Todo
                    data={[]}
                    onMore={() => { }}
                />
                <ProgressBarCard
                    title="Referring Page (Mock)"
                    data={[]}
                    onMore={() => { }}
                />
            </div>

            {/* Row 5: Popular Reports */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProgressBarCard
                    title="Popular Application"
                    data={safePopularApp}
                    onMore={() => setActiveModal({ title: "Popular Application", data: safePopularApp, type: "PROGRESS" })}
                />
                <ProgressBarCard
                    title="Popular Page"
                    data={safePopularPage}
                    onMore={() => setActiveModal({ title: "Popular Page", data: safePopularPage, type: "PROGRESS" })}
                />
            </div>

            {/* Global Modal for Details */}
            <DetailsModal
                isOpen={!!activeModal}
                onClose={() => setActiveModal(null)}
                title={activeModal?.title || ""}
            >
                {activeModal?.type === "PROGRESS" ? (
                    <div className="space-y-6">
                        {activeModal.data.map((item, idx) => (
                            <div key={idx} className="space-y-3">
                                <div className="flex justify-between items-center text-xs font-bold">
                                    <span className="text-slate-500 truncate max-w-[85%]">{item.label}</span>
                                    <span className="text-slate-900">{item.value}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-1000", item.color || "bg-teal-400")}
                                        style={{ width: `${item.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {activeModal?.data.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-maf-blue font-bold">{item.name}</span>
                                </div>
                                <span className="text-sm font-black text-slate-900">{item.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </DetailsModal>
        </div>
    );
}
