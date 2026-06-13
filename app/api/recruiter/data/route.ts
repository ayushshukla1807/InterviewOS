import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db/mongoose';
import User from '../../../../lib/db/models/User';
import SimulationReport from '../../../../lib/db/models/SimulationReport';
import * as jose from 'jose';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Extract recruiterId from token
    const token = req.cookies?.get?.('interviewos_token')?.value;
    let query: any = {};
    let isFounder = false;

    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'interviewos_secret_2026');
        const { payload } = await jose.jwtVerify(token, secret);
        if (payload.role === 'recruiter') {
          query.recruiterId = payload.id;
        } else if (payload.role === 'founder') {
          isFounder = true;
        } else {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      } catch (e) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      // In case cookies are not parsed in standard Request, NextRequest is better
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all users (login/signup data) - Maybe restrict this to founder? Or let recruiters see users?
    // Let's restrict users to founder, or just candidates. For now let's keep it as is.
    const users = isFounder ? await User.find({}).sort({ createdAt: -1 }).select('-password -__v').lean() : [];
    
    // Fetch all completed simulation reports
    const reports = await SimulationReport.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ users, reports }, { status: 200 });
  } catch (error: any) {
    console.error('Recruiter Data Fetch Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}
