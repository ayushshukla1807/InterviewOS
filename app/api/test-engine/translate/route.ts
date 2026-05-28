import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { JD_TRANSLATOR_SYSTEM_PROMPT } from '../../../../lib/ai/test-engine-prompts';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { jd } = await req.json();

    if (!jd) {
      return NextResponse.json({ error: 'JD is required' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: `Here is the Job Description:\n\n${jd}` }] }],
      config: {
        systemInstruction: JD_TRANSLATOR_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      }
    });

    const raw = response.text || '{}';
    const cleanRaw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let blueprint;
    try {
      blueprint = JSON.parse(cleanRaw);
    } catch (parseErr) {
      return NextResponse.json({ error: 'Failed to parse AI response into JSON' }, { status: 500 });
    }

    return NextResponse.json({ blueprint });
  } catch (err: any) {
    console.warn("API Error in JD Translation Engine (falling back to mock blueprint):", err.message);
    
    // Fallback blueprint so the UI can still be tested even if the Gemini API is overloaded (503)
    const mockBlueprint = {
      role: "Senior Software Engineer (Simulated)",
      companyCultureProfile: "High-Pressure Tech Startup (Fast-paced, demanding)",
      evaluationWeights: { cognitive: 30, communication: 20, integrity: 25, risk: 25 },
      modules: [
        {
          type: "cognitive",
          title: "Technical Aptitude",
          questions: [
            {
              id: "COG-1",
              q: "How would you optimize a slow database query causing timeouts in a production microservice?",
              options: ["Add an index on the WHERE clause columns", "Rewrite the query using raw SQL", "Scale the DB instances vertically", "Implement a caching layer (Redis) with TTL invalidation"],
              answer: "Implement a caching layer (Redis) with TTL invalidation",
              difficulty: "medium",
              skillTag: "System Design",
              trapLogic: "Adding an index helps but doesn't solve read-heavy load patterns that caching handles."
            },
            {
              id: "COG-2",
              q: "A Kubernetes pod is crash-looping with OOMKilled status. Your service handles image processing. What is the MOST effective long-term fix?",
              options: ["Increase the pod memory limit to 8Gi", "Add a horizontal pod autoscaler", "Implement streaming/chunked processing to reduce peak memory", "Restart the deployment"],
              answer: "Implement streaming/chunked processing to reduce peak memory",
              difficulty: "hard",
              skillTag: "Infrastructure & DevOps",
              trapLogic: "Increasing limits masks the problem. Streaming fixes the root cause of high peak memory."
            }
          ]
        },
        {
          type: "behavioral",
          title: "Workplace Scenario (SJT)",
          questions: [
            {
              id: "SJT-1",
              scenario: "A critical production deployment fails 10 minutes before an investor demo. Your junior engineer pushed the breaking code. What do you do?",
              options: [
                "Immediately rollback the deployment, inform stakeholders calmly, and shield the junior from blame.",
                "Wait and hope the issue resolves itself before the demo starts.",
                "Publicly call out the junior engineer in the team channel so leadership knows it wasn't your fault.",
                "Cancel the demo entirely and escalate to your manager in a panic."
              ],
              idealBehavior: "Rollbacks ensure stability quickly. Shielding the junior shows leadership and ownership.",
              riskFlag: "Blaming others or panicking indicates low emotional control and poor leadership."
            },
            {
              id: "SJT-2",
              scenario: "You discover that a senior colleague has been taking credit for your team's work in executive presentations. A promotion cycle is coming up. How do you handle this?",
              options: [
                "Privately discuss it with the colleague first, then document your contributions for the next review cycle.",
                "Do nothing and hope your work speaks for itself.",
                "Publicly confront them in the next team meeting to expose the behavior.",
                "Immediately escalate to HR without talking to the colleague first."
              ],
              idealBehavior: "Direct private conversation shows maturity. Documentation shows strategic thinking.",
              riskFlag: "Passive avoidance or aggressive confrontation both indicate poor conflict resolution skills."
            }
          ]
        },
        {
          type: "workplace_simulation",
          title: "Dynamic Workplace Environment",
          scenario: {
            context: "It is 10:15 AM on a Monday morning. Your startup just launched v2.0 of your payment platform over the weekend. You are at your desk with coffee, and suddenly your laptop starts blowing up with notifications.",
            slackMessages: [
              {
                id: "slack-1",
                from: "Riya Kapoor - VP Engineering",
                avatar: "RK",
                avatarColor: "#ef4444",
                time: "10:16 AM",
                message: "🚨 @channel Payment processing is DOWN for EU customers. Stripe webhooks returning 502. Revenue impact is ~$12K/hour. Need someone on this NOW.",
                channel: "#incidents"
              },
              {
                id: "slack-2",
                from: "Arjun Mehta - Product Manager",
                avatar: "AM",
                avatarColor: "#6366f1",
                time: "10:18 AM",
                message: "Hey, the CEO just pinged me. BigCorp (our largest client) is threatening to churn if payments aren't fixed by noon. Can you give me an ETA I can share? Also the board deck is due at 2 PM and I need the Q2 metrics from your service.",
                channel: "#product"
              },
              {
                id: "slack-3",
                from: "Neha Sharma - Junior Engineer",
                avatar: "NS",
                avatarColor: "#22c55e",
                time: "10:20 AM",
                message: "I think I might have caused this... I merged a config change to the webhook handler on Friday and didn't run the EU test suite because it was timing out. I'm really sorry. Should I try to revert it?",
                channel: "#incidents"
              }
            ],
            emails: [
              {
                id: "email-1",
                from: "David Chen <david.chen@bigcorp.io>",
                subject: "URGENT: Payment failures affecting our operations - Immediate response required",
                receivedAt: "10:22 AM",
                body: "Hi, we are seeing widespread payment failures on our end since this morning. Our finance team has already escalated this to our CTO. We need a written incident report and a confirmed fix timeline within the next 2 hours, or we will need to begin evaluating alternative providers. This is not acceptable for a Tier-1 vendor relationship.",
                isUnread: true
              }
            ],
            tasks: [
              {
                id: "task-1",
                title: "PROD-911: Stripe webhook 502s for EU payment processing",
                priority: "CRITICAL",
                assignedTo: "You",
                dueIn: "30 minutes",
                description: "EU payment webhooks returning 502. Likely related to Friday's config merge. Revenue impact: $12K/hr."
              },
              {
                id: "task-2",
                title: "REPORT-42: Q2 platform metrics for board deck",
                priority: "HIGH",
                assignedTo: "You",
                dueIn: "3 hours",
                description: "PM needs Q2 transaction volume, uptime %, and latency metrics for the 2 PM board presentation."
              }
            ]
          },
          challenges: [
            {
              id: "ws-challenge-1",
              type: "priority_decision",
              prompt: "You have a critical production incident, a panicked junior engineer, a board deck deadline, and an angry enterprise client. Rank your next 3 actions in order of priority and explain your reasoning.",
              evaluationCriteria: ["Prioritization", "Reasoning Under Pressure", "Leadership", "Composure"]
            },
            {
              id: "ws-challenge-2",
              type: "open_ended_reply",
              prompt: "Draft a professional email reply to David Chen (BigCorp) that acknowledges the issue, provides a realistic timeline, and maintains the client relationship—without over-promising.",
              evaluationCriteria: ["Communication Clarity", "Emotional Control", "Stakeholder Management", "Accountability", "Honesty"]
            }
          ]
        }
      ],
      benchmarks: {
        expectedScore: 82,
        criticalSkills: ["Incident Response", "Stakeholder Communication", "System Design", "Leadership Under Pressure"]
      }
    };

    return NextResponse.json({ blueprint: mockBlueprint });
  }
}
