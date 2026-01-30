"use client";

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip
} from "recharts";

const data = [
    { name: "SQL Injection", value: 45, color: "#FF5F5F" },
    { name: "XSS", value: 25, color: "#FFBD2E" },
    { name: "Path Traversal", value: 15, color: "#A371F7" },
    { name: "Bot Attack", value: 10, color: "#27C93F" },
    { name: "Other", value: 5, color: "#484F58" },
];

export function AttackDistribution() {
    return (
        <div className="bg-maf-card border border-maf-border p-6 rounded-2xl h-[400px] flex flex-col">
            <div className="mb-6">
                <h3 className="text-white font-semibold text-lg">Attack Distribution</h3>
                <p className="text-xs text-maf-text-secondary">Analysis by threat category</p>
            </div>

            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#161B22",
                                borderColor: "#30363D",
                                borderRadius: "12px",
                                fontSize: "12px",
                                color: "#F0F6FC"
                            }}
                            itemStyle={{ color: "#F0F6FC" }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => <span className="text-xs text-maf-text-secondary ml-1">{value}</span>}
                            iconType="circle"
                            iconSize={8}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
