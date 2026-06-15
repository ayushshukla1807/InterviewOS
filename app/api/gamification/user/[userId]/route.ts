import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db/mongoose';
import User from '../../../../../lib/db/models/User';

export async function GET(req: Request, context: { params: any }) {
  try {
    const { userId } = await context.params;
    await connectDB();

    if (userId === 'demo_candidate_id') {
      return NextResponse.json({
        user: {
          name: 'Demo Candidate',
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

    const user = await User.findById(userId).select('name xp level streak badges');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Error fetching public user details:', error);
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
  }
}
