import mongoose, { Schema, Model } from 'mongoose';

export interface ISimulationReport {
  _id: string;
  userId?: string; // Optional because anonymous users might take a test
  candidateName: string;
  sessionId: string;
  role: string;
  company: string;
  score: number;
  fullReportData: any; // The HyrteSkillScore object
  runtimeSummary: string;
  phaseCompletedAt: string; // The phase they reached (e.g. 'recovery', 'chaos', 'workspace')
  createdAt: Date;
}

const SimulationReportSchema = new Schema<ISimulationReport>({
  userId: { type: String, ref: 'User' },
  candidateName: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  company: { type: String, required: true },
  score: { type: Number, required: true },
  fullReportData: { type: Schema.Types.Mixed, required: true },
  runtimeSummary: { type: String, required: true },
  phaseCompletedAt: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const SimulationReport: Model<ISimulationReport> = mongoose.models.SimulationReport ?? mongoose.model<ISimulationReport>('SimulationReport', SimulationReportSchema);
export default SimulationReport;
