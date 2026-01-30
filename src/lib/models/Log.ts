import mongoose from 'mongoose';

export interface ILog extends mongoose.Document {
    id: string;
    token: string;
    time: string;
    ip: string;
    method: string;
    uri: string;
    status: number;
    size: string;
    userAgent?: string;
    referer?: string;
    country?: string;
    attackType?: string;
    aiAnalysis?: string;
    createdAt: Date;
}

const LogSchema = new mongoose.Schema<ILog>({
    id: { type: String, required: true, unique: true },
    token: { type: String, required: true, index: true },
    time: { type: String, required: true },
    ip: { type: String, required: true },
    method: { type: String, required: true },
    uri: { type: String, required: true },
    status: { type: Number, required: true },
    size: { type: String, required: true },
    userAgent: { type: String },
    referer: { type: String },
    country: { type: String },
    attackType: { type: String },
    aiAnalysis: { type: String },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Log || mongoose.model<ILog>('Log', LogSchema);
