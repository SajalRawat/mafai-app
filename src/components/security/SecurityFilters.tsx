/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
    search?: string;
    from?: string;
    to?: string;
}

interface SecurityFiltersProps {
    view: "EVENTS" | "LOGS";
    onViewChange: (view: "EVENTS" | "LOGS") => void;
    pageType: "ATTACKS" | "ALLOW_DENY";
    onFilterChange?: (filters: FilterState) => void;
}

export function SecurityFilters({ view, onViewChange, pageType, onFilterChange }: SecurityFiltersProps) {
    const [openPicker, setOpenPicker] = useState<"start" | "end" | null>(null);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Time states
    const [startTime, setStartTime] = useState({ h: "00", m: "00", s: "00" });
    const [endTime, setEndTime] = useState({ h: "00", m: "00", s: "00" });

    const pickerRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            handleApplyFilters();
        }, 800);
        return () => clearTimeout(timer);
    }, [search]);

    const handleApplyFilters = () => {
        if (!onFilterChange) return;

        const filters: FilterState = {
            search: search || undefined,
        };

        if (startDate) {
            filters.from = `${startDate}T${startTime.h}:${startTime.m}:${startTime.s}Z`;
        }
        if (endDate) {
            filters.to = `${endDate}T${endTime.h}:${endTime.m}:${endTime.s}Z`;
        }

        onFilterChange(filters);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setOpenPicker(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const days = [28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7];

    const DatePickerDropdown = () => {
        const isStart = openPicker === "start";
        const selectedDate = isStart ? startDate : endDate;
        const time = isStart ? startTime : endTime;
        const setTime = isStart ? setStartTime : setEndTime;
        const setDate = isStart ? setStartDate : setEndDate;

        const handleDateSelect = (day: number, isCurrentMonth: boolean) => {
            if (!isCurrentMonth) return;
            const dateStr = `2026-01-${day.toString().padStart(2, '0')}`;
            setDate(dateStr);
        };

        return (
            <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-slate-100 shadow-2xl rounded-xl p-4 w-[480px] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex gap-4">
                    {/* Calendar Side */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex gap-1">
                                <button className="p-1 hover:bg-slate-50 rounded text-slate-400"><ChevronsLeft className="w-4 h-4" /></button>
                                <button className="p-1 hover:bg-slate-50 rounded text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
                            </div>
                            <span className="text-xs font-bold text-slate-700">Jan 2026</span>
                            <div className="flex gap-1">
                                <button className="p-1 hover:bg-slate-50 rounded text-slate-400"><ChevronRight className="w-4 h-4" /></button>
                                <button className="p-1 hover:bg-slate-50 rounded text-slate-400"><ChevronsRight className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                                <span key={d} className="text-[10px] font-bold text-slate-400 uppercase">{d}</span>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {days.map((d, i) => {
                                const isCurrentMonth = i >= 4 && i <= 34;
                                const isSelected = selectedDate === `2026-01-${d.toString().padStart(2, '0')}` && isCurrentMonth;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleDateSelect(d, isCurrentMonth)}
                                        className={cn(
                                            "h-8 flex items-center justify-center text-xs font-bold rounded-md transition-all",
                                            isSelected ? "bg-teal-500 text-white shadow-sm" :
                                                d === 24 && isCurrentMonth ? "bg-teal-50 text-teal-500 ring-1 ring-teal-500/20" :
                                                    !isCurrentMonth ? "text-slate-300" : "text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        {d}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Time Selection Side */}
                    <div className="w-40 border-l border-slate-50 pl-4 flex gap-2 h-[260px]">
                        <div className="flex-1 overflow-y-auto no-scrollbar py-2 border-r border-slate-50">
                            {Array.from({ length: 24 }).map((_, i) => {
                                const val = i.toString().padStart(2, '0');
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setTime({ ...time, h: val })}
                                        className={cn("w-full py-1.5 text-[11px] font-bold text-center hover:bg-slate-50 rounded", time.h === val ? "text-teal-500 bg-teal-50/50" : "text-slate-600")}
                                    >
                                        {val}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar py-2 border-r border-slate-50">
                            {Array.from({ length: 60 }).map((_, i) => {
                                const val = i.toString().padStart(2, '0');
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setTime({ ...time, m: val })}
                                        className={cn("w-full py-1.5 text-[11px] font-bold text-center hover:bg-slate-50 rounded", time.m === val ? "text-teal-500 bg-teal-50/50" : "text-slate-600")}
                                    >
                                        {val}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                            {Array.from({ length: 60 }).map((_, i) => {
                                const val = i.toString().padStart(2, '0');
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setTime({ ...time, s: val })}
                                        className={cn("w-full py-1.5 text-[11px] font-bold text-center hover:bg-slate-50 rounded", time.s === val ? "text-teal-500 bg-teal-50/50" : "text-slate-600")}
                                    >
                                        {val}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isStart ? "Start At" : "End At"}</p>
                        <button className="text-teal-500 font-bold text-xs hover:underline" onClick={() => {
                            setDate(new Date().toISOString().split('T')[0]);
                            setOpenPicker(null);
                        }}>Now</button>
                    </div>
                    <button
                        className="px-6 py-1.5 bg-slate-50 border border-slate-200 text-slate-400 rounded-lg text-[11px] font-bold uppercase transition-all hover:bg-teal-500 hover:text-white hover:border-teal-500"
                        onClick={() => {
                            setOpenPicker(null);
                            handleApplyFilters();
                        }}
                    >
                        OK
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => onViewChange("EVENTS")}
                        className={cn(
                            "px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition-all",
                            view === "EVENTS" ? "bg-teal-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Events
                    </button>
                    <button
                        onClick={() => onViewChange("LOGS")}
                        className={cn(
                            "px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition-all",
                            view === "LOGS" ? "bg-teal-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Logs
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {pageType === "ATTACKS" ? (
                        <>
                            <button className="px-4 py-1.5 border border-teal-200 text-teal-500 rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-teal-50 transition-colors">
                                Semantic Analysis
                            </button>
                            <button className="px-4 py-1.5 border border-teal-200 text-teal-500 rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-teal-50 transition-colors">
                                Enhanced Rules
                            </button>
                        </>
                    ) : (
                        <button className="px-4 py-1.5 border border-teal-200 text-teal-500 rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-teal-50 transition-colors">
                            Custom Rules
                        </button>
                    )}
                </div>
            </div>

            {/* Simple Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="relative col-span-2">
                        <input
                            type="text"
                            placeholder="Search IP, Domain, or Type..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-500 transition-colors"
                        />
                    </div>

                    <div className="relative group" ref={openPicker === "start" ? pickerRef : null}>
                        <div
                            className={cn(
                                "w-full pl-3 pr-8 py-2 bg-slate-50 border rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-between",
                                openPicker === "start" ? "border-teal-500 bg-white ring-2 ring-teal-500/10" : "border-slate-200"
                            )}
                            onClick={() => setOpenPicker("start")}
                        >
                            <span className={openPicker === "start" || startDate ? "text-slate-500" : "text-slate-400"}>
                                {openPicker === "start" ? "YYYY-MM-DD HH:mm:ss" :
                                    startDate ? `${startDate} ${startTime.h}:${startTime.m}:${startTime.s}` : "Start At"}
                            </span>
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        {openPicker === "start" && <DatePickerDropdown />}
                    </div>
                    <div className="relative group" ref={openPicker === "end" ? pickerRef : null}>
                        <div
                            className={cn(
                                "w-full pl-3 pr-8 py-2 bg-slate-50 border rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-between",
                                openPicker === "end" ? "border-teal-500 bg-white ring-2 ring-teal-500/10" : "border-slate-200"
                            )}
                            onClick={() => setOpenPicker("end")}
                        >
                            <span className={openPicker === "end" || endDate ? "text-slate-500" : "text-slate-400"}>
                                {openPicker === "end" ? "YYYY-MM-DD HH:mm:ss" :
                                    endDate ? `${endDate} ${endTime.h}:${endTime.m}:${endTime.s}` : "End At"}
                            </span>
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        {openPicker === "end" && <DatePickerDropdown />}
                    </div>
                </div>

                <button
                    onClick={handleApplyFilters}
                    className="px-4 py-2 border border-teal-200 text-teal-500 rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-teal-50 transition-all flex items-center gap-2"
                >
                    Refresh
                </button>
            </div>
        </div>
    );
}
