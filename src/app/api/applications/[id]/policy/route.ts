import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Application from '@/lib/models/Application';
import { logger } from '@/lib/logger';
import { createCustomModel } from '@/lib/ollama';
import { redis } from '@/lib/redis';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;

    try {
        const body = await request.json();
        const { systemPrompt } = body;

        logger.info(`Updating AI Policy for app ${id}`, { systemPrompt });

        if (!systemPrompt || typeof systemPrompt !== 'string') {
            return NextResponse.json({ success: false, error: 'System prompt is required' }, { status: 400 });
        }

        const app = await Application.findById(id);
        if (!app) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }

        // Generate a unique model name
        const timestamp = Date.now();
        const modelName = `maf-custom-${app._id}-${timestamp}`;

        // Create the model using Ollama
        await createCustomModel(modelName, systemPrompt);

        // Update Application
        app.aiModel = modelName;
        app.aiSystemPrompt = systemPrompt;

        // Add to history
        if (!app.policyHistory) app.policyHistory = [];
        app.policyHistory.unshift({
            prompt: systemPrompt,
            modelName: modelName,
            createdAt: new Date()
        });

        await app.save();

        logger.info(`AI Policy updated for app ${id}. New model: ${modelName}`);

        // Notify Engine to reload config
        await redis.publish('maf-config-reload', 'policy-update');

        return NextResponse.json({ success: true, data: app });

    } catch (error) {
        logger.error('Failed to update AI policy', error);
        return NextResponse.json({ success: false, error: 'Failed to update AI policy' }, { status: 500 });
    }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;

    try {
        const app = await Application.findById(id);
        if (!app) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                aiModel: app.aiModel,
                aiSystemPrompt: app.aiSystemPrompt,
                policyHistory: app.policyHistory || []
            }
        });

    } catch (error) {
        logger.error('Failed to fetch AI policy', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch AI policy' }, { status: 500 });
    }
}
