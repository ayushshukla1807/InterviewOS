import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db/mongoose';
import User from '../../../../lib/db/models/User';
import SimulationReport from '../../../../lib/db/models/SimulationReport';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    // Fetch all users (login/signup data)
    const users = await User.find({}).sort({ createdAt: -1 }).select('-password -__v').lean();
    
    // Fetch all completed simulation reports
    const reports = await SimulationReport.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ users, reports }, { status: 200 });
  } catch (error: any) {
    console.error('Recruiter Data Fetch Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}
