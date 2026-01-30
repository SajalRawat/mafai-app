"use client";

import React, { useState } from "react";
import { SecurityFilters } from "@/components/security/SecurityFilters";
import { SecurityTable } from "@/components/security/SecurityTable";
import { formatLocalTime } from "@/lib/utils";

const mockEvents = [
    { ip: "116.62.147.32", country: "China", apps: "https://demo.maf.chaitin.com/", count: 1, duration: "0 minutes", time: "2026-01-23 23:09:54" },
    { ip: "116.62.147.32", country: "China", apps: "http://47.242.104.253/", count: 4, duration: "1 minutes", time: "2026-01-23 23:09:51" },
    { ip: "116.62.147.32", country: "China", apps: "https://demo.maf.chaitin.com:8443/", count: 2, duration: "0 minutes", time: "2026-01-23 23:09:27" },
    { ip: "116.62.147.32", country: "China", apps: "https://demo.maf.chaitin.com:10085/", count: 14, duration: "1 minutes", time: "2026-01-23 23:09:10" },
];

const mockLogs = [
    { url: "https://demo.maf.chaitin.com/", type: "Deny Rule", ip: "116.62.147.32", country: "China", time: "2026-01-23 23:09:54" },
    { url: "http://47.242.104.253/.svn/entries", type: "Deny Rule", ip: "116.62.147.32", country: "China", time: "2026-01-23 23:09:53" },
    { url: "http://47.242.104.253/", type: "Deny Rule", ip: "116.62.147.32", country: "China", time: "2026-01-23 23:09:53" },
];

export default function AllowDenyPage() {
    const [view, setView] = useState<"EVENTS" | "LOGS">("EVENTS");
    const [data, setData] = useState<any[]>([]);

    // Pagination & Filter State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<any>({});

    const [selectedApp, setSelectedApp] = useState<string | null>(null);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                let url = "";
                const params = new URLSearchParams();
                params.set("page", page.toString());
                params.set("limit", "20");

                if (filters.search) params.set("search", filters.search);
                if (filters.from) params.set("from", filters.from);
                if (filters.to) params.set("to", filters.to);

                // Add app filter
                if (selectedApp) params.set("appId", selectedApp);

                if (view === "EVENTS") {
                    url = `/api/events?${params.toString()}`;
                } else {
                    url = `/api/logs?${params.toString()}`;
                }

                const res = await fetch(url);
                if (res.ok) {
                    const response = await res.json();

                    // Handle new response format { data, meta }
                    console.log("AllowDeny API Response:", response);
                    const rawData = response.data || response;
                    console.log("Raw Data:", rawData);
                    const meta = response.meta || { totalPages: 1 };

                    setTotalPages(meta.totalPages || 1);

                    if (view === "EVENTS") {
                        // ... existing code ...
                        const transformed = rawData.map((e: any) => ({
                            ip: e.ip,
                            country: "Unknown",
                            apps: "demo.maf.chaitin.com",
                            count: 1,
                            duration: "0 minutes",
                            time: formatLocalTime(e.time || e.createdAt)
                        }));
                        setData(transformed);
                    } else {
                        const transformed = rawData.map((l: any) => ({
                            id: l.id || l._id,
                            url: l.uri,
                            method: l.method,
                            type: l.attackType || (l.status >= 400 ? "Deny Rule" : "Allow Rule"),
                            action: l.status >= 400 ? "BLOCKED" : "ALLOWED",
                            analysis: l.aiAnalysis,
                            ip: l.ip,
                            country: "Unknown",
                            time: formatLocalTime(l.time || l.createdAt)
                        }));
                        setData(transformed);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch allow/deny data", e);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [view, page, filters, selectedApp]); // Re-fetch when these change

    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters);
        setPage(1); // Reset to page 1 on filter change
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <SecurityFilters
                view={view}
                onViewChange={setView}
                pageType="ALLOW_DENY"
                onFilterChange={handleFilterChange}
                selectedAppId={selectedApp}
                onAppChange={(id) => {
                    setSelectedApp(id);
                    setPage(1);
                }}
            />
            <SecurityTable
                view={view}
                data={data}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}
