import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db/mongoose';
import User from '../../../../lib/db/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'interviewos_secret_2026';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'No token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    if (decoded.id === 'demo_candidate_id' || decoded.id === 'demo_recruiter_id' || decoded.id === 'demo_founder_id') {
      const isCandidate = decoded.id === 'demo_candidate_id';
      const isRecruiter = decoded.id === 'demo_recruiter_id';
      const isFounder = decoded.id === 'demo_founder_id';
      
      let role = 'candidate';
      let name = 'Demo Candidate';
      let email = 'demo.candidate@interviewos.com';
      let org = '';

      if (isRecruiter) {
        role = 'recruiter';
        name = 'Demo Recruiter';
        email = 'demo.recruiter@interviewos.com';
        org = 'Demo Org';
      } else if (isFounder) {
        role = 'founder';
        name = 'Founder Admin';
        email = 'founder@interviewos.com';
        org = 'InterviewOS Core';
      }

      return NextResponse.json({
        user: {
          id: decoded.id,
          name,
          email,
          role,
          organization: org,
        }
      });
    }

    await connectDB();
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
      }
    });

  } catch {
    return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
  }
}
