import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  jobId: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
}

const JobSchema: Schema = new Schema({
  jobId: { type: String, required: true, unique: true },
  recruiterId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Job = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);

export default Job;
