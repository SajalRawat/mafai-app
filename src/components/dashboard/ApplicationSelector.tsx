
"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplicationSelectorProps {
    onAppSelect?: (appName: string) => void;
}

export function ApplicationSelector({ onAppSelect }: ApplicationSelectorProps) {
    const [appsOpen, setAppsOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState("All applications");
    const [apps, setApps] = useState<string[]>([]);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const res = await fetch('/api/applications');
                if (res.ok) {
                    const json = await res.json();
                    if (json.data) {
                        setApps(json.data.map((app: any) => app.name));
                    }
                }
            } catch (e) {
                console.error("Failed to fetch applications", e);
            }
        };

        fetchApps();
    }, []);

    const handleSelect = (app: string) => {
        setSelectedApp(app);
        setAppsOpen(false);
        if (onAppSelect) {
            onAppSelect(app);
        }
    };

    const appList = ["All applications", ...apps];

    return (
        <div className="relative">
            <button
                onClick={() => setAppsOpen(!appsOpen)}
                onBlur={() => setTimeout(() => setAppsOpen(false), 200)}
                className="flex items-center gap-6 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-black text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
            >
                {selectedApp} <ChevronDown className={cn("w-4 h-4 text-slate-300 transition-transform", appsOpen && "rotate-180")} />
            </button>

            {appsOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 p-1 z-50 animate-in fade-in slide-in-from-top-2 max-h-[300px] overflow-y-auto no-scrollbar">
                    {appList.map((app) => (
                        <button
                            key={app}
                            onClick={() => handleSelect(app)}
                            className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-teal-600 rounded-md transition-colors"
                        >
                            {app}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
