import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
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
    
    // Read the role selected during login/sign-up
    const cookieStore = await cookies();
    const preferredRoleCookie = cookieStore.get('preferred_role')?.value || 'candidate';
    const preferredRole = ['candidate', 'recruiter', 'founder'].includes(preferredRoleCookie)
      ? preferredRoleCookie
      : 'candidate';

    // Sync to MongoDB with the chosen role
    const mongoUser = await getOrCreateMongoUser(userId, name, email, preferredRole as any);

    return NextResponse.json({ user: mongoUser }, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ error: error.message || 'Auth check failed' }, { status: 500 });
  }
}
