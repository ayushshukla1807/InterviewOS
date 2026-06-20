import { NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File | null;
    const jobDescription = (formData.get('jobDescription') as string | null) || '';

    if (!file) {
      return NextResponse.json({ error: 'No resume file uploaded' }, { status: 400 });
    }

    // 1. Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: 'Could not extract sufficient text from PDF. Ensure the PDF is not image-based.' }, { status: 400 });
    }

    const pageCount = pdf.numPages;

    // 2. Build the evaluation prompt
    const jdSection = jobDescription.trim()
      ? `\nTARGET JOB DESCRIPTION (provided by candidate):\n${jobDescription.trim()}\n`
      : '\nNO JOB DESCRIPTION PROVIDED — use general software engineering role as baseline for keyword analysis.\n';

    const prompt = `You are an elite resume evaluator with 15+ years of experience as a senior recruiter at FAANG companies. You are also an ATS system expert.

Evaluate the following resume with extreme precision and return a comprehensive JSON analysis.
${jdSection}
RESUME TEXT:
${text}

Return ONLY a valid JSON object (no markdown, no explanation) exactly matching this schema:

{
  "overallScore": <0-100>,
  "atsScore": <0-100>,
  "pageCount": ${pageCount},

  "sections": {
    "summary": {
      "present": <true|false>,
      "score": <0-100>,
      "feedback": "<2-3 sentence honest evaluation>",
      "improvements": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"]
    },
    "experience": {
      "present": <true|false>,
      "score": <0-100>,
      "feedback": "<2-3 sentence honest evaluation covering impact, quantification, relevance>",
      "improvements": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
      "bulletAnalysis": [
        { "original": "<original bullet text (max 80 chars)>", "issue": "<what is weak>", "rewritten": "<improved version>" }
      ]
    },
    "skills": {
      "present": <true|false>,
      "score": <0-100>,
      "feedback": "<evaluation of skill section organization and relevance>",
      "improvements": ["<specific improvement 1>", "<specific improvement 2>"]
    },
    "education": {
      "present": <true|false>,
      "score": <0-100>,
      "feedback": "<evaluation of education section>",
      "improvements": ["<specific improvement 1>"]
    },
    "projects": {
      "present": <true|false>,
      "score": <0-100>,
      "feedback": "<evaluation of projects — impact, tech stack clarity, scale>",
      "improvements": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"]
    }
  },

  "atsAnalysis": {
    "score": <0-100>,
    "passedChecks": ["<check 1>", "<check 2>", "<check 3>", "<check 4>"],
    "failedChecks": ["<check 1>", "<check 2>"],
    "warnings": ["<warning 1>", "<warning 2>"]
  },

  "keywordAnalysis": {
    "presentKeywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>", "<keyword 5>"],
    "missingCriticalKeywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>"],
    "keywordDensityScore": <0-100>,
    "keywordDensityLabel": "Low" | "Medium" | "High" | "Excellent"
  },

  "quantificationAnalysis": {
    "score": <0-100>,
    "totalBullets": <number>,
    "quantifiedBullets": <number>,
    "feedback": "<honest assessment of how well they used numbers/metrics>",
    "examples": {
      "good": ["<example of a well-quantified bullet>"],
      "needsWork": ["<example of a weak unquantified bullet>"]
    }
  },

  "actionVerbAudit": {
    "score": <0-100>,
    "weakVerbs": ["<weak verb 1>", "<weak verb 2>", "<weak verb 3>"],
    "strongVerbsFound": ["<strong verb 1>", "<strong verb 2>"],
    "suggestions": [
      { "weak": "<weak phrase>", "strong": "<stronger replacement>" }
    ]
  },

  "impactLanguageScore": <0-100>,
  "impactLanguageFeedback": "<assessment of whether language conveys business/engineering impact>",

  "formatAnalysis": {
    "estimatedLength": "<'Ideal' | 'Too Short' | 'Too Long'>",
    "recommendation": "<specific recommendation about length/format>",
    "issues": ["<format issue 1>", "<format issue 2>"],
    "positives": ["<format positive 1>"]
  },

  "topStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "topWeaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],

  "fastImprovementPlan": [
    { "priority": "High", "action": "<specific action>", "timeEstimate": "<e.g. 15 min>" },
    { "priority": "High", "action": "<specific action>", "timeEstimate": "<e.g. 30 min>" },
    { "priority": "Medium", "action": "<specific action>", "timeEstimate": "<e.g. 45 min>" },
    { "priority": "Medium", "action": "<specific action>", "timeEstimate": "<e.g. 20 min>" },
    { "priority": "Low", "action": "<specific action>", "timeEstimate": "<e.g. 1 hour>" }
  ],

  "recruiterFirstImpression": "<2-3 sentences on what a recruiter's gut reaction would be in the first 6 seconds of scanning this resume>"
}

STRICT EVALUATION RULES:
1. Be brutally honest. Do NOT give inflated scores.
2. overallScore should rarely exceed 85 unless the resume is genuinely exceptional.
3. atsScore specifically measures how well an ATS parser would handle this resume (formatting, headers, columns, tables).
4. bulletAnalysis: pick the 3 weakest experience bullets and rewrite them with numbers and impact.
5. missingCriticalKeywords: if JD provided, compare against it. If not, list keywords typical for the candidate's apparent role.
6. Never fabricate experience or skills not present in the resume.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = (response.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      ...parsed,
      pageCount,
      resumeLength: text.length,
    });
  } catch (error: any) {
    console.error('[resume-evaluate]', error);
    return NextResponse.json({ error: error.message || 'Failed to evaluate resume' }, { status: 500 });
  }
}
