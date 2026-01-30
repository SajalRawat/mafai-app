import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/lib/models/Event';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const search = searchParams.get('search');
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // Build filter
        const filter: any = {};
        if (action) {
            filter.action = action;
        }

        // Search (Fields in Event model, usually ip, app, etc.)
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            filter.$or = [
                { ip: searchRegex },
                { 'details.uri': searchRegex }, // Assuming details might have URI or similar
                { type: searchRegex }
            ];
        }

        // Time Filter
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = from;
            if (to) filter.createdAt.$lte = to;
        }

        const total = await Event.countDocuments(filter);
        const events = await Event.find(filter)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);

        return NextResponse.json({
            data: events,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Failed to fetch events', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        logger.info('Received new event', { body });

        const event = await Event.create(body);

        // Invalidate cache
        await redis.del('maf:events:recent');
        logger.info('Event created and cache invalidated');

        return NextResponse.json({ success: true, data: event }, { status: 201 });
    } catch (error) {
        logger.error('Failed to create event', error);
        return NextResponse.json({ success: false, error: 'Failed to create event' }, { status: 400 });
    }
}
