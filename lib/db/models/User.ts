import mongoose, { Schema, Model } from 'mongoose';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'candidate' | 'recruiter' | 'founder';
  organization: string;
  createdAt: Date;
  isEmailVerified: boolean;
  verificationToken?: string;
  plan: 'free' | 'pro';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  mfaEnabled?: boolean;
  mfaSecret?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  xp?: number;
  level?: number;
  streak?: number;
  lastActivityAt?: Date;
  badges?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: Date;
  }>;
}

const UserSchema = new Schema<IUser>({
  _id:          { type: String, required: true },
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:     { type: String, required: true },
  role:         { type: String, enum: ['candidate', 'recruiter', 'founder'], default: 'candidate' },
  organization: { type: String, default: '' },
  createdAt:    { type: Date, default: Date.now },
  isEmailVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  plan:         { type: String, enum: ['free', 'pro'], default: 'free' },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  mfaEnabled:   { type: Boolean, default: false },
  mfaSecret:    { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  xp:           { type: Number, default: 0 },
  level:        { type: Number, default: 1 },
  streak:       { type: Number, default: 0 },
  lastActivityAt: { type: Date, default: Date.now },
  badges:       { type: Schema.Types.Mixed, default: [] },
});

const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
export default User;
