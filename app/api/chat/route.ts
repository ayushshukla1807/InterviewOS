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

  // Check if candidate used Hindi/Hinglish in their last message
  const lastUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].content.toLowerCase() : '';
  const usesHindi = /hai|haan|theek|lekin|kya|toh|nahi|acha/.test(lastUserMessage);

  switch (step) {
    case 0:
    case 1:
      content = usesHindi 
        ? `Hello ${name}! Welcome to the interview. Aapne jo "${firstProject}" pe kaam kiya hai using ${skills}, woh kafi interesting laga. Can you explain its architecture aur sabse bada challenge kya tha?`
        : `Hello ${name}! Welcome to the technical interview session for the ${roleName} role. I went through your profile and noticed your work on "${firstProject}" using ${skills}. To kick things off, could you explain the architecture of this project and the most challenging technical hurdle you encountered?`;
      signals = ['Resume Analysis Checked', 'Communication Baseline Set', usesHindi ? 'HINDI_SWITCH' : 'ENGLISH_DEFAULT'];
      break;

    case 2:
      content = usesHindi
        ? `That's a solid overview. Since hum ${roleName} ke liye evaluate kar rahe hain, let's dive deeper. Agar high load handle karna ho, toh state management aur caching approach kya hogi?`
        : `That's a solid architectural overview. Since we are evaluating for a ${roleName} position, let's dive deeper into some core technical concepts. Given your experience, how would you approach state management and caching to ensure high performance under heavy load?`;
      signals = ['Performance Deep Dive', 'Technical Probing'];
      break;

    case 3:
      content = usesHindi
        ? `Makes sense. Chalo ab thoda hands-on coding karte hain. Editor mein apne preferred language mein ek clean aur optimized function likho, run karo, aur phir apna approach samjhao.`
        : `Makes sense. Let's shift our focus to hands-on coding. I want you to write a clean, optimized function in the editor on your left. You can select your preferred language, write the solution, and click 'Run Code' to execute it. Once you are done, explain your approach to me.`;
      signals = ['Coding Assessment Triggered', 'Problem Solving Check'];
      break;

    case 4:
      content = usesHindi
        ? `Nice work. Output console pe dikh raha hai. Ise space complexity ke liye aur kaise optimize karoge? Aur edge cases (jaise empty inputs) ke liye test cases kaise likhoge?`
        : `Nice work running the code. I can see the execution output and runtime metrics in the console panel. How would you optimize this code further for space complexity, and how would you write test cases to cover edge cases?`;
      signals = ['Optimization Evaluation', 'Testing Standard'];
      break;

    default:
      content = usesHindi
        ? `Thank you so much! Humne architecture, coding, aur optimization cover kar liya hai. Yeh session abhi yahan conclude hota hai. Koi questions hain aapke mere liye?`
        : `Thank you for sharing that. We've covered architectural choices, core language concepts, live coding, and optimization. This completes our core interview modules. Do you have any final questions for me about the role or the team?`;
      signals = ['Wrap Up', 'Interview Complete'];
      break;
  }

  return { content, signals, adaptation };
}

// ─── Main Route ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { messages, track, system, candidateProfile, simulationSummary } = await req.json();

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
    
    // Cross-questioning context integration (Phase 4)
    if (simulationSummary) {
      systemPrompt += `\n\nCRITICAL CONTEXT FOR THIS INTERVIEW:
The candidate just completed a 30-minute immersive workplace simulation. Here is how they behaved:
${simulationSummary}

INSTRUCTION: During this technical interview, you MUST ask at least one behavioral cross-question referencing their specific actions in the simulation. For example, if they ignored a client email, ask them why and how they handle competing priorities.`;
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
