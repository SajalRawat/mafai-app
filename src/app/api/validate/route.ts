import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Application from '@/lib/models/Application';

export async function POST(request: Request) {
    await dbConnect();

    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ valid: false }, { status: 400 });
        }

        const app = await Application.findOne({ token });

        if (!app) {
            return NextResponse.json({ valid: false }, { status: 404 });
        }

        return NextResponse.json({
            valid: true,
            appId: app._id,
            name: app.name,
            defenseMode: app.defenseMode,
            aiModel: app.aiModel,
            aiSystemPrompt: app.aiSystemPrompt
        });

    } catch (error) {
        console.error('Token validation failed', error);
        return NextResponse.json({ valid: false, error: 'Internal Error' }, { status: 500 });
    }
}
