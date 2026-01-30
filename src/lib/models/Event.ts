import mongoose from 'mongoose';

export interface IEvent extends mongoose.Document {
    id: string; // Friendly ID like EV-9021
    time: string;
    ip: string;
    type: string;
    action: 'Blocked' | 'Passed' | 'Audited' | 'Challenged';
    severity: 'High' | 'Medium' | 'Low';
    createdAt: Date;
}

const EventSchema = new mongoose.Schema<IEvent>({
    id: { type: String, required: true, unique: true },
    time: { type: String, required: true },
    ip: { type: String, required: true },
    type: { type: String, required: true },
    action: { type: String, required: true, enum: ['Blocked', 'Passed', 'Audited', 'Challenged'] },
    severity: { type: String, required: true, enum: ['High', 'Medium', 'Low'] },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
