import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db/mongoose';
import User from '../../../../lib/db/models/User';

export async function GET(req: Request) {
  try {
    await connectDB();
    const leaderboard = await User.find({ role: 'candidate' })
      .select('name email xp level streak badges')
      .sort({ xp: -1 })
      .limit(10);

    return NextResponse.json({ leaderboard });
  } catch (error: any) {
    console.error('Error in gamification leaderboard route:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
