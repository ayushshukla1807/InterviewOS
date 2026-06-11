import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { PERSONALITY_CONFIGS, TRUST_DELTA } from '../../../../lib/simulation/characters';
import type { StakeholderState, SimulationEvent, CandidateActionType, ConsequenceWaveTrigger } from '../../../../lib/simulation/types';

export const dynamic = 'force-dynamic';

// ─── HYRTE Events Engine ──────────────────────────────────────────────────────
// Called after every candidate action. Updates stakeholder state, fires consequence
// events, checks consequence wave triggers, and records behavioral signals.
// The simulation is BEHAVIOR-DRIVEN — this engine is the heartbeat.

export async function POST(req: Request) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const {
      role,
      companyCultureProfile,
      businessObjective,
      currentAct,
      candidateAction,    // CandidateActionType
      candidateResponse,  // string | null
      triggeringEvent,    // SimulationEvent that was responded to
      stakeholder,        // StakeholderState of the stakeholder who sent the event
      allStakeholders,    // Record<string, StakeholderState>
      recentHistory,      // string[] — last 3-5 action types
      ignoredCount,       // number — total events ignored so far
      consequenceWaves,   // ConsequenceWaveTrigger[] — global wave rules
      simulationElapsedSeconds, // number — for time-based triggers
    } = await req.json();

    // ─── 1. Update stakeholder trust/frustration ─────────────────────────────
    const updatedStakeholder: StakeholderState = { ...stakeholder };
    const deltas = TRUST_DELTA[stakeholder.personality as keyof typeof TRUST_DELTA];
    const delta = deltas?.[candidateAction as keyof typeof deltas] ?? 0;

    updatedStakeholder.trust = Math.max(0, Math.min(100, stakeholder.trust + delta));
    updatedStakeholder.frustration = Math.max(0, Math.min(100,
      stakeholder.frustration + (
        candidateAction === 'ignored' ? 20 :
        candidateAction === 'responded' ? -10 :
        candidateAction === 'asked_clarification' ? -5 :
        candidateAction === 'escalated' ? 5 :
        0
      )
    ));

    // Escalation level tracks based on trust thresholds
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

    // ─── 2. Check ConsequenceWave triggers ───────────────────────────────────
    // HYRTE is behavior-driven — waves fire based on candidate actions, not time
    const firedWaves: ConsequenceWaveTrigger[] = [];
    const waveConsequenceEvents: SimulationEvent[] = [];

    if (consequenceWaves && Array.isArray(consequenceWaves)) {
      for (const wave of consequenceWaves as ConsequenceWaveTrigger[]) {
        if (wave.fired) continue; // already fired

        let shouldFire = false;
        const cond = wave.condition;

        if (cond.type === 'ignored_count' && candidateAction === 'ignored') {
          shouldFire = (ignoredCount + 1) >= (cond.threshold ?? 2);
        } else if (cond.type === 'trust_below') {
          const targetStakeholder = cond.stakeholderId
            ? (cond.stakeholderId === stakeholder.id ? updatedStakeholder : allStakeholders[cond.stakeholderId])
            : updatedStakeholder;
          shouldFire = targetStakeholder?.trust < (cond.threshold ?? 40);
        } else if (cond.type === 'responded_to' && cond.eventId === triggeringEvent?.id) {
          shouldFire = candidateAction === 'responded' || candidateAction === 'asked_clarification';
        }

        if (shouldFire) {
          firedWaves.push({ ...wave, fired: true, firedAt: Date.now() });
          // Create the consequence event from the wave definition
          const consequenceEvent: SimulationEvent = {
            id: `wave-${wave.id}-${Date.now()}`,
            type: wave.consequence.eventType,
            fromStakeholderId: wave.consequence.fromStakeholderId,
            message: wave.consequence.message,
            priority: wave.consequence.priority,
            requiresResponse: wave.consequence.eventType !== 'notification',
            isRead: false,
            isAnswered: false,
            revealAt: simulationElapsedSeconds + (wave.consequence.delaySeconds || 0),
            consequenceOf: triggeringEvent?.id,
            hyrteSignal: {
              dimensionAffected: 'accountability',
              positiveIfRespondedWithin: 120,
              negativeIfIgnored: true,
            },
          };
          waveConsequenceEvents.push(consequenceEvent);
        }
      }
    }

    // ─── 3. HYRTE Behavioral Signals ─────────────────────────────────────────
    const behaviorSignals = {
      wasIgnored: candidateAction === 'ignored',
      soughtClarification: candidateAction === 'asked_clarification',
      escalatedAppropriately: candidateAction === 'escalated' && triggeringEvent?.priority === 'CRITICAL',
      respondedToCritical: candidateAction === 'responded' && triggeringEvent?.priority === 'CRITICAL',
      respondedWithSubstance: candidateAction === 'responded' && (candidateResponse?.length ?? 0) > 80,
      fastResponse: true, // computed client-side
    };

    // ─── 4. Generate AI consequence events ───────────────────────────────────
    const personalityConfig = PERSONALITY_CONFIGS[stakeholder.personality as keyof typeof PERSONALITY_CONFIGS];

    let currentTone = personalityConfig.defaultTone;
    if (updatedStakeholder.frustration > 50 || updatedStakeholder.trust < 50) {
      currentTone = personalityConfig.frustrationTone;
    }
    if (updatedStakeholder.escalationLevel >= 2) {
      currentTone = personalityConfig.escalationTone;
    }

    const consequencePrompt = `You are generating the next HYRTE workplace simulation events after a candidate's action.

HYRTE Context:
- Role being evaluated: ${role}
- Company culture: ${companyCultureProfile}
- Business Objective: ${businessObjective || 'Not specified'}
- Current act: Act ${currentAct} of 3
- Candidate action: ${candidateAction}
${candidateResponse ? `- Candidate's response: "${candidateResponse}"` : '- Candidate ignored / did not respond.'}

