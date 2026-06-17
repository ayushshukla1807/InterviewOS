import { connectDB } from './mongoose';
import User from './models/User';

export async function getOrCreateMongoUser(clerkUserId: string, name: string, email: string, preferredRole: 'candidate' | 'recruiter' | 'founder' = 'candidate') {
  await connectDB();
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // Strict check: Only founder@interviewos.com is allowed the founder role
  let roleToUse = preferredRole;
  if (roleToUse === 'founder' && normalizedEmail !== 'founder@interviewos.com') {
    roleToUse = 'candidate';
  }
  
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
        role: roleToUse,
      });
    } else {
      // Create new user record
      mongoUser = await User.create({
        _id: clerkUserId,
        name,
        email: normalizedEmail,
        password: 'clerk-managed-auth', // placeholder
        role: roleToUse,
        plan: 'free',
        xp: 0,
        level: 1,
        streak: 0,
        badges: [],
      });
    }
  } else {
    // Check if we need to promote/update role
    let targetRole = mongoUser.role;
    
    if (roleToUse !== 'candidate' && mongoUser.role === 'candidate') {
      targetRole = roleToUse;
    }
    
    // Safety check on existing user role modification
    if (targetRole === 'founder' && normalizedEmail !== 'founder@interviewos.com') {
      targetRole = 'candidate';
    }
    
    if (mongoUser.role !== targetRole) {
      mongoUser.role = targetRole;
      await mongoUser.save();
    }
  }
  
  return mongoUser;
}
