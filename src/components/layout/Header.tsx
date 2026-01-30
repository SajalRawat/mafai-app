"use client";

import { Power, ChevronRight } from "lucide-react";

export function Header() {
    return (
        <div className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-slate-800 font-bold text-sm whitespace-nowrap">MAF</span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <span className="text-slate-500 font-medium text-sm whitespace-nowrap">Statistics</span>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => alert("Logout clicked")}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
                >
                    <Power className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
