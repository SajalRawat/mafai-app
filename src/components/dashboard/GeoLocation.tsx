"use client";

import React, { useState } from "react";
import { MAFGlobe } from "./MAFGlobe";
import { WorldMap2D } from "./WorldMap2D";
import { cn } from "@/lib/utils";

import { motion } from "framer-motion";

const requestsData: any[] = [];
const blockedData: any[] = [];

interface GeoLocationProps {
    data?: {
        requests: any[];
        blocked: any[];
    }
}

export function GeoLocation({ data }: GeoLocationProps) {
    const [view, setView] = useState<"3D" | "2D">("3D");
    const [statType, setStatType] = useState<"REQUESTS" | "BLOCKED">("REQUESTS");

    // Default to empty or prop data
    const requestsData = data?.requests || [];
    const blockedData = data?.blocked || [];

    const countries = statType === "REQUESTS" ? requestsData : blockedData;

    return (
        <div className="sl-card p-6 flex flex-col h-[480px] bg-white relative overflow-hidden">
            <div className="flex items-center justify-between mb-2 relative z-10 flex-shrink-0">
                <h3 className="text-slate-800 font-black text-sm">Geo Location</h3>
                <div className="flex gap-2">
                    {/* Animated 3D/2D Toggle */}
                    <div className="flex rounded-lg bg-slate-50 p-1 border border-slate-100 relative">
                        {(["3D", "2D"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setView(tab)}
                                className={cn(
                                    "px-3 py-1 rounded-md text-[10px] font-black transition-colors uppercase relative z-10 cursor-pointer",
                                    view === tab ? "text-white" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {view === tab && (
                                    <motion.div
                                        layoutId="view-toggle"
                                        className="absolute inset-0 bg-teal-500 rounded-md shadow-sm -z-10"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="flex rounded-lg bg-slate-50 p-1 border border-slate-100 relative">
                        {(["REQUESTS", "BLOCKED"] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setStatType(type)}
                                className={cn(
                                    "px-5 py-1 rounded-md text-[10px] font-black transition-colors uppercase relative z-10 cursor-pointer",
                                    statType === type ? "text-white" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {statType === type && (
                                    <motion.div
                                        layoutId="stat-toggle"
                                        className={cn(
                                            "absolute inset-0 rounded-md shadow-sm -z-10",
                                            type === "REQUESTS" ? "bg-teal-500" : "bg-teal-600"
                                        )}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 items-center relative min-h-0 px-4">
                {/* Visual View (3D or 2D) */}
                <div className="w-full h-full lg:w-[60%] flex-shrink-0 relative">
                    {view === "3D" ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <MAFGlobe
                                highlightLat={35}
                                highlightLng={105}
                                highlightCountry={countries.length > 0 ? countries[0].name : ""}
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center animate-fade-in">
                            <WorldMap2D
                                highlightCountry={countries.length > 0 ? countries[0].name : ""}
                                data={countries}
                            />
                        </div>
                    )}
                </div>

                {/* Country List */}
                <div className="flex-1 w-full relative z-10">
                    <div className="bg-slate-50/50 rounded-xl p-6 space-y-5 border border-slate-100/30">
                        {countries.map((country) => (
                            <div key={country.name} className="space-y-2">
                                <div className="flex justify-between text-[12px] font-bold">
                                    <span className="text-slate-500 uppercase tracking-tight">{country.name}</span>
                                    <span className="text-slate-900">{country.value}</span>
                                </div>
                                <div className="h-[3px] w-full bg-slate-200/40 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-teal-400 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(45,212,191,0.5)]"
                                        style={{ width: `${country.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
