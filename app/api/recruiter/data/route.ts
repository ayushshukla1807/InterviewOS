import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db/mongoose';
import User from '../../../../lib/db/models/User';
import SimulationReport from '../../../../lib/db/models/SimulationReport';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getOrCreateMongoUser } from '../../../../lib/db/clerkSync';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const name = clerkUser.fullName || clerkUser.username || 'Recruiter';
    
    // Sync to MongoDB and ensure they have recruiter or founder role
    const mongoUser = await getOrCreateMongoUser(userId, name, email, 'recruiter');

    let query: any = {};
    let isFounder = mongoUser.role === 'founder';

    if (mongoUser.role === 'recruiter') {
      query.recruiterId = userId;
    } else if (mongoUser.role !== 'founder') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const users = isFounder ? await User.find({}).sort({ createdAt: -1 }).select('-password -__v').lean() : [];
    const reports = await SimulationReport.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ users, reports }, { status: 200 });
  } catch (error: any) {
    console.error('Recruiter Data Fetch Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}
