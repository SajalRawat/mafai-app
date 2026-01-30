import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Log from '@/lib/models/Log';
import Event from '@/lib/models/Event';
import { logger } from '@/lib/logger';

const ONE_HOUR = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export const dynamic = 'force-dynamic';

export async function GET() {
    await dbConnect();

    try {
        const now = Date.now();
        const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
        const twentyFourHoursAgo = new Date(now - TWENTY_FOUR_HOURS);

        // 1. QPS (Last 5 minutes in 5-second intervals)
        const qpsStats = await Log.aggregate([
            { $match: { createdAt: { $gte: fiveMinutesAgo } } },
            {
                $group: {
                    _id: {
                        $subtract: [
                            { $toLong: "$createdAt" },
                            { $mod: [{ $toLong: "$createdAt" }, 5000] }
                        ]
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const qpsData = [];
        const endTime = now - (now % 5000);

        for (let i = 59; i >= 0; i--) {
            const time = endTime - (i * 5000);
            const found = qpsStats.find(s => s._id === time);
            const date = new Date(time);
            const timeStr = date.toTimeString().split(' ')[0];

            qpsData.push({
                name: timeStr,
                value: found ? Math.round((found.count / 5) * 100) / 100 : 0
            });
        }

        // 2 & 3. Request Status & Blocked Stats (Last 24h Buckets)
        const buckets = [];
        const nowTime = new Date();
        nowTime.setMinutes(0, 0, 0); // Align to hour

        for (let i = 23; i >= 0; i--) {
            const d = new Date(nowTime.getTime() - i * ONE_HOUR);
            buckets.push(d);
        }

        const requestsStats = await Log.aggregate([
            { $match: { createdAt: { $gte: twentyFourHoursAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" },
                        hour: { $hour: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // For Blocked, we assume status 403 in Log. 
        // If you strictly use Event model for blocked, replace Log with Event and adjust query.
        const blockedStats = await Log.aggregate([
            {
                $match: {
                    createdAt: { $gte: twentyFourHoursAgo },
                    status: 403
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" },
                        hour: { $hour: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStatusData = buckets.map(bucket => {
            const found = requestsStats.find(item =>
                item._id.year === bucket.getFullYear() &&
                item._id.month === (bucket.getMonth() + 1) &&
                item._id.day === bucket.getDate() &&
                item._id.hour === bucket.getHours()
            );
            return {
                time: bucket.toLocaleString('en-US', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                value: found ? found.count : 0
            };
        });

        const formattedBlockData = buckets.map(bucket => {
            const found = blockedStats.find(item =>
                item._id.year === bucket.getFullYear() &&
                item._id.month === (bucket.getMonth() + 1) &&
                item._id.day === bucket.getDate() &&
                item._id.hour === bucket.getHours()
            );
            return {
                time: bucket.toLocaleString('en-US', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                value: found ? found.count : 0
            };
        });

        return NextResponse.json({
            qps: qpsData,
            requests: formattedStatusData,
            blocked: formattedBlockData
        });

    } catch (error) {
        logger.error('Failed to fetch traffic stats', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch traffic stats' }, { status: 500 });
    }
}
