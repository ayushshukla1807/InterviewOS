import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
// @ts-ignore
import cosineSimilarity from 'cosine-similarity';

// Initialize Gemini for Embeddings
export const dynamic = 'force-dynamic';

// Generic highly-plagiarized patterns database (Mocked Embeddings)
// In a real system, these would be pre-calculated in a vector DB
const KNOWN_PATTERNS = [
  "function twoSum(nums, target) { const map = new Map(); for (let i = 0; i < nums.length; i++) { const complement = target - nums[i]; if (map.has(complement)) { return [map.get(complement), i]; } map.set(nums[i], i); } return []; }",
  "const reverseList = (head) => { let prev = null; let curr = head; while (curr) { let nextTemp = curr.next; curr.next = prev; prev = curr; curr = nextTemp; } return prev; };"
];

export async function POST(req: Request) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Generate embedding for the candidate's code using text-embedding-004
    const candidateEmbeddingRes = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: code,
    });
    
    const candidateVector = candidateEmbeddingRes.embeddings?.[0]?.values;

    if (!candidateVector) {
      throw new Error("Failed to generate embedding");
    }

    // In a real scenario, fetch these from a Vector Database
    let maxSimilarity = 0;
    
    // Compare against known patterns
    for (const pattern of KNOWN_PATTERNS) {
       const patternRes = await ai.models.embedContent({
         model: 'text-embedding-004',
         contents: pattern,
       });
       const patternVector = patternRes.embeddings?.[0]?.values;
       if (patternVector) {
         const similarity = cosineSimilarity(candidateVector, patternVector);
         if (similarity > maxSimilarity) maxSimilarity = similarity;
       }
    }

    // Convert similarity to an Originality Score (0 to 100)
    // High similarity means low originality
    const originalityScore = Math.max(0, 100 - (maxSimilarity * 100));

    // Thresholds
    let flag = 'SAFE';
    if (originalityScore < 30) flag = 'HIGHLY_SUSPICIOUS';
    else if (originalityScore < 60) flag = 'GENERIC';

    return NextResponse.json({ 
       originalityScore: Math.round(originalityScore), 
       flag,
       maxSimilarity: maxSimilarity.toFixed(4)
    });

  } catch (error: any) {
    console.error('Originality ML Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
