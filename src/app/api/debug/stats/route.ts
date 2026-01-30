import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Log from '@/lib/models/Log';

export const dynamic = 'force-dynamic';

export async function GET() {
    await dbConnect();

    try {
        const count = await Log.countDocuments();
        const lastLogs = await Log.find().sort({ createdAt: -1 }).limit(5);

        // Test Aggregation
        const now = Date.now();
        const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
        const aggregation = await Log.aggregate([
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

        return NextResponse.json({
            count,
            lastLogs,
            aggregation,
            serverTime: new Date().toString(),
            mongoURI: process.env.MONGODB_URI
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
