import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { answers, tabSwitches, timeLeft, blueprint } = await req.json();

    let rawCognitiveScore = 0;
    let maxCognitiveScore = 0;
    let integrityRisk = 0;
    let behavioralFlags = [];
    let speedPenalty = 0;

    // Rule-based Hybrid Scoring Engine
    answers.forEach((ans: any) => {
      const module = blueprint.modules[ans.module];
      const question = module.questions[ans.question];

      if (module.type === 'cognitive') {
        maxCognitiveScore += 10;
        if (ans.selected === question.answer) {
          rawCognitiveScore += 10;
        } else if (question.trapLogic && ans.selected !== question.answer) {
          // Trigger trap logic flag
          behavioralFlags.push(`Guessed/Trapped on ${question.skillTag}: ${question.trapLogic}`);
        }
      } else if (module.type === 'behavioral') {
        // First option is generated as the ideal composed response by the prompt
        if (ans.selected !== question.options[0]) {
          behavioralFlags.push(question.riskFlag);
          integrityRisk += 10; // Penalty
        }
      }
    });

    // Integrity scoring based on anti-cheat & time (Points 8 & 9)
    if (tabSwitches > 0) {
      integrityRisk += (tabSwitches * 15);
      behavioralFlags.push(`Integrity Violation: Candidate switched tabs ${tabSwitches} times`);
    }

    if (timeLeft < 0) {
      speedPenalty = 10;
      behavioralFlags.push('Time Management: Failed to manage time effectively under pressure.');
    }

    // Apply Weighted Scoring (Point 12)
    const weights = blueprint.evaluationWeights || { cognitive: 50, integrity: 30, communication: 10, risk: 10 };
    
    // Normalize cognitive score
    const normalizedCognitive = maxCognitiveScore > 0 ? (rawCognitiveScore / maxCognitiveScore) * 100 : 0;
    
    // Calculate final weighted score
    const finalCognitiveImpact = (normalizedCognitive * (weights.cognitive / 100));
    const finalRiskImpact = (integrityRisk > 100 ? 100 : integrityRisk) * (weights.risk / 100);
    const finalScore = Math.max(0, Math.min(100, finalCognitiveImpact - finalRiskImpact - speedPenalty));

    // Decision-ready Output (Point 15)
    let recommendation = 'Hire';
    if (integrityRisk > 20 || finalScore < 50) recommendation = 'Caution';
    if (integrityRisk > 50 || tabSwitches > 2) recommendation = 'Reject';

    return NextResponse.json({
      score: {
        overallScore: Math.round(finalScore),
        cognitiveAccuracy: Math.round(normalizedCognitive),
        integrityRisk: integrityRisk,
        flags: behavioralFlags
      },
      recommendation: recommendation
    });
  } catch (err: any) {
    console.error("Evaluation Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
