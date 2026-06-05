import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import type { SimulationRuntimeState, HyrteSkillScore } from '../../../../lib/simulation/types';

export const dynamic = 'force-dynamic';

// ─── HYRTE Score Engine ───────────────────────────────────────────────────────
// Calculates the 15% / 35% / 50% score from a completed simulation runtime.
// Called on submit (final score) or live (partial score for right panel display).

export async function POST(req: Request) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const {
      runtime,                // SimulationRuntimeState
      skillValidationAnswers, // pre-simulation answers
      isFinal,                // boolean — final submit or live update
    }: {
      runtime: SimulationRuntimeState;
      skillValidationAnswers?: { questionId: string; response: string; timeSpentSeconds: number }[];
      isFinal: boolean;
    } = await req.json();

    const bp = runtime.blueprint;
    const actions = runtime.candidateActions;
    const signals = runtime.behavioralSignals;
    const stakeholders = Object.values(runtime.stakeholderStates);

    // ── 1. Direct Skill Score (15%) ──────────────────────────────────────────
    // Based on pre-simulation answers
    const preAnswers = skillValidationAnswers || runtime.skillValidationAnswers || [];
    const directSkillPrompt = preAnswers.length > 0 && bp.skillValidationQuestions?.length > 0
      ? `Evaluate these pre-simulation answers for a ${bp.role} candidate.

Business Objective: ${bp.businessObjective}
Role: ${bp.role}
Company Culture: ${bp.companyCultureProfile}

Questions and Answers:
${bp.skillValidationQuestions.map((q, i) => {
  const ans = preAnswers.find(a => a.questionId === q.id);
  return `Q${i+1}: ${q.prompt}
Context: ${q.context || 'N/A'}
Candidate answered: "${ans?.response || '(no response)'}"
Time spent: ${ans?.timeSpentSeconds || 0}s / ${q.timeboxSeconds}s allowed
Evaluation criteria: ${q.evaluationCriteria.join('; ')}`;
}).join('\n\n')}

For each answer, score 0-100 based on:
- Does it show role-specific expertise?
- Does it reason from data/context, not instinct?
- Does it acknowledge tradeoffs?
- Is it delivered within the time constraint?

Return JSON: {
  "responses": [{ "questionId": string, "score": number, "rationale": string }],
  "overallDirectSkillScore": number
}`
      : null;

    let directSkillScore = 70; // default if no pre-skill questions
    let directSkillResponses: { questionId: string; response: string; score: number; rationale: string }[] = [];

    if (directSkillPrompt) {
      try {
        const dsRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: directSkillPrompt }] }],
          config: { responseMimeType: 'application/json' },
        });
        const dsData = JSON.parse((dsRes.text ?? '{}').replace(/```json/g, '').replace(/```/g, '').trim());
        directSkillScore = dsData.overallDirectSkillScore ?? 70;
        directSkillResponses = dsData.responses ?? [];
      } catch { /* use defaults */ }
    }

    // ── 2. Embedded Skills Score (35%) ───────────────────────────────────────
    const challengeResponses = runtime.challengeResponses || [];
    const embeddedSkillsPrompt = `Evaluate embedded skill challenge responses for a ${bp.role} candidate.

Business Objective: ${bp.businessObjective}
Role: ${bp.role}

Challenge Responses:
${challengeResponses.map((cr, i) => {
  const challenge = bp.acts.flatMap(a => [a.challenge, ...(a.embeddedChallenges || [])]).find(c => c.id === cr.challengeId);
  return `Challenge ${i+1} (${cr.challengeId}):
