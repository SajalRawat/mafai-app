"use client";

import React, { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const GEOJSON_URL = "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson";

interface WorldMap2DProps {
    highlightCountry?: string;
    data?: { name: string; value: string | number }[];
}

export function WorldMap2D({ highlightCountry, data = [] }: WorldMap2DProps) {
    const [countries, setCountries] = useState<any[]>([]);
    const [hoveredCountry, setHoveredCountry] = useState<{ name: string; x: number; y: number } | null>(null);

    useEffect(() => {
        fetch(GEOJSON_URL)
            .then((res) => res.json())
            .then((data) => setCountries(data.features))
            .catch((err) => console.error("Error loading GeoJSON for 2D map:", err));
    }, []);

    // Simple Mercator-like projection
    const project = (coords: number[][]) => {
        return coords.map((ring: any) =>
            ring.map(([lng, lat]: [number, number]) => {
                const x = (lng + 180) * (800 / 360);
                const y = (90 - lat) * (400 / 180);
                return `${x},${y}`;
            }).join(" ")
        ).join(" M ");
    };

    const getCountryValue = (name: string) => {
        const item = data.find(d => d.name === name);
        // Parse value if it has 'k' or similar, strict for now just returns the string
        return item ? item.value : 0;
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 relative group">
            <svg
                viewBox="0 0 800 400"
                className="w-full h-auto drop-shadow-sm"
                xmlns="http://www.w3.org/2000/svg"
                onMouseLeave={() => setHoveredCountry(null)}
            >
                <rect width="800" height="400" fill="transparent" />
                {countries.map((feature, i) => {
                    const properties = feature.properties;
                    // Try different property names for robustness
                    const name = properties.NAME || properties.ADMIN || properties.NAME_LONG;
                    const isHighlighted = highlightCountry && name === highlightCountry;
                    const isHovered = hoveredCountry?.name === name;

                    // Determine fill color
                    let fill = "#f0f9ff"; // Default light
                    let stroke = "#cbd5e1"; // Default stroke

                    if (isHighlighted) {
                        fill = "#14b8a6"; // Teal-500
                        stroke = "#0d9488"; // Teal-600
                    } else if (isHovered) {
                        fill = "#99f6e4"; // Teal-200 for hover
                        stroke = "#14b8a6";
                    }

                    return (
                        <path
                            key={i}
                            d={feature.geometry.type === "Polygon"
                                ? `M ${project(feature.geometry.coordinates)} Z`
                                : feature.geometry.coordinates.map((poly: any) => `M ${project(poly)} Z`).join(" ")
                            }
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={isHighlighted || isHovered ? "1" : "0.5"}
                            className="transition-colors duration-200 ease-in-out cursor-pointer"
                            onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                // We use client coordinates for the tooltip to be independent of SVG scaling
                                setHoveredCountry({ name, x: e.clientX, y: e.clientY });
                            }}
                        />
                    );
                })}
            </svg>

            {/* Tooltip */}
            {hoveredCountry && (
                <div
                    className="fixed z-50 bg-white p-3 rounded-md shadow-lg border border-slate-100 pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        left: hoveredCountry.x + 10,
                        top: hoveredCountry.y - 10
                    }}
                >
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-700">{hoveredCountry.name}</span>
                        <span className="text-xs text-slate-500">
                            Number of visits: <span className="font-bold text-slate-800">{getCountryValue(hoveredCountry.name)}</span>
                        </span>
                    </div>
                </div>
            )}

            {/* Gradient Legend Bar - Precisely matched to screenshot */}
            <div className="absolute bottom-6 left-6 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-teal-500 pl-0.5">43</span>
                <div className="w-32 h-3 rounded-full bg-gradient-to-r from-teal-50 to-teal-400 opacity-80 relative">
                    <div className="absolute left-[2px] top-[2px] w-2 h-2 rounded-full bg-white shadow-sm ring-1 ring-slate-200" />
                </div>
            </div>
        </div>
    );
}
