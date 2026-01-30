"use client";

export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";
import {
  Users,
  Send,
  Activity,
  AlertTriangle,
  Info,
  ChevronDown,
  UserCheck,
  Zap,
  HelpCircle
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ApplicationSelector } from "@/components/dashboard/ApplicationSelector";

// Dynamic imports for chart components to avoid hydration/prerender issues
const GeoLocation = dynamicImport(() => import("@/components/dashboard/GeoLocation").then(mod => mod.GeoLocation), { ssr: false });
const VerticalCharts = dynamicImport(() => import("@/components/dashboard/VerticalCharts").then(mod => mod.VerticalCharts), { ssr: false });


const TrafficAnalysis = dynamicImport(() => import("@/components/dashboard/TrafficAnalysis").then(mod => mod.TrafficAnalysis), { ssr: false });
const SecurityPosture = dynamicImport(() => import("@/components/dashboard/SecurityPosture").then(mod => mod.SecurityPosture), { ssr: false });
const DataDashboard = dynamicImport(() => import("@/components/dashboard/DataDashboard").then(mod => mod.DataDashboard), { ssr: false });

const HumanIcon = (props: any) => (
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

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState("TRAFFIC ANALYSIS");
  const [timeOpen, setTimeOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState("All applications");
  const [selectedTime, setSelectedTime] = useState("24 hours");

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto bg-slate-50/30 min-h-screen">

      {/* Top Header Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex bg-white rounded-lg p-0.5 shadow-sm border border-slate-100">
          {["TRAFFIC ANALYSIS", "SECURITY POSTURE", "DATA DASHBOARD"].map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-md text-[11px] font-black transition-all flex items-center gap-1.5",
                activeTab === tab
                  ? "bg-teal-500 text-white shadow-md shadow-teal-100"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}>
              {tab}
              {i === 2 && <HelpCircle className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <ApplicationSelector onAppSelect={setSelectedApp} />
          </div>

          <div className="relative">
            <button
              onClick={() => setTimeOpen(!timeOpen)}
              onBlur={() => setTimeout(() => setTimeOpen(false), 200)}
              className="flex items-center gap-6 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-black text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
            >
              {selectedTime} <ChevronDown className={cn("w-4 h-4 text-slate-300 transition-transform", timeOpen && "rotate-180")} />
            </button>

            {timeOpen && (
              <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-slate-100 p-1 z-50 animate-in fade-in slide-in-from-top-2">
                {["1 hour", "24 hours", "7 days", "30 days"].map((time) => (
                  <button
                    key={time}
                    onClick={() => { setSelectedTime(time); setTimeOpen(false); }}
                    className="w-full text-left px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-teal-600 rounded-md transition-colors"
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Content */}
      <div className="min-h-[500px]">
        {activeTab === "TRAFFIC ANALYSIS" && <TrafficAnalysis />}
        {activeTab === "SECURITY POSTURE" && <SecurityPosture />}
        {activeTab === "DATA DASHBOARD" && <DataDashboard />}
      </div>
    </div>
  );
}
