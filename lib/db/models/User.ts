import mongoose, { Schema, Model } from 'mongoose';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'candidate' | 'recruiter' | 'founder';
  organization: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:     { type: String, required: true },
  role:         { type: String, enum: ['candidate', 'recruiter', 'founder'], default: 'candidate' },
  organization: { type: String, default: '' },
  createdAt:    { type: Date, default: Date.now },
});

const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
export default User;
