import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db/mongoose';
import SimulationReport from '../../../../lib/db/models/SimulationReport';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { userId, candidateName, sessionId, role, company, score, fullReportData, runtimeSummary, phaseCompletedAt } = await req.json();

    if (!sessionId || !role || !company || score === undefined || !fullReportData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const report = new SimulationReport({
      userId,
      candidateName: candidateName || 'Anonymous',
      sessionId,
      role,
      company,
      score,
      fullReportData,
      runtimeSummary,
      phaseCompletedAt,
    });

    await report.save();

    return NextResponse.json({ message: 'Report saved successfully', reportId: report._id }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      // Duplicate key error (sessionId already exists)
      return NextResponse.json({ message: 'Report already exists for this session' }, { status: 200 });
    }
    console.error('Save Report Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
