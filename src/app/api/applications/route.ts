import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Application from '@/lib/models/Application';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';

export async function GET() {
    await dbConnect();

    try {
        const apps = await Application.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ data: apps });
    } catch (error) {
        logger.error('Failed to fetch applications', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch applications' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Application Name is required' }, { status: 400 });
        }

        // Auto-generate token
        const token = `maf_sk_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;

        const app = await Application.create({
            name: name.trim(),
            token,
            defenseMode: 'DEFENSE',
            aiModel: 'mistral'
        });

        logger.info('Application created successfully', { id: app._id, name: app.name });
        await redis.publish('maf-config-reload', 'created');

        return NextResponse.json({ success: true, data: app }, { status: 201 });
    } catch (error) {
        logger.error('Failed to create application', error);
        return NextResponse.json({ success: false, error: 'Failed to create application' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        logger.info('PUT /api/applications received', { id, updateData });

        if (!id) {
            logger.error('Missing Application ID');
            return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 });
        }

        const app = await Application.findByIdAndUpdate(id, updateData, { new: true });

        if (!app) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }

        logger.info('Application updated successfully', { id: app._id });
        await redis.publish('maf-config-reload', 'updated'); // Notify Engine

        return NextResponse.json({ success: true, data: app });
    } catch (error) {
        logger.error('Failed to update application', error);
        return NextResponse.json({ success: false, error: 'Failed to update application' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 });
        }

        const app = await Application.findByIdAndDelete(id);

        if (!app) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }

        logger.info('Application deleted successfully', { id });
        await redis.publish('maf-config-reload', 'deleted'); // Notify Engine

        return NextResponse.json({ success: true, message: 'Application deleted successfully' });
    } catch (error) {
        logger.error('Failed to delete application', error);
        return NextResponse.json({ success: false, error: 'Failed to delete application' }, { status: 500 });
    }
}
