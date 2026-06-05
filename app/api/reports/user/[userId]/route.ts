import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db/mongoose';
import SimulationReport from '../../../../../lib/db/models/SimulationReport';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectDB();

    // Fetch all reports for the given user ID
    const reports = await SimulationReport.find({ userId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ reports }, { status: 200 });
  } catch (error: any) {
    console.error('Candidate Reports Fetch Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch reports' }, { status: 500 });
  }
}
