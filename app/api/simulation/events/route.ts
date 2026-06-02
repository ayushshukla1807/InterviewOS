import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { PERSONALITY_CONFIGS, TRUST_DELTA } from '../../../../lib/simulation/characters';
import type { StakeholderState, SimulationEvent, CandidateActionType } from '../../../../lib/simulation/types';

export const dynamic = 'force-dynamic';

// ─── Generate the next events after a candidate action ────────────────────────
export async function POST(req: Request) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const {
      role,
      companyCultureProfile,
      currentAct,
      candidateAction,   // CandidateActionType
      candidateResponse, // string | null
      triggeringEvent,   // SimulationEvent that was responded to
      stakeholder,       // StakeholderState of the stakeholder who sent the event
      allStakeholders,   // Record<string, StakeholderState>
      recentHistory,     // string[] — last 3-5 actions summary
    } = await req.json();

    // ─── 1. Update stakeholder trust based on action ─────────────────────────
    const updatedStakeholder: StakeholderState = { ...stakeholder };
    const deltas = TRUST_DELTA[stakeholder.personality as keyof typeof TRUST_DELTA];
    const delta = deltas?.[candidateAction as keyof typeof deltas] ?? 0;

    updatedStakeholder.trust = Math.max(0, Math.min(100, stakeholder.trust + delta));
    updatedStakeholder.frustration = Math.max(0, Math.min(100,
      stakeholder.frustration + (candidateAction === 'ignored' ? 20 : candidateAction === 'responded' ? -5 : 0)
    ));

    if (updatedStakeholder.trust < 40 && updatedStakeholder.escalationLevel < 1) {
      updatedStakeholder.escalationLevel = 1;
    }
    if (updatedStakeholder.trust < 20 && updatedStakeholder.escalationLevel < 2) {
      updatedStakeholder.escalationLevel = 2;
    }
    if (updatedStakeholder.trust <= 0 && updatedStakeholder.escalationLevel < 3) {
      updatedStakeholder.escalationLevel = 3;
    }

    updatedStakeholder.interactionHistory = [
      ...stakeholder.interactionHistory,
      `${candidateAction}: "${candidateResponse?.slice(0, 100) ?? 'no response'}"`
    ].slice(-5);

    // ─── 2. Determine consequence events ─────────────────────────────────────
    const personalityConfig = PERSONALITY_CONFIGS[stakeholder.personality as keyof typeof PERSONALITY_CONFIGS];

    // Build tone based on current state
    let currentTone = personalityConfig.defaultTone;
    if (updatedStakeholder.frustration > 50 || updatedStakeholder.trust < 50) {
      currentTone = personalityConfig.frustrationTone;
    }
    if (updatedStakeholder.escalationLevel >= 2) {
      currentTone = personalityConfig.escalationTone;
    }

    const consequencePrompt = `You are generating the next workplace simulation events after a candidate's action.

Role being evaluated: ${role}
Company culture: ${companyCultureProfile}
Current act: Act ${currentAct} of 3
Candidate action: ${candidateAction}
${candidateResponse ? `Candidate's response: "${candidateResponse}"` : 'Candidate ignored / did not respond.'}

Stakeholder who sent the original event:
- Name: ${stakeholder.name} (${stakeholder.role})
- Personality: ${stakeholder.personality}
- Current trust in candidate: ${updatedStakeholder.trust}/100
- Current frustration: ${updatedStakeholder.frustration}/100
- Escalation level: ${updatedStakeholder.escalationLevel}/3
- Their personality system: ${personalityConfig.systemPromptAddition}
- Current tone they should use: ${currentTone}
- Interaction history: ${updatedStakeholder.interactionHistory.slice(-3).join('; ')}

Recent simulation history: ${recentHistory.join('; ')}

Generate 1-2 consequence events that would naturally follow from this candidate action.

Rules:
- If candidate ignored a critical message → stakeholder escalates, maybe loops in their manager
- If candidate responded well → stakeholder becomes more cooperative, offers help
- If candidate gave a vague/non-committal response → stakeholder asks a harder follow-up
- Keep escalation realistic — don't jump from calm to firing in one step
- The stakeholder's MESSAGE must sound EXACTLY like their personality type and current tone
- If escalation level reaches 2+, consider having the manager (another stakeholder) get involved

Return ONLY valid JSON:
{
  "updatedStakeholderTrust": number,
  "updatedStakeholderFrustration": number,
  "updatedEscalationLevel": number,
  "consequenceEvents": [
    {
      "id": "evt-${Date.now()}-1",
      "type": "slack" | "email" | "notification" | "task" | "escalation",
      "fromStakeholderId": "${stakeholder.id}",
      "channel": "#channel-name or null",
      "subject": "email subject or null",
      "message": "The actual message content — must sound like the stakeholder's personality",
      "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "requiresResponse": true | false,
      "revealDelay": 8,
      "isRead": false,
      "isAnswered": false
    }
  ],
  "shouldTriggerManagerEscalation": true | false,
  "managerEscalationMessage": "optional — only if shouldTriggerManagerEscalation is true"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: consequencePrompt }] }],
      config: { responseMimeType: 'application/json' },
    });

    const raw = (response.text ?? '{}').replace(/```json/g, '').replace(/```/g, '').trim();
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      result = { consequenceEvents: [], updatedStakeholderTrust: updatedStakeholder.trust, updatedStakeholderFrustration: updatedStakeholder.frustration, updatedEscalationLevel: updatedStakeholder.escalationLevel };
    }

    return NextResponse.json({
      updatedStakeholder: {
        ...updatedStakeholder,
        trust: result.updatedStakeholderTrust ?? updatedStakeholder.trust,
        frustration: result.updatedStakeholderFrustration ?? updatedStakeholder.frustration,
        escalationLevel: result.updatedEscalationLevel ?? updatedStakeholder.escalationLevel,
      },
      consequenceEvents: result.consequenceEvents ?? [],
      shouldTriggerManagerEscalation: result.shouldTriggerManagerEscalation ?? false,
      managerEscalationMessage: result.managerEscalationMessage ?? null,
    });

  } catch (err: any) {
    console.error('Simulation Events API error:', err);
    return NextResponse.json({
      updatedStakeholder: null,
      consequenceEvents: [],
      shouldTriggerManagerEscalation: false,
    });
  }
}
