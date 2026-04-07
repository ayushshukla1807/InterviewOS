import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { transcript, code, questionTitle, track } = await req.json();

    const systemPrompt = `You are a Senior Hiring Lead at a top-tier company. Evaluate this candidate interview with extreme rigor and zero tolerance for vague answers.

Analyze the FULL interview transcript and code. Return EXACTLY this JSON with NO extra commentary:

{
  "overallScore": <0-100>,
  "recommendation": "Hire" | "Proceed with Caution" | "Reject",
  "hiringRisk": "Low" | "Medium" | "High",

  "communication": {
    "clarity": <0-100>,
    "conciseness": <0-100>,
    "structuredCommunication": <0-100>,
    "relevanceToQuestion": <0-100>,
    "verbalFluency": <0-100>,
    "fillerDependency": <0-100>,
    "totalScore": <0-100>,
    "recruiterInterpretation": "<2-3 sentence strict recruiter interpretation>"
  },

  "technical": {
    "conceptualUnderstanding": <0-100>,
    "practicalApplicationAbility": <0-100>,
    "problemSolvingDepth": <0-100>,
    "projectUnderstanding": <0-100>,
    "decisionMakingQuality": <0-100>,
    "totalScore": <0-100>,
    "recruiterInterpretation": "<2-3 sentence strict recruiter interpretation>"
  },

  "behavioural": {
    "ownership": <0-100>,
    "accountability": <0-100>,
    "adaptability": <0-100>,
    "collaborationSignals": <0-100>,
    "conflictHandling": <0-100>,
    "stressPressureStability": <0-100>,
    "totalScore": <0-100>,
    "recruiterInterpretation": "<2-3 sentence strict recruiter interpretation>"
  },

  "confidence": {
    "confidenceConsistency": <0-100>,
    "authenticity": <0-100>,
    "assertiveness": <0-100>,
    "conversationalControl": <0-100>,
    "totalScore": <0-100>
  },

  "cognitive": {
    "logicalThinking": <0-100>,
    "criticalThinking": <0-100>,
    "thoughtClarityUnderPressure": <0-100>,
    "learningAgility": <0-100>,
    "totalScore": <0-100>
  },

  "riskDetection": {
    "bluffProbability": <0-100>,
    "scriptedResponseProbability": <0-100>,
    "confidenceMismatch": <0-100>,
    "authenticityRisk": <0-100>,
    "inconsistencyDetection": <0-100>
  },

  "hiringReadiness": {
    "roleReadiness": <0-100>,
    "clientFacingReadiness": <0-100>,
    "leadershipReadiness": <0-100>,
    "independentWorkCapability": <0-100>,
    "teamEnvironmentCompatibility": <0-100>,
    "totalScore": <0-100>
  },

  "recruiterDecision": {
    "hirabilityScore": <0-100>,
    "riskToRewardRatio": "Worth It" | "Neutral" | "Not Worth It",
    "trainability": <0-100>,
    "roleFitConfidence": <0-100>,
    "interviewReadiness": <0-100>
  },

  "keyRecruitInsights": {
    "strongSignals": ["<signal 1>", "<signal 2>", "<signal 3>"],
    "majorConcerns": ["<concern 1>", "<concern 2>", "<concern 3>"]
  },

  "criticalFlags": ["<flag 1>", "<flag 2>", "<flag 3>"],

  "suitableFor": ["<role type 1>", "<role type 2>"],
  "notRecommendedFor": ["<role type 1>", "<role type 2>"],

  "finalVerdict": "<3-4 strict sentences summarizing the candidate. No fluff. No bias. Decision-ready.>",

  "candidateFeedback": {
    "whatHelped": ["<positive 1>", "<positive 2>"],
    "whatIsHurting": ["<issue 1>", "<issue 2>", "<issue 3>"],
    "whyYouMayBeRejected": ["<reason 1>", "<reason 2>"],
    "fastImprovementPlan": ["<step 1>", "<step 2>", "<step 3>", "<step 4>", "<step 5>"],
    "recruiterLikelyPerception": "<2 sentences on what recruiter probably thinks of this candidate>"
  },

  "codeEvaluation": {
    "score": <0-100>,
    "evaluation": "<Specific detailed analysis of their code approach. Mention exact architectural choices, missing edge cases, and improvement areas.>"
  }
}

STRICT RULES:
1. Never give 100/100 unless it is genuinely flawless
2. Flag if answers sound memorized (scripted response probability)
3. Flag if confidence inconsistent with actual knowledge level  
4. The finalVerdict should tell 70% of the story in 4 sentences`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Track: ${track}\nQuestion: ${questionTitle}\n\nCode Written by Candidate:\n\`\`\`\n${code}\n\`\`\`\n\nFull Interview Transcript:\n${transcript}` }
      ],
    });

    const raw = completion.choices[0].message.content || '{}';
    return NextResponse.json(JSON.parse(raw));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to evaluate' }, { status: 500 });
  }
}
