import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getOrCreateMongoUser } from '../../../../lib/db/clerkSync';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const name = clerkUser.fullName || clerkUser.username || 'Candidate';
    
    // Sync to MongoDB, default role candidate
    const mongoUser = await getOrCreateMongoUser(userId, name, email, 'candidate');

    return NextResponse.json({ user: mongoUser }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Auth check failed' }, { status: 500 });
  }
}
