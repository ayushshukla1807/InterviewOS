import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IResume extends Document {
  userId: string;
  rawText: string;
  parsedData: {
    skills: string[];
    experience: Array<{
      company: string;
      role: string;
      duration: string;
      description: string;
    }>;
    projects: Array<{
      name: string;
      description: string;
      technologies: string[];
    }>;
    education: Array<{
      institution: string;
      degree: string;
      year: string;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>({
  userId:     { type: String, required: true, unique: true, index: true },
  rawText:    { type: String, required: true },
  parsedData: {
    skills: [String],
    experience: [{
      company: String,
      role: String,
      duration: String,
      description: String
    }],
    projects: [{
      name: String,
      description: String,
      technologies: [String]
    }],
    education: [{
      institution: String,
      degree: String,
      year: String
    }]
  },
  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now }
});

ResumeSchema.pre('save', function (this: IResume, next: any) {
  this.updatedAt = new Date();
  next();
});

const Resume: Model<IResume> = mongoose.models.Resume ?? mongoose.model<IResume>('Resume', ResumeSchema);
export default Resume;