Stakeholder who sent the original event:
- Name: ${stakeholder.name} (${stakeholder.role})
- Personality: ${stakeholder.personality}
- Current trust in candidate: ${updatedStakeholder.trust}/100
- Current frustration: ${updatedStakeholder.frustration}/100
- Escalation level: ${updatedStakeholder.escalationLevel}/3
- Their personality system: ${personalityConfig.systemPromptAddition}
- Current tone they should use: ${currentTone}
- Interaction history: ${updatedStakeholder.interactionHistory.slice(-3).join('; ')}

Recent simulation history (last 5 actions): ${recentHistory.join('; ')}
Total events ignored so far: ${ignoredCount || 0}

HYRTE RULES for consequence generation:
1. If candidate IGNORED a HIGH/CRITICAL message → stakeholder ESCALATES — tone reflects their personality archetype escalating
2. If candidate RESPONDED WELL → stakeholder becomes more cooperative, may offer helpful information
3. If candidate gave a VAGUE/SHORT response → stakeholder asks a harder, more specific follow-up
4. If candidate ASKED CLARIFICATION → stakeholder either provides the missing info or pushes back if they're difficult
5. If escalation level reaches 2+ AND stakeholder reports to a manager → manager gets involved
6. Keep escalation realistic — don't jump from calm to firing in one step
7. The message must sound EXACTLY like this stakeholder's personality type and current tone
8. All events must connect back to the business objective: ${businessObjective || 'the core business goal'}
9. Make consequences feel REAL — if trust is 30 and candidate ignored them, they should feel the weight of that

Generate 1-2 consequence events that naturally follow from this candidate action.

