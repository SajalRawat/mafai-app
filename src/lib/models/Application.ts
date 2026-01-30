import mongoose from 'mongoose';

export interface IApplication extends mongoose.Document {
    name: string;
    token?: string;
    defenseMode?: 'Defense' | 'Audited' | 'Offline';
    defenseStatus: boolean; // Keeping for backward compat if needed, or remove? Plan said keep minimal. Let's keep distinct mode.
    loggingEnabled: boolean;
    aiModel?: string;
    aiSystemPrompt?: string;
    policyHistory?: {
        prompt: string;
        modelName: string;
        createdAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const ApplicationSchema = new mongoose.Schema<IApplication>({
    name: { type: String, required: true },
    token: { type: String, unique: true, index: true }, // Index for fast lookup
    defenseMode: { type: String, enum: ['Defense', 'Audited', 'Offline'], default: 'Defense' },
    defenseStatus: { type: Boolean, default: true },
    loggingEnabled: { type: Boolean, default: true },
    aiModel: { type: String, default: 'mistral' },
    aiSystemPrompt: { type: String },
    policyHistory: [{
        prompt: String,
        modelName: String,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
ApplicationSchema.pre('save', function (this: IApplication, next: any) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
