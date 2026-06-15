import { NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../lib/db/mongoose';
import Resume from '../../../lib/db/models/Resume';
import { GoogleGenAI } from '@google/genai';

const JWT_SECRET = process.env.JWT_SECRET || 'interviewos_secret_2026';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract text from PDF' }, { status: 400 });
    }

    // 2. Parse using Gemini
    const prompt = `
    You are an expert technical recruiter and resume parser.
    Extract the following information from the provided resume text and return it as a structured JSON object.

    Return JSON format:
    {
      "skills": ["React", "Node.js", "Python"],
      "experience": [
        { "company": "Tech Corp", "role": "Software Engineer", "duration": "2020-2023", "description": "Did things" }
      ],
      "projects": [
        { "name": "App", "description": "Built an app", "technologies": ["React", "Firebase"] }
      ],
      "education": [
        { "institution": "University", "degree": "BS CS", "year": "2020" }
      ]
    }

    Resume Text:
    ${text}
    `;

    let parsedData = { skills: [], experience: [], projects: [], education: [] };
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      parsedData = JSON.parse(response.text || '{}');
    } catch (err) {
      console.error('Error structuring resume with Gemini:', err);
    }

    // 3. Save to database if authenticated
    const authHeader = req.headers.get('authorization');
    let userId = 'demo_candidate_id';
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        userId = decoded.id;
      } catch (e) {
        console.warn("Invalid token in parse-resume:", e);
      }
    }

    if (userId && userId !== 'demo_candidate_id') {
      try {
        await connectDB();
        await Resume.findOneAndUpdate(
          { userId },
          { rawText: text, parsedData },
          { upsert: true, new: true }
        );
      } catch (dbErr) {
        console.error('Failed to save parsed resume to database:', dbErr);
      }
    }

    return NextResponse.json({
      text,
      pages: pdf.numPages,
      parsed: parsedData,
    });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
