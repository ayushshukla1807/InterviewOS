import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>({
  userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token:        { type: String, required: true, index: true },
  userAgent:    { type: String, default: 'Unknown' },
  ipAddress:    { type: String, default: 'Unknown' },
  lastActiveAt: { type: Date, default: Date.now },
  createdAt:    { type: Date, default: Date.now },
});

const Session: Model<ISession> = mongoose.models.Session ?? mongoose.model<ISession>('Session', SessionSchema);
export default Session;