Return ONLY valid JSON:
{
  "updatedStakeholderTrust": number,
  "updatedStakeholderFrustration": number,
  "updatedEscalationLevel": number,
  "consequenceEvents": [
    {
      "id": "evt-consequence-${Date.now()}-1",
      "type": "slack" | "email" | "notification" | "task" | "escalation",
      "fromStakeholderId": "${stakeholder.id}",
      "channel": "#channel-name or null",
      "subject": "email subject or null",
      "message": "The actual message — must sound like the stakeholder's personality at their current frustration/trust level. Include specific details about the business objective.",
      "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "requiresResponse": true | false,
      "revealDelay": 10,
      "isRead": false,
      "isAnswered": false,
      "hyrteSignal": {
        "dimensionAffected": "communication" | "accountability" | "stakeholderManagement" | "pressureResponse",
        "positiveIfRespondedWithin": 120,
        "negativeIfIgnored": true
      }
    }
  ],
  "shouldTriggerManagerEscalation": true | false,
  "managerEscalationMessage": "optional — only if shouldTriggerManagerEscalation is true — what the manager says when they get looped in",
  "chaosThresholdReached": true | false,
  "recoveryPhaseTriggered": true | false
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: consequencePrompt }] }],
      config: { responseMimeType: 'application/json' },
    });

    const raw = (response.text ?? '{}').replace(/```json/g, '').replace(/```/g, '').trim();
    let result: {
      updatedStakeholderTrust?: number;
      updatedStakeholderFrustration?: number;
      updatedEscalationLevel?: number;
      consequenceEvents?: SimulationEvent[];
      shouldTriggerManagerEscalation?: boolean;
      managerEscalationMessage?: string | null;
      chaosThresholdReached?: boolean;
      recoveryPhaseTriggered?: boolean;
    };
    try {
      result = JSON.parse(raw);
    } catch {
      result = {
        consequenceEvents: [],
        updatedStakeholderTrust: updatedStakeholder.trust,
        updatedStakeholderFrustration: updatedStakeholder.frustration,
        updatedEscalationLevel: updatedStakeholder.escalationLevel,
      };
    }

    // Merge wave-triggered events with AI-generated consequences
    const allConsequenceEvents = [
      ...(result.consequenceEvents ?? []),
      ...waveConsequenceEvents,
    ];

    // ─── 5. Auto-Recovery Detection ──────────────────────────────────────────
    // HYRTE is behavior-driven: if 2+ stakeholders drop below trust=40 due to
    // candidate actions, Recovery Phase triggers automatically — no click needed.
    const allUpdatedStakeholders = {
      ...allStakeholders,
      [stakeholder.id]: {
        ...updatedStakeholder,
        trust: result.updatedStakeholderTrust ?? updatedStakeholder.trust,
      },
    };
    const lowTrustCount = Object.values(allUpdatedStakeholders).filter(
      (s: any) => s.trust < 40
    ).length;
    const autoRecoveryTriggered = lowTrustCount >= 2 && !(result.recoveryPhaseTriggered);

    // Auto-chaos: if manager is involved (isManager=true stakeholder has low trust) → chaos threshold
    const managerLowTrust = Object.values(allUpdatedStakeholders).some(
      (s: any) => s.isManager && s.trust < 50
    );

    return NextResponse.json({
      updatedStakeholder: {
        ...updatedStakeholder,
        trust: result.updatedStakeholderTrust ?? updatedStakeholder.trust,
        frustration: result.updatedStakeholderFrustration ?? updatedStakeholder.frustration,
        escalationLevel: result.updatedEscalationLevel ?? updatedStakeholder.escalationLevel,
      },
      consequenceEvents: allConsequenceEvents,
      shouldTriggerManagerEscalation: result.shouldTriggerManagerEscalation ?? managerLowTrust,
      managerEscalationMessage: result.managerEscalationMessage ?? null,
      chaosThresholdReached: result.chaosThresholdReached ?? false,
      recoveryPhaseTriggered: result.recoveryPhaseTriggered ?? autoRecoveryTriggered,
      firedWaves,
      behaviorSignals,
    });

  } catch (err: unknown) {
    console.error('HYRTE Events API error:', err);
    return NextResponse.json({
      updatedStakeholder: null,
      consequenceEvents: [],
      shouldTriggerManagerEscalation: false,
      chaosThresholdReached: false,
      recoveryPhaseTriggered: false,
      firedWaves: [],
      behaviorSignals: {},
    });
  }
}
