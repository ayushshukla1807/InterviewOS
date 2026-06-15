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
          xp: 350,
          level: 2,
          streak: 3,
          badges: [
            {
              id: 'elite-performer',
              name: 'Elite Performer',
              description: 'Scored 90+ in an interview',
              icon: 'star',
              earnedAt: new Date()
            }
          ]
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
        xp: user.xp || 0,
        level: user.level || 1,
        streak: user.streak || 0,
        badges: user.badges || [],
      }
    });

  } catch {
    return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
  }
}
