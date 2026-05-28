import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
// @ts-ignore
import cosineSimilarity from 'cosine-similarity';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: 'Both Resume and Job Description are required' }, { status: 400 });
    }

    // Embed Resume
    const resumeEmbeddingRes = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: resumeText,
    });
    
    // Embed Job Description
    const jobEmbeddingRes = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: jobDescription,
    });

    const resumeVector = resumeEmbeddingRes.embeddings?.[0]?.values;
    const jobVector = jobEmbeddingRes.embeddings?.[0]?.values;

    if (!resumeVector || !jobVector) {
      throw new Error("Failed to generate embeddings");
    }

    // Calculate semantic match
    const similarity = cosineSimilarity(resumeVector, jobVector);
    const fitScore = Math.min(100, Math.max(0, Math.round(similarity * 100)));

    // Generate Gap Analysis using a quick generation call
    const gapAnalysisRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze this resume against this job description and list 3 specific technical skills or requirements that are MISSING from the resume. Be extremely brief (bullet points).\n\nJob: ${jobDescription}\n\nResume: ${resumeText}`
    });

    return NextResponse.json({ 
       fitScore,
       similarity: similarity.toFixed(4),
       gapAnalysis: gapAnalysisRes.text
    });

  } catch (error: any) {
    console.error('Fit Score ML Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