Prompt: ${challenge?.prompt || 'Unknown challenge'}
Criteria: ${challenge?.evaluationCriteria?.join('; ') || 'General assessment'}
Response: "${cr.response}"`;
}).join('\n\n')}

Stakeholder states at time of evaluation:
${stakeholders.map(s => `${s.name} (${s.role}): trust=${s.trust}, frustration=${s.frustration}`).join(', ')}

If no responses provided, score based on behavioral patterns (${actions.length} actions taken, ${signals.ignoredEventIds.length} events ignored).

Score each of these embedded skill dimensions 0-100:
- technicalJudgment: role-specific technical/domain expertise shown
- prioritization: ability to rank competing demands by business impact
- businessJudgment: connecting decisions to business objectives
- problemSolving: handling novel, ambiguous situations
- stakeholderNegotiation: balancing competing stakeholder interests

Return JSON: {
  "dimensions": {
    "technicalJudgment": { "score": number, "label": "Technical Judgment", "observations": ["obs1", "obs2"] },
    "prioritization": { "score": number, "label": "Prioritization", "observations": ["obs1"] },
    "businessJudgment": { "score": number, "label": "Business Judgment", "observations": ["obs1"] },
    "problemSolving": { "score": number, "label": "Problem Solving", "observations": ["obs1"] },
    "stakeholderNegotiation": { "score": number, "label": "Stakeholder Negotiation", "observations": ["obs1"] }
  },
  "overallEmbeddedScore": number
}`;

    let embeddedScore = 65;
    let embeddedDimensions: Record<string, { score: number; label: string; observations: string[] }> = {};
    try {
      const emRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: embeddedSkillsPrompt }] }],
        config: { responseMimeType: 'application/json' },
      });
      const emData = JSON.parse((emRes.text ?? '{}').replace(/```json/g, '').replace(/```/g, '').trim());
      embeddedScore = emData.overallEmbeddedScore ?? 65;
      embeddedDimensions = emData.dimensions ?? {};
    } catch { /* use defaults */ }

    // ── 3. Workplace Intelligence Score (50%) ─────────────────────────────────
    // Derived from behavioral signals + stakeholder trust changes + action patterns

    // Build behavioral evidence for Gemini to evaluate
    const actionLog = actions.map((a, i) =>
      `Action ${i+1}: Candidate ${a.type} event from ${runtime.stakeholderStates[a.stakeholderId]?.name || 'Unknown'}${a.response ? ` with response: "${a.response.slice(0, 200)}"` : ''}. Response time: ${a.responseTimeSeconds}s.`
    ).join('\n');

    const stakeholderLog = stakeholders.map(s =>
      `${s.name} (${s.role}, ${s.personality}): final trust=${s.trust}/100, frustration=${s.frustration}/100, escalation=${s.escalationLevel}/3. History: ${s.interactionHistory.slice(-2).join('; ')}`
    ).join('\n');

    const workplaceIntelPrompt = `You are the HYRTE Workplace Intelligence Evaluator.

Evaluate a ${bp.role} candidate's behavioral performance in a workplace simulation.
Company: ${bp.company} (${bp.companyCultureProfile})
Business Objective: ${bp.businessObjective}
Acts completed: ${runtime.currentAct}/3

BEHAVIORAL SIGNALS:
- Events ignored: ${signals.ignoredEventIds.length} (IDs: ${signals.ignoredEventIds.slice(0,5).join(', ')})
- Events escalated: ${signals.escalatedEventIds.length}
- Clarifications asked: ${signals.clarificationCount}
- Hints requested: ${runtime.assistantUsageCount}
- Tab switches (integrity): ${runtime.tabSwitches}
- Recovery attempted: ${signals.recoveryAttempted || false}
- Sought data before deciding: ${signals.respondedWithDataBeforeDeciding || false}
- Acknowledged mistake proactively: ${signals.acknowledgedMistakeProactively || false}

STAKEHOLDER OUTCOMES:
${stakeholderLog}

ACTION LOG:
${actionLog || 'No actions recorded'}

RECOVERY ACTIONS:
${(runtime.recoveryActions || []).map((r, i) => `Recovery ${i+1}: ${r.candidateResponse || '(no response)'}. Score: ${r.recoveryScore}/100`).join('\n') || 'None attempted'}

Evaluate these 8 Workplace Intelligence dimensions (0-100 each):
- communication: clarity, professionalism, appropriate tone with each stakeholder personality type
- adaptability: how well they adjusted when things changed (new info, chaos wave, delays)
- conflictHandling: how they managed passive-aggressive, difficult, or demanding stakeholders
- stakeholderManagement: managing multiple relationships simultaneously, trust building
- prioritization: which demands they addressed first and why, triage quality under pressure
- accountability: did they own mistakes? escalate when appropriate? hide problems?
- pressureResponse: quality of decisions during chaos wave vs normal conditions
- decisionQuality: were decisions data-driven? did they acknowledge tradeoffs? did they recover well?

Also score recoveryScore (0-100): how well they recovered from mistakes in Act 3.

If ${isFinal ? 'this is the FINAL submission, provide detailed hiring insight' : 'this is a LIVE update, provide brief assessment'}.

Return JSON:
{
  "dimensions": {
    "communication": number,
    "adaptability": number,
    "conflictHandling": number,
    "stakeholderManagement": number,
    "prioritization": number,
    "accountability": number,
    "pressureResponse": number,
    "decisionQuality": number
  },
  "overallWorkplaceScore": number,
  "recoveryScore": number,
  "observations": ["3-5 specific behavioral observations based on actual actions"],
  "hiringInsight": "${isFinal ? 'Detailed 3-4 sentence hiring insight paragraph for recruiter — include strengths, concerns, fit assessment, red flags if any' : 'One sentence summary'}"
}`;

    let workplaceScore = 60;
    let wsDimensions = {
      communication: 60, adaptability: 60, conflictHandling: 60, stakeholderManagement: 60,
      prioritization: 60, accountability: 60, pressureResponse: 60, decisionQuality: 60,
    };
    let recoveryScore = 50;
    let observations: string[] = [];
    let hiringInsight = 'Evaluation in progress...';

    try {
      const wsRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: workplaceIntelPrompt }] }],
        config: { responseMimeType: 'application/json' },
      });
      const wsData = JSON.parse((wsRes.text ?? '{}').replace(/```json/g, '').replace(/```/g, '').trim());
      workplaceScore = wsData.overallWorkplaceScore ?? 60;
      wsDimensions = { ...wsDimensions, ...(wsData.dimensions ?? {}) };
      recoveryScore = wsData.recoveryScore ?? 50;
      observations = wsData.observations ?? [];
      hiringInsight = wsData.hiringInsight ?? 'Evaluation in progress...';
    } catch { /* use defaults */ }

    // ── 4. Compose Final HYRTE Score ─────────────────────────────────────────
    const total = Math.round(
      directSkillScore * 0.15 +
      embeddedScore * 0.35 +
      workplaceScore * 0.50
    );

    const hyrteScore: HyrteSkillScore = {
      directSkill: {
        score: directSkillScore,
        weight: 0.15,
        responses: directSkillResponses.map(r => ({
          ...r,
          response: preAnswers.find(a => a.questionId === r.questionId)?.response || '',
        })),
      },
      embeddedSkills: {
        score: embeddedScore,
        weight: 0.35,
        dimensions: embeddedDimensions,
      },
      workplaceIntelligence: {
        score: workplaceScore,
        weight: 0.50,
        dimensions: wsDimensions,
        observations,
      },
      total,
      hiringInsight,
      recoveryScore,
    };

    return NextResponse.json(hyrteScore);

  } catch (err: unknown) {
    console.error('HYRTE Score API error:', err);
    // Return safe defaults
    return NextResponse.json({
      directSkill: { score: 70, weight: 0.15, responses: [] },
      embeddedSkills: { score: 65, weight: 0.35, dimensions: {} },
      workplaceIntelligence: {
        score: 60, weight: 0.50,
        dimensions: { communication: 60, adaptability: 60, conflictHandling: 60, stakeholderManagement: 60, prioritization: 60, accountability: 60, pressureResponse: 60, decisionQuality: 60 },
        observations: [],
      },
      total: 63,
      hiringInsight: 'Score computation encountered an error. Please review action logs.',
      recoveryScore: 50,
    } as HyrteSkillScore);
  }
}
