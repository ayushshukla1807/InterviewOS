import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db/mongoose';
import SimulationReport from '../../../../lib/db/models/SimulationReport';
import User from '../../../../lib/db/models/User';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { userId, candidateName, sessionId, role, company, score, fullReportData, runtimeSummary, phaseCompletedAt, violations, recruiterId, jobId } = await req.json();

    if (!sessionId || !role || !company || score === undefined || !fullReportData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const report = new SimulationReport({
      userId,
      recruiterId,
      jobId,
      candidateName: candidateName || 'Anonymous',
      sessionId,
      role,
      company,
      score,
      fullReportData,
      runtimeSummary,
      phaseCompletedAt,
      violations: violations || [],
    });

    await report.save();

    // Gamification rewards calculations
    if (userId && userId !== 'demo_candidate_id') {
      try {
        const user = await User.findById(userId);
        if (user) {
          const xpAmount = Math.floor(score * 10);
          const newXP = (user.xp || 0) + xpAmount;
          const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
          const oldLevel = user.level || 1;

          const now = new Date();
          let newStreak = user.streak || 0;
          if (user.lastActivityAt) {
            const lastActivity = new Date(user.lastActivityAt);
            const diffInDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 3600 * 24));
            if (diffInDays === 1) {
              newStreak += 1;
            } else if (diffInDays > 1) {
              newStreak = 1;
            } else if (user.streak === 0) {
              newStreak = 1;
            }
          } else {
            newStreak = 1;
          }

          const currentBadges = user.badges || [];
          const badgesToAdd = [];

          if (score >= 90 && !currentBadges.find(b => b.id === 'elite-performer')) {
            badgesToAdd.push({
              id: 'elite-performer',
              name: 'Elite Performer',
              description: 'Scored 90+ in an interview',
              icon: 'star',
              earnedAt: now
            });
          }

          if (newLevel > oldLevel && !currentBadges.find(b => b.id === `level-${newLevel}`)) {
            badgesToAdd.push({
              id: `level-${newLevel}`,
              name: `Level ${newLevel} Achieved`,
              description: `Reached Level ${newLevel}`,
              icon: 'award',
              earnedAt: now
            });
          }

          user.xp = newXP;
          user.level = newLevel;
          user.streak = newStreak;
          user.lastActivityAt = now;
          if (badgesToAdd.length > 0) {
            user.badges = [...currentBadges, ...badgesToAdd];
          }
          await user.save();
        }
      } catch (dbErr) {
        console.error('Failed to update user gamification details:', dbErr);
      }
    }

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
