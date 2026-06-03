import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { JD_TRANSLATOR_SYSTEM_PROMPT } from '../../../../lib/ai/test-engine-prompts';
import type { SimulationBlueprint } from '../../../../lib/simulation/types';
import { generateRandomName, getInitials, getAvatarColor, NAME_POOL } from '../../../../lib/simulation/characters';

export const dynamic = 'force-dynamic';

// ─── Fallback Blueprint (for when AI is unavailable) ──────────────────────────
function buildFallbackBlueprint(): SimulationBlueprint {
  return {
    role: 'Product Manager',
    workspace: 'product_manager',
    companyCultureProfile: 'Aggressive Scale-up',
    company: 'NovaTech',
    stakeholders: [
      {
        id: 's1', name: 'Arjun Mehta', role: 'VP Engineering', department: 'Engineering',
        avatar: 'AM', avatarColor: '#ef4444', personality: 'overbearing_executive',
        trust: 100, frustration: 0, cooperation: 70, escalationLevel: 0,
        interactionHistory: [], isManager: true,
        photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      {
        id: 's2', name: 'Priya Singh', role: 'Lead Designer', department: 'Design',
        avatar: 'PS', avatarColor: '#8b5cf6', personality: 'passive_aggressive',
        trust: 100, frustration: 0, cooperation: 80, escalationLevel: 0,
        interactionHistory: [], isManager: false, reportsTo: 's1',
        photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg'
      },
      {
        id: 's3', name: 'Sarah Chen', role: 'Enterprise Client', department: 'External',
        avatar: 'SC', avatarColor: '#f97316', personality: 'difficult_client',
        trust: 100, frustration: 0, cooperation: 60, escalationLevel: 0,
        interactionHistory: [], isManager: false,
        photoUrl: 'https://randomuser.me/api/portraits/women/68.jpg'
      },
      {
        id: 's4', name: 'Marcus Williams', role: 'Senior Engineer', department: 'Engineering',
        avatar: 'MW', avatarColor: '#22c55e', personality: 'lazy_contributor',
        trust: 100, frustration: 0, cooperation: 85, escalationLevel: 0,
        interactionHistory: [], isManager: false, reportsTo: 's1',
        photoUrl: 'https://randomuser.me/api/portraits/men/54.jpg'
      },
    ],
    acts: [
      {
        act: 1,
        title: 'Act 1: Normal Day',
        description: 'Sprint planning day. Three things land at once.',
        durationSeconds: 600,
        initialEvents: [
          {
            id: 'evt-a1-1', type: 'slack', fromStakeholderId: 's2',
            channel: '#product-design', subject: undefined,
            message: "Hey, can we jump on a quick call? The new onboarding flow designs are ready for your sign-off. Been waiting since yesterday tbh.",
            priority: 'MEDIUM', requiresResponse: true, revealAt: 0, isRead: false, isAnswered: false,
          },
          {
            id: 'evt-a1-2', type: 'email', fromStakeholderId: 's3',
            channel: undefined, subject: 'Feature request — Dashboard export',
            message: "Hi,\n\nFollowing up on our call last Thursday. Our team urgently needs the CSV export feature in the dashboard. Our board presentation is next Friday and we committed to showing this.\n\nCan you confirm a delivery date?\n\nBest,\nSarah Chen\nCTO, GlobalOps Ltd.",
            priority: 'HIGH', requiresResponse: true, revealAt: 15, isRead: false, isAnswered: false,
          },
          {
            id: 'evt-a1-3', type: 'task', fromStakeholderId: 's1',
            channel: undefined, subject: undefined,
            message: 'Q2 Roadmap deck needs to be ready for board review by 3pm today. Arjun added you as owner.',
            priority: 'CRITICAL', requiresResponse: false, revealAt: 45, isRead: false, isAnswered: false,
          },
        ],
        challenge: {
          id: 'ch-1',
          type: 'priority_decision',
          prompt: "You have 3 things competing for your attention right now:\n\n1. Priya's design sign-off (she's been waiting since yesterday)\n2. Sarah Chen's urgent feature request (board presentation next Friday)\n3. The Q2 Roadmap deck Arjun needs by 3pm today\n\nHow do you handle the next 2 hours? Walk through your prioritization logic, who you respond to first, what you say, and what gets deprioritized. Be specific.",
          relatedEventIds: ['evt-a1-1', 'evt-a1-2', 'evt-a1-3'],
          evaluationCriteria: ['Prioritization logic', 'Stakeholder communication', 'Deadline awareness', 'Clarity of response'],
        },
      },
      {
        act: 2,
        title: 'Act 2: Crisis Hits',
        description: 'The client escalates. Engineering is blocked. Leadership is watching.',
        durationSeconds: 1200,
        initialEvents: [
          {
            id: 'evt-a2-1', type: 'email', fromStakeholderId: 's3',
            channel: undefined, subject: 'RE: Feature request — URGENT',
            message: "I sent this 2 hours ago and have heard nothing. This is completely unacceptable. We are a paying enterprise customer. I need a response NOW or I'm escalating to your CEO.",
            priority: 'CRITICAL', requiresResponse: true, revealAt: 0, isRead: false, isAnswered: false,
          },
          {
            id: 'evt-a2-2', type: 'slack', fromStakeholderId: 's4',
            channel: '#engineering', subject: undefined,
            message: "Hey, the CSV export is actually a bigger lift than we thought. Minimum 3 weeks. Might be able to do a basic version in 1.5 weeks but it'll be rough. What do you want me to do?",
            priority: 'HIGH', requiresResponse: true, revealAt: 30, isRead: false, isAnswered: false,
          },
          {
            id: 'evt-a2-3', type: 'notification', fromStakeholderId: 's1',
            channel: undefined, subject: undefined,
            message: 'Warning: Board Deck Review in 45 minutes. Arjun expects the roadmap in Notion now.',
            priority: 'CRITICAL', requiresResponse: false, revealAt: 90, isRead: false, isAnswered: false,
          },
        ],
        challenge: {
          id: 'ch-2',
          type: 'open_ended_reply',
          prompt: "Write the email you'd send to Sarah Chen (the enterprise client) right now. You know:\n- Feature will take 3 weeks minimum (or 1.5 weeks for a rough version)\n- She's already angry\n- She threatened to escalate to your CEO\n- You haven't spoken to your CEO yet\n\nBe specific. Your actual words matter — this is a real client relationship.",
          relatedEventIds: ['evt-a2-1', 'evt-a2-2'],
          evaluationCriteria: ['Communication clarity', 'Accountability', 'Expectation management', 'Tone under pressure', 'Solution orientation'],
        },
      },
      {
        act: 3,
        title: 'Act 3: Leadership Steps In',
        description: 'The CEO is now involved. You need to navigate upward and resolve.',
        durationSeconds: 600,
        initialEvents: [
          {
            id: 'evt-a3-1', type: 'email', fromStakeholderId: 's1',
            channel: undefined, subject: 'GlobalOps situation — what happened?',
            message: "Sarah Chen just emailed me directly. What's the situation? I need a full briefing in 15 minutes. Why did this escalate without my knowledge?",
            priority: 'CRITICAL', requiresResponse: true, revealAt: 0, isRead: false, isAnswered: false,
          },
          {
            id: 'evt-a3-2', type: 'slack', fromStakeholderId: 's2',
            channel: '#general', subject: undefined,
            message: "Btw I still haven't gotten your sign-off on the designs. Design review is tomorrow morning. Just putting this here since you didn't respond earlier.",
            priority: 'LOW', requiresResponse: false, revealAt: 60, isRead: false, isAnswered: false,
          },
        ],
        challenge: {
          id: 'ch-3',
          type: 'stakeholder_negotiation',
          prompt: "Arjun (VP Engineering / your manager) wants a briefing in 15 minutes about the GlobalOps situation. You need to:\n1. Explain what happened without making yourself look incompetent\n2. Present a concrete resolution plan\n3. Manage the fact that you didn't loop him in earlier\n\nWrite what you'd say in that 15-minute briefing. Be honest about the mistakes, clear about the plan, and specific about next steps.",
          relatedEventIds: ['evt-a3-1'],
          evaluationCriteria: ['Accountability under pressure', 'Upward communication', 'Problem ownership', 'Plan quality', 'Honesty vs self-protection'],
        },
      },
    ],
    benchmarks: { expectedScore: 72, criticalSkills: ['Prioritization', 'Client communication', 'Upward management'] },
  };
}

// ─── Main Route ───────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { jd, candidateName } = await req.json();

    if (!jd?.trim()) {
      return NextResponse.json({ blueprint: buildFallbackBlueprint() });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: JD_TRANSLATOR_SYSTEM_PROMPT }] },
        { role: 'user', parts: [{ text: `JD: ${jd}\n\nCandidate Name: ${candidateName ?? 'The Candidate'}` }] },
      ],
      config: { responseMimeType: 'application/json' },
    });

    const raw = (response.text ?? '').replace(/```json/g, '').replace(/```/g, '').trim();
    let blueprint: SimulationBlueprint;

    try {
      blueprint = JSON.parse(raw);
      if (candidateName) blueprint.candidateName = candidateName;

      // Inject photorealistic profile URLs
      const femaleNames = ['priya', 'sarah', 'zoe', 'elena', 'neha', 'aisha', 'kavya', 'fatima', 'ananya', 'ava'];
      blueprint.stakeholders = blueprint.stakeholders.map((s, index) => {
        const firstName = s.name.split(' ')[0].toLowerCase();
        const isFemale = femaleNames.includes(firstName) || s.avatarColor === '#8b5cf6' || s.avatarColor === '#ec4899';
        const gender = isFemale ? 'women' : 'men';
        const photoId = ((index * 23 + 15) % 95) + 1;
        return {
          ...s,
          photoUrl: `https://randomuser.me/api/portraits/${gender}/${photoId}.jpg`
        };
      });
    } catch {
      console.error('Blueprint parse failed, using fallback');
      blueprint = buildFallbackBlueprint();
    }

    return NextResponse.json({ blueprint });

  } catch (err: any) {
    console.error('Translate route error:', err);
    return NextResponse.json({ blueprint: buildFallbackBlueprint() });
  }
}
