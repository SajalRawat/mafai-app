import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Log from '@/lib/models/Log';
import SecurityEvent from '@/lib/models/Event';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        // 1. KPIs
        const totalAttacks = await SecurityEvent.countDocuments();
        const totalRequests = await Log.countDocuments();
        const rateLimitCount = await Log.countDocuments({ status: 429 });
        const antiBotCount = await SecurityEvent.countDocuments({ type: "Anti-Bot" });

        // 2. Trends (Last 24 hours - Simplified for demo, aggregating all time by hour for now logic)
        // In production, match createdAt: { $gte: 24h_ago }
        const attacksTrendRaw = await SecurityEvent.aggregate([
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const trafficTrendRaw = await Log.aggregate([
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Format trends for Recharts (0-23 hours)
        const formatTrend = (data: any[]) => {
            const map = new Map(data.map(d => [d._id, d.count]));
            return Array.from({ length: 24 }).map((_, i) => ({
                name: `${i}:00`,
                value: map.get(i) || 0
            }));
        };

        const attacksTrend = formatTrend(attacksTrendRaw);
        const allowDenyTrend = formatTrend(trafficTrendRaw); // Using total traffic as proxy for allow/deny trend

        // 3. Real-time Events
        const recentEvents = await SecurityEvent.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('type id time createdAt action'); // Select fields needed

        // 4. Web Attack Types
        const webAttackRaw = await SecurityEvent.aggregate([
            { $group: { _id: "$type", count: { $sum: 1 } } },
            { $limit: 5 }
        ]);
        const webAttackData = webAttackRaw.map(d => ({
            name: d._id,
            value: d.count
        }));

        // 5. Attacked Pages (Logs with 403/429)
        const attackedPagesRaw = await Log.aggregate([
            { $match: { status: { $in: [403, 429] } } },
            { $group: { _id: "$uri", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const attackedPages = attackedPagesRaw.map(d => ({
            path: d._id,
            count: d.count
        }));

        // 6. Top IPs (Attackers)
        const topIPsRaw = await SecurityEvent.aggregate([
            { $group: { _id: "$ip", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        const topIPs = topIPsRaw.map(d => ({
            ip: d._id,
            count: d.count
        }));

        return NextResponse.json({
            kpi: {
                attacks: totalAttacks,
                allowDeny: totalRequests,
                rateLimit: rateLimitCount,
                waitingRoom: 0, // Mock
                antiBot: antiBotCount,
                auth: 0 // Mock
            },
            trends: {
                attacks: attacksTrend,
                allowDeny: allowDenyTrend
            },
            realtimeEvents: recentEvents.map(e => ({
                type: e.type,
                title: e.id, // Using friendly ID as title
                time: e.time // Using string time stored
            })),
            charts: {
                webAttack: webAttackData,
                ruleHit: [], // Mock empty for now
                attackedPages,
                topIPs
            }
        });

    } catch (error) {
        logger.error('Failed to fetch security stats', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch security stats' }, { status: 500 });
    }
}
