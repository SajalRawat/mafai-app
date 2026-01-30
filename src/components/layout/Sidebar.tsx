"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart2,
    Globe,
    ShieldAlert,
    ShieldCheck,
    Zap,
    Lock,
    Search,
    Settings,
    HelpCircle,
    FileText,
    Home,
    MessageCircle,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
    { name: "Statistics", icon: BarChart2, href: "/statistics" },
    { name: "Applications", icon: Globe, href: "/applications" },
    { name: "Attacks", icon: ShieldAlert, href: "/attacks" },
    { name: "Allow & Deny", icon: ShieldCheck, href: "/allow-deny" },
    { name: "Policy", icon: Lock, href: "/policy" },
    { name: "Settings", icon: Settings, href: "/settings" },
];

const footerItems = [
    { name: "Homepage", icon: Home, href: "/" },
    { name: "Get Support", icon: HelpCircle, href: "/support" },
    { name: "Documentation", icon: FileText, href: "/docs" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-screen overflow-hidden">
            <div className="h-16 flex items-center px-6 gap-3 flex-shrink-0 bg-white border-b border-slate-100">
                <div className="w-8 h-8 flex items-center justify-center">
                    <img src="/eaglelogoBlack.svg" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-slate-800 font-bold text-lg tracking-tight">MAF</span>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <div className="px-3 mb-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all mb-1 group",
                                    isActive
                                        ? "bg-teal-400 text-white shadow-md shadow-teal-400/20"
                                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-5 h-5 shrink-0",
                                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                                )} />
                                <span className="flex-1">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-auto pt-8 border-t border-slate-200 px-3">
                    <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Version 9.3.2</p>
                    {footerItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <item.icon className="w-4 h-4 text-slate-400" />
                            {item.name}
                        </Link>
                    ))}
                </div>
            </nav>
        </div>
    );
}
