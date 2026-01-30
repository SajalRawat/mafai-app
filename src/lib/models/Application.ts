import mongoose from 'mongoose';

export interface IApplication extends mongoose.Document {
    name: string;
    token: string;
    defenseMode: 'DEFENSE' | 'AUDITED' | 'OFFLINE';
    aiModel?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ApplicationSchema = new mongoose.Schema<IApplication>({
    name: { type: String, required: true },
    token: { type: String, required: true, unique: true, index: true },
    defenseMode: {
        type: String,
        enum: ['DEFENSE', 'AUDITED', 'OFFLINE'],
        default: 'DEFENSE'
    },
    aiModel: { type: String, default: 'mistral' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
