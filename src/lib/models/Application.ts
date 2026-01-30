import mongoose from 'mongoose';

export interface IApplication extends mongoose.Document {
    name: string;
    domain: string;
    ports: { protocol: string; port: string }[];
    upstreams: string[];
    redirectStatus?: number;
    redirectUrl?: string;
    type: 'Reverse Proxy' | 'Static Files' | 'Redirect';
    defenseMode?: 'Defense' | 'Audited' | 'Offline';
    defenseStatus: boolean;
    loggingEnabled: boolean;
    aiModel?: string;
    aiSystemPrompt?: string;
    policyHistory?: {
        prompt: string;
        modelName: string;
        createdAt: Date;
    }[];
    createdAt: Date;
}

const ApplicationSchema = new mongoose.Schema<IApplication>({
    name: { type: String, required: true },
    domain: { type: String, required: true },
    ports: [{
        protocol: { type: String, required: true },
        port: { type: String, required: true }
    }],
    upstreams: [{ type: String }],
    redirectStatus: { type: Number },
    redirectUrl: { type: String },
    type: { type: String, required: true, enum: ['Reverse Proxy', 'Static Files', 'Redirect'] },
    defenseMode: { type: String, enum: ['Defense', 'Audited', 'Offline'], default: 'Defense' },
    defenseStatus: { type: Boolean, default: true }, // Deprecated
    loggingEnabled: { type: Boolean, default: true },
    aiModel: { type: String, default: 'mistral' },
    aiSystemPrompt: { type: String },
    policyHistory: [{
        prompt: String,
        modelName: String,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
