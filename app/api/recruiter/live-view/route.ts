import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── Recruiter Live View API ──────────────────────────────────────────────────
// Reads HYRTE score + simulation summary from sessionStorage-like server state.
// Since we can't access sessionStorage server-side, this endpoint accepts a
// POST with the current runtime snapshot and returns a formatted live view.

export async function POST(req: Request) {
  try {
    const {
      sessionId,
      runtime,
      hyrteScore,
      elapsedSeconds,
      tabSwitches,
      phase,
    } = await req.json();

    // Compute live summary stats
    const actions = runtime?.candidateActions || [];
    const signals = runtime?.behavioralSignals || {};
    const stakeholders = Object.values(runtime?.stakeholderStates || {}) as Record<string, unknown>[];

    const avgTrust = stakeholders.length
      ? Math.round(stakeholders.reduce((sum: number, s: Record<string, unknown>) => sum + (s.trust as number), 0) / stakeholders.length)
      : 100;
    const criticalStakeholders = stakeholders.filter((s: Record<string, unknown>) => (s.trust as number) < 40).length;
    const responseRate = actions.length > 0
      ? Math.round((actions.filter((a: Record<string, unknown>) => a.type !== 'ignored').length / actions.length) * 100)
      : 100;

    return NextResponse.json({
      sessionId,
      candidateName: runtime?.blueprint?.candidateName || 'Candidate',
      role: runtime?.blueprint?.role || 'Unknown',
      company: runtime?.blueprint?.company || '',
      phase,
      elapsedSeconds,
      tabSwitches,
      stats: {
        actsCovered: runtime?.currentAct || 1,
        totalActions: actions.length,
        responseRate,
        avgTrust,
        criticalStakeholders,
        ignored: signals.ignoredEventIds?.length || 0,
        clarifications: signals.clarificationCount || 0,
        escalations: signals.escalatedEventIds?.length || 0,
        hintsUsed: runtime?.assistantUsageCount || 0,
        recoveryAttempted: signals.recoveryAttempted || false,
      },
      hyrteScore: hyrteScore || null,
      stakeholderStates: runtime?.stakeholderStates || {},
      recentActions: actions.slice(-5),
      consequenceWavesTriggered: runtime?.consequenceWaveLog?.length || 0,
      integrityFlags: {
        tabSwitches,
        highRisk: tabSwitches >= 3,
      },
    });
  } catch (err) {
    console.error('Recruiter live view error:', err);
    return NextResponse.json({ error: 'Failed to compute live view' }, { status: 500 });
  }
}
