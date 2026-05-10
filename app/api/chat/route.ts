import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getRoleById } from '../../../lib/ai/roles';
import { buildRoleInterviewPrompt, INTERVIEWER_PERSONA } from '../../../lib/ai/prompts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── Offline Local Conversation Engine (Mock Syed/Ava) ──────────────────────
function generateOfflineResponse(messages: any[], candidateProfile: any, roleName: string): { content: string; signals: string[]; adaptation: string } {
  const userMessages = messages.filter((m: any) => m.role === 'user');
  const step = userMessages.length;

  const name = candidateProfile?.candidateName || candidateProfile?.name || 'Candidate';
  const projects = candidateProfile?.projects || '';
  const skills = candidateProfile?.skills || 'Javascript, React, Node.js';

  let content = '';
  let signals: string[] = [];
  let adaptation = 'Offline Adaptive Flow';

  // Extract a specific project name if available
  let firstProject = 'your projects';
  if (projects) {
    const lines = projects.split(/,|\n/);
    if (lines.length > 0 && lines[0].trim()) {
      firstProject = lines[0].trim();
    }
  }

  switch (step) {
    case 0:
    case 1:
      content = `Hello ${name}! Welcome to the technical interview session for the ${roleName} role. 
      I went through your profile and noticed your work on "${firstProject}" using ${skills}. 
      To kick things off, could you explain the architecture of this project and the most challenging technical hurdle you encountered while building it?`;
      signals = ['Resume Analysis Checked', 'Communication Baseline Set'];
      break;

    case 2:
      content = `That's a solid architectural overview. Since we are evaluating for a ${roleName} position, let's dive deeper into some core technical concepts.
      Given your experience with ${skills.split(',')[0] || 'frontend development'}, how would you approach state management and caching to ensure high performance under heavy load?`;
      signals = ['Performance Deep Dive', 'Technical Probing'];
      break;

    case 3:
      content = `Makes sense. Let's shift our focus to hands-on coding. 
      I want you to write a clean, optimized function in the editor on your left. 
      You can select your preferred language (JavaScript, Python, C++, or Java), write the solution, and click 'Run Code' to execute it. 
      Once you are done, explain your approach to me.`;
      signals = ['Coding Assessment Triggered', 'Problem Solving Check'];
      break;

    case 4:
      content = `Nice work running the code. I can see the execution output and runtime metrics in the console panel.
      How would you optimize this code further for space complexity, and how would you write test cases to cover edge cases (like empty inputs or invalid formats)?`;
      signals = ['Optimization Evaluation', 'Testing Standard'];
      break;

    default:
      content = `Thank you for sharing that. We've covered architectural choices, core language concepts, live coding, and optimization. 
      This completes our core interview modules. Feel free to click "Exit Session" or "Submit Final Solution" to generate your comprehensive technical assessment report. 
      Do you have any final questions for me about the role or the team?`;
      signals = ['Wrap Up', 'Interview Complete'];
      break;
  }

  return { content, signals, adaptation };
}

// ─── Main Route ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { messages, track, system, candidateProfile } = await req.json();

    let systemPrompt: string;

    const roleId = candidateProfile?.roleId || track;
    const role = roleId ? getRoleById(roleId) : null;
    const roleName = role?.title || 'Full Stack Engineer';

    if (role && candidateProfile) {
      systemPrompt = buildRoleInterviewPrompt(role, {
        name: candidateProfile.candidateName || candidateProfile.name || 'Candidate',
        projects: candidateProfile.projects,
        experience: candidateProfile.experience,
        certifications: candidateProfile.certifications,
        education: candidateProfile.education,
        skills: candidateProfile.skills,
        resumeText: candidateProfile.resumeText,
      });
    } else if (system) {
      systemPrompt = system;
    } else {
      systemPrompt = INTERVIEWER_PERSONA;
    }

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'aura' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Attempt to call Gemini API
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        }
      });

      const raw = response.text || '{}';
      const cleanRaw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      let data;
      try {
        data = JSON.parse(cleanRaw);
      } catch (parseErr) {
        data = { content: raw };
      }

      return NextResponse.json({
        content: data.content || data.text || "Let's move to the next topic.",
        signals: data.signals || [],
        adaptation: data.adaptation || "Maintaining difficulty."
      });

    } catch (apiErr: any) {
      // Fallback seamlessly to the offline local conversation engine if API fails
      console.warn("Gemini API call failed, falling back to local conversation engine:", apiErr.message);
      
      const fallbackResponse = generateOfflineResponse(messages, candidateProfile, roleName);
      return NextResponse.json(fallbackResponse);
    }

  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    return NextResponse.json({
      content: "I see. Let's continue — can you elaborate on that approach?",
      signals: [],
      adaptation: "Recovery mode"
    });
  }
}
