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
        const token = searchParams.get('token');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const filter: any = {};

        // Token Filter (Required in new architecture for scoping)
        if (token) {
            filter.token = token;
        }

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
            if (from) filter.time.$gte = from;
            if (to) filter.time.$lte = to;
        }

        const total = await Log.countDocuments(filter);
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

        if (!body.token) {
            return NextResponse.json({ success: false, error: 'Application token is required' }, { status: 400 });
        }

        const log = await Log.create(body);

        // Notify via Redis for real-time dashboard updates if listeners exist
        await redis.publish('maf-logs', JSON.stringify(log));

        return NextResponse.json({ success: true, data: log }, { status: 201 });
    } catch (error) {
        logger.error('Failed to create log', error);
        return NextResponse.json({ success: false, error: 'Failed to create log' }, { status: 400 });
    }
}
