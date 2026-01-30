"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import * as THREE from "three";
import dynamic from "next/dynamic";

// Dynamic import for react-globe.gl to avoid SSR issues
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const GEOJSON_URL = "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson";

export function MAFGlobe(props?: any) {
    const { highlightLat = 35, highlightLng = 105, highlightCountry = "China" } = props || {};
    const globeRef = useRef<any>(null);
    const [countries, setCountries] = useState<any[]>([]);

    useEffect(() => {
        fetch(GEOJSON_URL)
            .then((res) => res.json())
            .then((data) => {
                setCountries(data.features);
            })
            .catch(err => console.error("Error loading GeoJSON:", err));
    }, []);

    // Memoize the hexagon data to prevent unnecessary re-calculations
    const hexData = useMemo(() => countries, [countries]);

    const onGlobeReady = () => {
        if (globeRef.current) {
            const controls = globeRef.current.controls();
            controls.autoRotate = true;
            controls.autoRotateSpeed = 2.0; // Slightly slower for better perception of smoothness
            controls.enableZoom = false;
            controls.enablePan = false;
            controls.enableRotate = true;

            // Lock zoom at a precise level
            controls.minDistance = 330;
            controls.maxDistance = 330;

            globeRef.current.pointOfView({ lat: highlightLat, lng: highlightLng, altitude: 2.2 });
        }
    };

    return (
        <div className="w-full h-full relative flex items-center justify-center overflow-visible">
            {/* Official Background Image Integration */}
            <div
                className="absolute w-[400px] h-[400px] bg-contain bg-center bg-no-repeat pointer-events-none z-0 opacity-100"
                style={{ backgroundImage: "url('/globel_bg.png')" }}
            />

            <div className="relative z-10 translate-y-2">
                <Globe
                    ref={globeRef}
                    width={420}
                    height={420}
                    backgroundColor="rgba(0,0,0,0)"
                    showAtmosphere={false}
                    onGlobeReady={onGlobeReady}

                    // Optimized Hexagon mesh for continents
                    hexPolygonsData={hexData}
                    hexPolygonResolution={3} // Reduced from 5 to 3 for significant performance boost
                    hexPolygonMargin={0.15} // Adjusted for resolution 3
                    hexPolygonColor={(d: any) => {
                        const properties = d.properties;
                        const name = properties.NAME || properties.ADMIN || properties.NAME_LONG;
                        // Optimized color check
                        if (!highlightCountry) return "#2dd4bf";
                        return (name === highlightCountry || (highlightCountry === "China" && properties.ISO_A3 === "CHN"))
                            ? "#065f46" // Dark teal-800
                            : "#2dd4bf"; // Vibrant teal-400
                    }}
                    hexPolygonAltitude={0.01}

                    // Transparent base
                    globeMaterial={new THREE.MeshBasicMaterial({ color: "#fff", transparent: true, opacity: 0 })}
                />
            </div>
        </div>
    );
}
