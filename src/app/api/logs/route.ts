import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Log from '@/lib/models/Log';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const filter: any = {};

        // Status Filter
        if (status) {
            const statuses = status.split(',').map(s => parseInt(s.trim()));
            filter.status = { $in: statuses };
        }

        // Search Filter (IP, Method, URI)
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            filter.$or = [
                { ip: searchRegex },
                { uri: searchRegex },
                { method: searchRegex }
            ];
        }

        // Time Filter
        if (from || to) {
            filter.time = {};
            if (from) filter.time.$gte = from; // Expect ISO string
            if (to) filter.time.$lte = to;     // Expect ISO string
        }

        const mongooseInstance = await dbConnect();
        console.log("[API DEBUG] DB Name:", mongooseInstance.connection.name);
        console.log("[API DEBUG] Filter:", JSON.stringify(filter, null, 2));

        const total = await Log.countDocuments(filter);
        console.log("[API DEBUG] Total Logs Found:", total);
        const logs = await Log.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Failed to fetch logs', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        logger.info('Received new log entry', { body });

        const log = await Log.create(body);

        // Invalidate cache
        await redis.del('maf:logs:recent');
        logger.info('Log created and cache invalidated');

        return NextResponse.json({ success: true, data: log }, { status: 201 });
    } catch (error) {
        logger.error('Failed to create log', error);
        return NextResponse.json({ success: false, error: 'Failed to create log' }, { status: 400 });
    }
}
