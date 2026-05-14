import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { answers, tabSwitches, timeLeft, blueprint } = await req.json();

    let cognitiveScore = 0;
    let integrityRisk = 0;
    let behavioralFlags = [];

    // Basic scoring
    answers.forEach((ans: any) => {
      const module = blueprint.modules[ans.module];
      const question = module.questions[ans.question];

      if (module.type === 'cognitive') {
        if (ans.selected === question.answer) {
          cognitiveScore += 10;
        }
      } else if (module.type === 'behavioral') {
        // First option is usually generated as the ideal composed response by the prompt
        if (ans.selected !== question.options[0]) {
          behavioralFlags.push(question.riskFlag);
          integrityRisk += 5;
        }
      }
    });

    // Integrity scoring based on anti-cheat
    if (tabSwitches > 2) {
      integrityRisk += 20;
      behavioralFlags.push(`Candidate switched tabs ${tabSwitches} times (Cheating/Distraction Risk)`);
    }

    if (timeLeft < 1) {
      behavioralFlags.push('Candidate failed to manage time effectively under pressure.');
    }

    return NextResponse.json({
      score: {
        cognitive: cognitiveScore,
        integrityRisk: integrityRisk,
        flags: behavioralFlags
      },
      recommendation: integrityRisk > 15 ? 'High Risk - Caution' : 'Strong Candidate'
    });
  } catch (err: any) {
    console.error("Evaluation Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
