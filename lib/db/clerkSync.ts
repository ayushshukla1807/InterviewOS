import { connectDB } from './mongoose';
import User from './models/User';

export async function getOrCreateMongoUser(clerkUserId: string, name: string, email: string, preferredRole: 'candidate' | 'recruiter' | 'founder' = 'candidate') {
  await connectDB();
  
  const normalizedEmail = email.toLowerCase().trim();
  
  let mongoUser = await User.findById(clerkUserId);
  if (!mongoUser) {
    // Check if a user with the same email exists to link them (useful if transitioning from custom JWT to Clerk)
    mongoUser = await User.findOne({ email: normalizedEmail });
    if (mongoUser) {
      // Migrate existing user to use Clerk ID
      const oldId = mongoUser._id;
      // We can't rename _id in MongoDB directly, so we delete and recreate, or update.
      // Re-create is safest:
      const userData = mongoUser.toObject();
      delete userData._id;
      await User.deleteOne({ _id: oldId });
      mongoUser = await User.create({
        ...userData,
        _id: clerkUserId,
        email: normalizedEmail,
        role: preferredRole,
      });
    } else {
      // Create new user record
      mongoUser = await User.create({
        _id: clerkUserId,
        name,
        email: normalizedEmail,
        password: 'clerk-managed-auth', // placeholder
        role: preferredRole,
        plan: 'free',
        xp: 0,
        level: 1,
        streak: 0,
        badges: [],
      });
    }
  } else if (mongoUser.role !== preferredRole && preferredRole !== 'candidate') {
    // If the user lands on recruiter or founder, promote their role if it was candidate
    if (mongoUser.role === 'candidate') {
      mongoUser.role = preferredRole;
      await mongoUser.save();
    }
  }
  
  return mongoUser;
}
