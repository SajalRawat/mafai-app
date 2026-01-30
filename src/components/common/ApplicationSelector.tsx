import React, { useEffect, useState } from 'react';
import { ChevronDown, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Application {
    _id: string;
    name: string;
}

interface ApplicationSelectorProps {
    selectedAppId: string | null;
    onChange: (appId: string | null) => void;
}

export function ApplicationSelector({ selectedAppId, onChange }: ApplicationSelectorProps) {
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const res = await fetch('/api/applications');
                if (res.ok) {
                    const data = await res.json();
                    setApps(data.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch applications", error);
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, []);

    return (
        <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <select
                    value={selectedAppId || ""}
                    onChange={(e) => onChange(e.target.value || null)}
                    className="bg-transparent text-xs font-bold text-slate-600 outline-none min-w-[140px] appearance-none cursor-pointer uppercase tracking-wide"
                    disabled={loading}
                >
                    <option value="">All Applications</option>
                    {apps.map((app) => (
                        <option key={app._id} value={app._id}>
                            {app.name}
                        </option>
                    ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
        </div>
    );
}
