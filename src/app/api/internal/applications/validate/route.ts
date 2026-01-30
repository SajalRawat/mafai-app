import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Application from '@/lib/models/Application';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ valid: false, error: 'Token missing' }, { status: 400 });
    }

    try {
        await dbConnect();
        const app = await Application.findOne({ token }).lean() as any;

        if (!app) {
            return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 404 });
        }

        return NextResponse.json({
            valid: true,
            name: app.name,
            defenseMode: app.defenseMode,
            aiModel: app.aiModel
        });
    } catch (error) {
        logger.error('Internal Validation Error', error);
        return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
    }
}
