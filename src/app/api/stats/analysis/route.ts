import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Log from '@/lib/models/Log';
import SecurityEvent from '@/lib/models/Event';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
    await dbConnect();

    try {
        // 1. Response Status Distribution
        const statusDist = await Log.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        const responseStatusData = statusDist.map(s => ({
            name: s._id.toString(),
            value: s.count,
            color: s._id >= 500 ? "#f43f5e" : s._id >= 400 ? "#f59e0b" : "#2dd4bf"
        }));

        // 2. Top User Clients (User Agent)
        // Simplified: Just grouping by raw string. Ideally parse UA.
        const uaDist = await Log.aggregate([
            { $group: { _id: "$userAgent", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const userClientsData = uaDist.map((u, i) => ({
            name: u._id ? (u._id.length > 15 ? u._id.substring(0, 15) + '...' : u._id) : 'Unknown',
            value: u.count,
            color: ["#2dd4bf", "#f59e0b", "#14b8a6", "#6366f1", "#f43f5e"][i % 5]
        }));

        // 3. Top IPs
        const ipDist = await Log.aggregate([
            { $group: { _id: "$ip", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const popularAppData = ipDist.map(ip => ({
            label: ip._id,
            value: ip.count,
            percent: 0 // Calculate relative to total later if needed
        }));

        // 4. Top URLs (Pages)
        const urlDist = await Log.aggregate([
            { $group: { _id: "$uri", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const popularPageData = urlDist.map(u => ({
            label: u._id,
            value: u.count,
            percent: 0
        }));

        // 5. Summary Stats
        const totalRequests = await Log.countDocuments();
        const uniqueVisitorsResult = await Log.aggregate([
            { $group: { _id: "$ip" } },
            { $count: "count" }
        ]);
        const uniqueVisitors = uniqueVisitorsResult.length > 0 ? uniqueVisitorsResult[0].count : 0;

        // Blocked Count (from Events)
        const blockedCount = await SecurityEvent.countDocuments({ action: "Blocked" });
        const attackingIpsResult = await SecurityEvent.aggregate([
            { $match: { action: "Blocked" } },
            { $group: { _id: "$ip" } },
            { $count: "count" }
        ]);
        const attackingIps = attackingIpsResult.length > 0 ? attackingIpsResult[0].count : 0;

        const error4xx = await Log.countDocuments({ status: { $gte: 400, $lt: 500 } });
        const error5xx = await Log.countDocuments({ status: { $gte: 500 } });

        // 6. Geo Stats
        const geoRequests = await Log.aggregate([
            { $group: { _id: "$country", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 7 }
        ]);
        const geoBlocked = await SecurityEvent.aggregate([
            { $match: { action: "Blocked" } },
            { $group: { _id: "$country", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 7 }
        ]);

        const formatGeo = (data: any[]) => {
            const merged = new Map<string, number>();

            data.forEach(d => {
                const name = (d._id && d._id !== 'Unknown' && d._id !== 'UNKNOWN') ? d._id : "Unknown";
                merged.set(name, (merged.get(name) || 0) + d.count);
            });

            // Convert back to array and sort
            return Array.from(merged.entries())
                .map(([name, count]) => ({
                    name,
                    value: count.toString(),
                    percent: totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0
                }))
                .sort((a, b) => parseInt(b.value) - parseInt(a.value));
        };

        return NextResponse.json({
            summary: {
                requests: totalRequests,
                pv: totalRequests,
                uv: uniqueVisitors,
                uniqueIp: uniqueVisitors,
                blocked: blockedCount,
                ipAddr: attackingIps,
                error4xx,
                error5xx
            },
            geo: {
                requests: formatGeo(geoRequests),
                blocked: formatGeo(geoBlocked)
            },
            responseStatus: responseStatusData,
            userClients: userClientsData,
            popularApp: popularAppData,
            popularPage: popularPageData
        });
    } catch (error) {
        logger.error('Failed to fetch analysis stats', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch analysis stats' }, { status: 500 });
    }
}
