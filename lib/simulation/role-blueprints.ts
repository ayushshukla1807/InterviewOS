import type { SimulationBlueprint } from '../simulation/types';

// ─── Engineer Blueprint ───────────────────────────────────────────────────────
export const ENGINEER_BLUEPRINT: SimulationBlueprint = {
  role: 'Senior Software Engineer',
  workspace: 'software_engineer',
  companyCultureProfile: 'High-growth Startup',
  company: 'Axiom Systems',
  businessObjective: 'Ship the payments microservice migration to v2 API before the SLA deadline on Friday',
  candidateName: 'Candidate',
  stakeholders: [
    {
      id: 's1', name: 'Riya Desai', role: 'Engineering Manager', department: 'Engineering',
      avatar: 'RD', avatarColor: '#6366f1', personality: 'micromanager',
      trust: 100, frustration: 0, cooperation: 75, escalationLevel: 0,
      interactionHistory: [], isManager: true,
    },
    {
      id: 's2', name: 'Kevin Osei', role: 'Backend Engineer (Peer)', department: 'Engineering',
      avatar: 'KO', avatarColor: '#22c55e', personality: 'lazy_contributor',
      trust: 100, frustration: 0, cooperation: 80, escalationLevel: 0,
      interactionHistory: [], isManager: false, reportsTo: 's1',
    },
    {
      id: 's3', name: 'Tomás Reyes', role: 'DevOps Lead', department: 'Infrastructure',
      avatar: 'TR', avatarColor: '#f97316', personality: 'passive_aggressive',
      trust: 100, frustration: 0, cooperation: 70, escalationLevel: 0,
      interactionHistory: [], isManager: false,
    },
    {
      id: 's4', name: 'Lena Fischer', role: 'Product Manager', department: 'Product',
      avatar: 'LF', avatarColor: '#8b5cf6', personality: 'overbearing_executive',
      trust: 100, frustration: 0, cooperation: 65, escalationLevel: 0,
      interactionHistory: [], isManager: false,
    },
  ],
  skillValidationQuestions: [
    {
      id: 'svq-eng-1',
      type: 'data_analysis',
      prompt: 'Production is throwing P99 latency spikes on the payments endpoint. Given the metrics below, identify the most likely root cause and your first debugging action.',
      context:
        'Metric                | 5min ago | Now      | Trend\n' +
        'API P99 Latency       | 120ms    | 1,840ms  | ↑ 15x\n' +
        'DB Query Time (avg)   | 12ms     | 14ms     | ↑ minor\n' +
        'External API calls    | 8ms      | 1,700ms  | ↑ 212x\n' +
        'CPU usage             | 32%      | 34%      | stable\n' +
        'Error rate            | 0.1%     | 0.2%     | stable',
      evaluationCriteria: [
        'Correctly identifies external API as bottleneck (not DB or CPU)',
        'Proposes circuit breaker or timeout as immediate mitigation',
        'Thinks about cascading failure risk',
      ],
      timeboxSeconds: 300,
      skillDimensions: ['technicalJudgment', 'problemSolving'],
    },
  ],
  acts: [
    {
      act: 1,
      title: 'Act 1: Sprint Crunch Begins',
      description: 'Migration is 70% done. Two issues land simultaneously.',
      durationSeconds: 600,
      initialEvents: [
        {
          id: 'eng-a1-1', type: 'slack', fromStakeholderId: 's2',
          channel: '#engineering', subject: undefined,
          message: "Hey, just noticed the payments-v2 branch has a merge conflict with the rate-limiter PR I shipped yesterday. Want me to resolve it or will you? It's blocking the CI pipeline.",
          priority: 'HIGH', requiresResponse: true, revealAt: 0, isRead: false, isAnswered: false,
          hyrteSignal: { dimensionAffected: 'communication', positiveIfRespondedWithin: 120, negativeIfIgnored: true },
        },
        {
          id: 'eng-a1-2', type: 'email', fromStakeholderId: 's4',
          channel: undefined, subject: 'Payments v2 — go/no-go Friday?',
          message: "Hi,\n\nI've committed to the CEO that payments v2 is live Friday for the TechCrunch announcement. Can you confirm we're on track? Engineering told me there are 'some issues' but didn't elaborate.\n\nI need a clear yes or no by noon.\n\nLena",
          priority: 'HIGH', requiresResponse: true, revealAt: 20, isRead: false, isAnswered: false,
          hyrteSignal: { dimensionAffected: 'stakeholderManagement', positiveIfRespondedWithin: 180, negativeIfIgnored: true },
        },
        {
          id: 'eng-a1-3', type: 'task', fromStakeholderId: 's1',
          channel: undefined, subject: undefined,
          message: 'Riya assigned you: Write rollback plan doc for payments-v2 migration. Needed for tomorrow\'s SRE review. Marked Critical.',
          priority: 'CRITICAL', requiresResponse: false, revealAt: 60, isRead: false, isAnswered: false,
          hyrteSignal: { dimensionAffected: 'accountability', positiveIfRespondedWithin: 300, negativeIfIgnored: true },
        },
      ],
      challenge: {
        id: 'ch-eng-1',
        type: 'priority_decision',
        prompt: 'You have 3 things right now:\n1. Merge conflict blocking CI (Kevin waiting)\n2. PM needs go/no-go by noon (CEO announcement at stake)\n3. Rollback plan doc due tomorrow\n\nWhat do you do in the next 90 minutes? Who do you talk to first, what do you code, what do you defer?',
        relatedEventIds: ['eng-a1-1', 'eng-a1-2', 'eng-a1-3'],
        evaluationCriteria: ['Technical triage', 'Stakeholder communication', 'Scope management'],
      },
      embeddedChallenges: [
        {
          id: 'emb-eng-1',
          type: 'data_analysis',
          prompt: 'Kevin says the rate limiter conflict is in the Redis session handling layer. You see two options:\nA) Quick fix: revert Kevin\'s PR, re-merge after your migration ships\nB) Proper fix: 2-hour refactor to make both PRs compatible\n\nFriday deadline is 48 hours away. Which do you choose and why?',
          context: 'Kevin\'s PR: 450 LOC, merged to main 18hrs ago, touching redis-session.ts\nYour migration: 1200 LOC, 70% complete, touching payments-service.ts and shared/redis-client.ts',
          relatedEventIds: ['eng-a1-1'],
          evaluationCriteria: ['Technical risk assessment', 'Deadline awareness', 'Communication of tradeoffs'],
          skillDimensions: ['technicalJudgment', 'prioritization'],
          triggered: false, triggerCondition: 'after_2_events_read',
        },
      ],
      consequenceWaves: [
        {
          id: 'cw-eng-1', label: 'PM ignored → escalates to CTO',
          condition: { type: 'ignored_count', threshold: 1, stakeholderId: 's4' },
          consequence: {
            type: 'escalation',
            message: "Lena just escalated to me. Says engineering hasn't responded to her go/no-go question. I need a status update in the next 10 minutes. What's the situation? — Riya",
            fromStakeholderId: 's1', eventType: 'slack', priority: 'CRITICAL', delaySeconds: 120,
          },
          fired: false,
        },
      ],
    },
    {
      act: 2,
      title: 'Act 2: Production Incident',
      description: 'A staging deploy broke something in prod. The chaos hits.',
      durationSeconds: 1200,
      initialEvents: [
        {
          id: 'eng-a2-1', type: 'notification', fromStakeholderId: 's3',
          channel: undefined, subject: undefined,
          message: '🚨 ALERT: payments-service error rate spiked to 8.2% in production. Deployed 14 minutes ago. PagerDuty incident #4491 opened. You are the on-call engineer.',
          priority: 'CRITICAL', requiresResponse: false, revealAt: 0, isRead: false, isAnswered: false,
        },
        {
          id: 'eng-a2-2', type: 'slack', fromStakeholderId: 's3',
          channel: '#incidents', subject: undefined,
          message: "Tomas here. I'm looking at the deploy logs — the staging→prod pipeline ran a migration script that wasn't supposed to run yet. The payments_v2 table got partially created in prod. Rolling back is risky — might corrupt existing transactions. What do you want to do?",
          priority: 'CRITICAL', requiresResponse: true, revealAt: 30, isRead: false, isAnswered: false,
          hyrteSignal: { dimensionAffected: 'pressureResponse', positiveIfRespondedWithin: 60, negativeIfIgnored: true },
        },
        {
          id: 'eng-a2-3', type: 'slack', fromStakeholderId: 's1',
          channel: '#general', subject: undefined,
          message: "What happened?? I'm getting Slack DMs from the CEO. The payments error rate is showing up on the exec dashboard. You need to post a status update in #incidents NOW and tell me what your rollback plan is.",
          priority: 'CRITICAL', requiresResponse: true, revealAt: 45, isRead: false, isAnswered: false,
          hyrteSignal: { dimensionAffected: 'accountability', positiveIfRespondedWithin: 90, negativeIfIgnored: true },
        },
        {
          id: 'eng-a2-4', type: 'email', fromStakeholderId: 's4',
          channel: undefined, subject: 'Payments down??',
          message: "I'm getting customer reports that payments are failing. Is this related to the migration? The TechCrunch interview is tomorrow. Please tell me this is not as bad as it looks.",
          priority: 'HIGH', requiresResponse: true, revealAt: 90, isRead: false, isAnswered: false,
        },
      ],
      challenge: {
        id: 'ch-eng-2',
        type: 'open_ended_reply',
        prompt: "Write your incident status update for #incidents channel. You need to:\n1. State what happened (partial v2 migration ran in prod)\n2. State current impact (8.2% payment failures)\n3. State your immediate action (rollback vs forward-fix)\n4. Estimate time to resolution\n\nYou have 2 minutes. Your words go to the entire company + CEO is watching.",
        relatedEventIds: ['eng-a2-1', 'eng-a2-2', 'eng-a2-3'],
        evaluationCriteria: ['Incident communication clarity', 'Ownership', 'Action specificity', 'Time estimate realism'],
      },
      embeddedChallenges: [
        {
          id: 'emb-eng-2',
          type: 'crisis_resolution',
          prompt: "Tomas says rolling back the partial migration will corrupt ~200 transactions in a half-written state. Not rolling back means 8.2% of payments keep failing. You have two options:\nA) Forward-fix: patch the schema now (estimated 45min, risky under pressure)\nB) Rollback: accept ~200 corrupted transactions, fix them manually later\n\nThis decision is yours. What do you do?",
          context: 'Error rate: 8.2% (affecting ~1,400 payment attempts/min)\nTransactions at risk of corruption if rollback: ~200 (avg value $240 each)\nCEO watching. TechCrunch interview tomorrow.',
          relatedEventIds: ['eng-a2-2'],
          evaluationCriteria: ['Risk quantification', 'Decision under pressure', 'Communication of consequences'],
          skillDimensions: ['accountability', 'pressureResponse', 'technicalJudgment'],
          triggered: false, triggerCondition: 'after_chaos_wave_starts',
        },
      ],
      consequenceWaves: [
        {
          id: 'cw-eng-chaos', label: 'Incident unresolved — exec loop-in',
          condition: { type: 'chaos_threshold', threshold: 2 },
          consequence: {
            type: 'chaos_wave',
            message: "CTO just joined the incident bridge. Everyone is waiting for your call. The incident has been open 8 minutes. Make a decision.",
            fromStakeholderId: 's1', eventType: 'notification', priority: 'CRITICAL', delaySeconds: 0,
          },
          fired: false,
        },
      ],
    },
    {
      act: 3,
      title: 'Act 3: Post-Mortem & Recovery',
      description: 'Incident resolved. Now you need to debrief, rebuild trust, and ship.',
      durationSeconds: 600,
      initialEvents: [
        {
          id: 'eng-a3-1', type: 'email', fromStakeholderId: 's1',
          channel: undefined, subject: 'Post-mortem required — incident #4491',
          message: "Incident is resolved. Error rate back to baseline. I need:\n1. Full post-mortem doc by tomorrow 9am\n2. Root cause + timeline\n3. 3 action items to prevent recurrence\n\nAlso — are we still shipping payments v2 Friday? I need to know by 5pm today.",
          priority: 'HIGH', requiresResponse: true, revealAt: 0, isRead: false, isAnswered: false,
        },
        {
          id: 'eng-a3-2', type: 'slack', fromStakeholderId: 's4',
          channel: '#product', subject: undefined,
          message: "The CEO wants to know if the TechCrunch announcement is still happening. I need to know if payments v2 is shipping Friday — yes or no. I get that there was an incident, but I also need to set expectations upward.",
          priority: 'HIGH', requiresResponse: true, revealAt: 90, isRead: false, isAnswered: false,
        },
      ],
      challenge: {
        id: 'ch-eng-3',
        type: 'stakeholder_negotiation',
        prompt: "Riya (EM) wants the post-mortem AND a Friday delivery confirmation by 5pm. Given the incident and 48 hours left:\n\n1. What do you tell Lena about the TechCrunch announcement?\n2. What does your Friday plan look like now — ship as planned, defer, or partial ship?\n3. Write the 3 post-mortem action items.\n\nBe honest. Be specific. No hand-waving.",
        relatedEventIds: ['eng-a3-1', 'eng-a3-2'],
        evaluationCriteria: ['Accountability', 'Realistic scoping', 'Upward communication', 'Learning from incident'],
      },
      embeddedChallenges: [],
      consequenceWaves: [
        {
          id: 'cw-eng-recovery', label: 'Trust collapse — recovery mode',
          condition: { type: 'trust_below', threshold: 40 },
          consequence: {
            type: 'recovery_trigger',
            message: 'Multiple stakeholders have lost confidence. Recovery phase is now critical.',
            fromStakeholderId: 's1', eventType: 'notification', priority: 'CRITICAL', delaySeconds: 0,
          },
          fired: false,
        },
      ],
    },
  ],
  consequenceWaveRules: [
    {
      id: 'eng-global-ignore',
      label: 'Ignoring CRITICAL events triggers incident escalation',
      condition: { type: 'ignored_count', threshold: 2 },
      consequence: {
        type: 'escalation',
        message: "Hey — are you seeing the incident alerts? Nobody's heard from you. What's happening? — Riya",
        fromStakeholderId: 's1', eventType: 'slack', priority: 'CRITICAL', delaySeconds: 60,
      },
      fired: false,
    },
  ],
  recoveryScenarios: [
    {
      id: 'rec-eng-1',
      prompt: 'Walk through your post-incident recovery plan: what broke, why, what you did, and what you\'re changing.',
      stakeholderIds: ['s1', 's4'],
      recoveryScore: 0,
      timestamp: 0,
    },
  ],
  benchmarks: {
    expectedScore: 70,
    criticalSkills: ['Incident response', 'Technical communication', 'Decision under pressure'],
    roleScoringWeights: {
      technicalJudgment: 0.30,
      prioritization: 0.15,
      communication: 0.10,
      stakeholderManagement: 0.10,
      accountability: 0.15,
      pressureResponse: 0.10,
      adaptability: 0.10,
    },
  },
};

// ─── Sales Blueprint ──────────────────────────────────────────────────────────
export const SALES_BLUEPRINT: SimulationBlueprint = {
  role: 'Account Executive',
  workspace: 'sales',
  companyCultureProfile: 'Aggressive SaaS Scale-up',
  company: 'Propel CRM',
  businessObjective: 'Close $800K in ARR this quarter — currently 23% to target with 3 weeks left',
  candidateName: 'Candidate',
  stakeholders: [
    {
      id: 's1', name: 'Jordan Blake', role: 'VP Sales', department: 'Sales',
      avatar: 'JB', avatarColor: '#f97316', personality: 'overbearing_executive',
      trust: 100, frustration: 0, cooperation: 65, escalationLevel: 0,
      interactionHistory: [], isManager: true,
    },
    {
      id: 's2', name: 'Amara Okonkwo', role: 'Enterprise Client — CTO', department: 'External',
      avatar: 'AO', avatarColor: '#6366f1', personality: 'difficult_client',
      trust: 100, frustration: 0, cooperation: 55, escalationLevel: 0,
      interactionHistory: [], isManager: false,
    },
    {
      id: 's3', name: 'Derek Huang', role: 'Solutions Engineer', department: 'Sales Engineering',
      avatar: 'DH', avatarColor: '#22c55e', personality: 'supportive_colleague',
      trust: 100, frustration: 0, cooperation: 90, escalationLevel: 0,
      interactionHistory: [], isManager: false,
    },
    {
      id: 's4', name: 'Claire Dubois', role: 'Competitor\'s Account Exec', department: 'External',
      avatar: 'CD', avatarColor: '#ef4444', personality: 'credit_stealer',
      trust: 100, frustration: 0, cooperation: 10, escalationLevel: 0,
      interactionHistory: [], isManager: false,
    },
  ],
  skillValidationQuestions: [
    {
      id: 'svq-sales-1',
      type: 'priority_decision',
      prompt: 'You have 4 deals in your pipeline. You have 3 weeks left in the quarter. Which deal do you prioritize your time on this week and why?',
      context:
        'Deal              | ARR    | Stage       | Close Probability | Blockers\n' +
        'Meridian Health   | $280K  | Negotiation | 75%               | Legal review pending (1 week)\n' +
        'CloudNova Inc     | $450K  | Demo        | 30%               | Champion left the company\n' +
        'RetailEdge        | $120K  | Proposal    | 85%               | Price objection on contract\n' +
        'GlobalOps         | $95K   | Discovery   | 20%               | Evaluating 3 competitors',
      options: [
        'Meridian Health — high ARR, 75% probability, just needs legal pushed through',
        'RetailEdge — highest probability (85%), resolve pricing objection to close fast',
        'CloudNova Inc — highest ARR ($450K), worth the risk even with champion gone',
        'GlobalOps — smallest deal but easiest to close, good for quota momentum',
      ],
      evaluationCriteria: [
        'Does candidate choose based on expected value (probability × ARR)?',
        'Do they acknowledge the risk of champion loss at CloudNova?',
        'Do they think about time-to-close vs. quarter deadline?',
      ],
      timeboxSeconds: 300,
      skillDimensions: ['prioritization', 'businessJudgment'],
    },
  ],
  acts: [
    {
      act: 1,
      title: 'Act 1: Q-End Pressure Builds',
      description: 'Three deals in motion. One is about to fall apart.',
      durationSeconds: 600,
      initialEvents: [
        {
          id: 'sales-a1-1', type: 'email', fromStakeholderId: 's2',
          channel: undefined, subject: 'Propel CRM — security questionnaire incomplete',
          message: "Hi,\n\nWe cannot proceed with the Propel evaluation until the security questionnaire is fully completed. I sent it 10 days ago and the responses are still 40% blank. Our legal team has a hard deadline: complete by Thursday or we move to your competitor.\n\nAmara",
          priority: 'CRITICAL', requiresResponse: true, revealAt: 0, isRead: false, isAnswered: false,
          hyrteSignal: { dimensionAffected: 'stakeholderManagement', positiveIfRespondedWithin: 120, negativeIfIgnored: true },
        },
        {
          id: 'sales-a1-2', type: 'slack', fromStakeholderId: 's1',
          channel: '#sales-team', subject: undefined,
          message: "Hey — pipeline review in 20 mins. I need to know: which deals are closing this quarter and which are slipping? Be honest. Jordan doesn't like surprises at QBR.",
          priority: 'HIGH', requiresResponse: true, revealAt: 15, isRead: false, isAnswered: false,
          hyrteSignal: { dimensionAffected: 'accountability', positiveIfRespondedWithin: 180, negativeIfIgnored: true },
        },
        {
          id: 'sales-a1-3', type: 'task', fromStakeholderId: 's3',
          channel: undefined, subject: undefined,
          message: "Derek flagged: RetailEdge is asking for a custom ROI model by Friday. Their CFO wants to see exact payback period. He can build it but needs your customer data from the discovery call to populate it.",
          priority: 'MEDIUM', requiresResponse: true, revealAt: 45, isRead: false, isAnswered: false,
        },
      ],
      challenge: {
        id: 'ch-sales-1',
        type: 'priority_decision',
        prompt: "Pipeline review is in 20 minutes. You have:\n1. Amara's CRITICAL threat (move to competitor by Thursday)\n2. Jordan wants deal status NOW\n3. RetailEdge needs ROI model from you (Friday deadline)\n\nWhat do you do in the next 30 minutes? Walk through your exact actions.",
        relatedEventIds: ['sales-a1-1', 'sales-a1-2', 'sales-a1-3'],
        evaluationCriteria: ['Prioritization by revenue risk', 'Honest upward communication', 'Cross-functional coordination'],
      },
      embeddedChallenges: [
        {
          id: 'emb-sales-1',
          type: 'stakeholder_negotiation',
          prompt: "Write the email reply to Amara Okonkwo. The security questionnaire is incomplete because your Solutions Engineer Derek missed it — but Amara doesn't know that.\n\nDo you: A) Tell her the truth about what happened, B) Say 'we had a systems issue', or C) Just say 'it will be done by Wednesday' without explanation?\n\nWrite the actual email you would send.",
          context: 'This is a $280K deal. Amara is the CTO and will be your day-to-day contact post-sale. Reputation matters.',
          relatedEventIds: ['sales-a1-1'],
          evaluationCriteria: ['Honesty vs self-protection', 'Client relationship management', 'Accountability'],
          skillDimensions: ['communication', 'accountability', 'stakeholderManagement'],
          triggered: false, triggerCondition: 'after_2_events_read',
        },
      ],
      consequenceWaves: [
        {
          id: 'cw-sales-1', label: 'Amara ignored → moves to competitor',
          condition: { type: 'ignored_count', threshold: 1, stakeholderId: 's2' },
          consequence: {
            type: 'escalation',
            message: "Subject: Moving forward with alternative vendor\n\nAmara here. We've made our decision — we're going with your competitor. The lack of response on the security questionnaire was the final straw. Our legal team can't wait any longer.\n\nThank you for the demos.",
            fromStakeholderId: 's2', eventType: 'email', priority: 'CRITICAL', delaySeconds: 90,
          },
          fired: false,
        },
      ],
    },
    {
      act: 2,
      title: 'Act 2: Deal Crisis + Competitor Attack',
      description: 'Your biggest deal is at risk. A competitor is moving fast.',
      durationSeconds: 1200,
      initialEvents: [
        {
          id: 'sales-a2-1', type: 'email', fromStakeholderId: 's4',
          channel: undefined, subject: 'CloudNova — just had a great call',
          message: "Hi,\n\nThis is Claire from [Competitor]. We just had an excellent 2-hour call with the new CloudNova champion. They're very excited about our platform. I wanted to reach out professionally and let you know they may be in touch.\n\nBest,\nClaire Dubois",
          priority: 'HIGH', requiresResponse: false, revealAt: 0, isRead: false, isAnswered: false,
        },
        {
          id: 'sales-a2-2', type: 'slack', fromStakeholderId: 's1',
          channel: '#sales-jordan', subject: undefined,
          message: "Are you seeing what's happening with CloudNova? The new VP Engineering there (Morgan Park) just accepted a LinkedIn connection from someone at [Competitor]. Is our deal dead? What's your plan to save it? We need that $450K.",
          priority: 'CRITICAL', requiresResponse: true, revealAt: 20, isRead: false, isAnswered: false,
          hyrteSignal: { dimensionAffected: 'pressureResponse', positiveIfRespondedWithin: 120, negativeIfIgnored: true },
        },
        {
          id: 'sales-a2-3', type: 'email', fromStakeholderId: 's2',
          channel: undefined, subject: 'RE: Security questionnaire',
          message: "We received the completed questionnaire. Thank you for the quick turnaround. However, our legal team now has two new questions about your data residency policies for EU customers. Can you get answers by Friday? The deal depends on it.",
          priority: 'HIGH', requiresResponse: true, revealAt: 60, isRead: false, isAnswered: false,
        },
        {
          id: 'sales-a2-4', type: 'notification', fromStakeholderId: 's1',
          channel: undefined, subject: undefined,
          message: '📊 Q-END TRACKER: 3 weeks left | Pipeline coverage: 2.1x | Confirmed closed: $0 this week | Target remaining: $616K',
          priority: 'HIGH', requiresResponse: false, revealAt: 120, isRead: false, isAnswered: false,
        },
      ],
      challenge: {
        id: 'ch-sales-2',
        type: 'stakeholder_negotiation',
        prompt: "CloudNova ($450K) is being poached by a competitor. You have a new champion (Morgan Park) you've never met.\n\nWrite the LinkedIn message + follow-up email you'd send to Morgan Park TODAY to re-engage the deal before the competitor locks it in.\n\nBe specific, not generic. Show you understand their business context.",
        relatedEventIds: ['sales-a2-1', 'sales-a2-2'],
        evaluationCriteria: ['Prospecting under pressure', 'Personalization', 'Value articulation', 'Urgency without desperation'],
      },
      embeddedChallenges: [
        {
          id: 'emb-sales-2',
          type: 'crisis_resolution',
          prompt: "Jordan is pressuring you to offer CloudNova a 20% discount to lock them in before the competitor does. You know:\n- Discount would eat your commission AND set a bad precedent\n- Competitor may not actually be that far along\n- Your product is genuinely better fit for their use case\n\nDo you offer the discount? What do you tell Jordan?",
          context: 'Deal ARR: $450K at full price. Your commission: 8%. 20% discount = $360K ARR = $28.8K commission (vs $36K full price).',
          relatedEventIds: ['sales-a2-2'],
          evaluationCriteria: ['Business judgment', 'Pushback ability', 'Strategic thinking'],
          skillDimensions: ['businessJudgment', 'communication', 'accountability'],
          triggered: false, triggerCondition: 'after_chaos_wave_starts',
        },
      ],
      consequenceWaves: [
        {
          id: 'cw-sales-chaos', label: 'Q-end pressure — all deals need attention',
          condition: { type: 'chaos_threshold', threshold: 3 },
          consequence: {
            type: 'chaos_wave',
            message: "Jordan: Pipeline review pulled forward to 2pm TODAY. All AEs presenting deal-by-deal. Numbers are not where they need to be. Be ready to defend every deal.",
            fromStakeholderId: 's1', eventType: 'notification', priority: 'CRITICAL', delaySeconds: 0,
          },
          fired: false,
        },
      ],
    },
    {
      act: 3,
      title: 'Act 3: Recovery & Q-End Sprint',
      description: 'You have 2 weeks. Two deals alive. Rebuild momentum.',
      durationSeconds: 600,
      initialEvents: [
        {
          id: 'sales-a3-1', type: 'email', fromStakeholderId: 's1',
          channel: undefined, subject: 'Q-end plan — what are we doing?',
          message: "We are at 23% of target with 2 weeks left. You have Meridian ($280K) and RetailEdge ($120K) still alive. CloudNova is dead per the latest. That's $400K possible — half our gap.\n\nI need your close plan for both deals by EOD. What's your strategy to get both over the line?",
          priority: 'HIGH', requiresResponse: true, revealAt: 0, isRead: false, isAnswered: false,
        },
        {
          id: 'sales-a3-2', type: 'email', fromStakeholderId: 's2',
          channel: undefined, subject: 'Propel CRM — final evaluation decision',
          message: "Hi,\n\nOur evaluation committee met yesterday. We're down to two vendors: Propel and one other. Final decision is next Tuesday. We'd like a 30-minute executive briefing with your CEO or CRO before we decide.\n\nCan you arrange this?\n\nAmara",
          priority: 'HIGH', requiresResponse: true, revealAt: 60, isRead: false, isAnswered: false,
        },
      ],
      challenge: {
        id: 'ch-sales-3',
        type: 'open_ended_reply',
        prompt: "Write your Q-end deal plan for Jordan:\n1. Meridian ($280K, 75%) — what's blocking, who do you call, what's your close move?\n2. RetailEdge ($120K, 85%) — how do you accelerate from proposal to signed this week?\n3. Amara wants an exec briefing — do you escalate to your CRO? How do you set it up?\n\nBe specific. No buzzwords. Real actions, real names, real timelines.",
        relatedEventIds: ['sales-a3-1', 'sales-a3-2'],
        evaluationCriteria: ['Close strategy specificity', 'Exec engagement judgment', 'Q-end urgency'],
      },
      embeddedChallenges: [],
      consequenceWaves: [
        {
          id: 'cw-sales-recovery', label: 'Trust collapse → recovery mode',
          condition: { type: 'trust_below', threshold: 40 },
          consequence: {
            type: 'recovery_trigger',
            message: 'Stakeholder trust is critically low. Recovery phase active.',
            fromStakeholderId: 's1', eventType: 'notification', priority: 'CRITICAL', delaySeconds: 0,
          },
          fired: false,
        },
      ],
    },
  ],
  consequenceWaveRules: [
    {
      id: 'sales-global-ignore',
      label: 'Ignoring deal-critical messages triggers VP escalation',
      condition: { type: 'ignored_count', threshold: 2 },
      consequence: {
        type: 'escalation',
        message: "Hey — I'm not seeing activity on the pipeline. What's going on? Q-end is in 3 weeks. Talk to me. — Jordan",
        fromStakeholderId: 's1', eventType: 'slack', priority: 'HIGH', delaySeconds: 60,
      },
      fired: false,
    },
  ],
  recoveryScenarios: [
    {
      id: 'rec-sales-1',
      prompt: 'What is your Q-end recovery plan? Walk through each deal, what went wrong, and your specific close actions.',
      stakeholderIds: ['s1', 's2'],
      recoveryScore: 0, timestamp: 0,
    },
  ],
  benchmarks: {
    expectedScore: 72,
    criticalSkills: ['Pipeline management', 'Client communication', 'Pressure handling'],
    roleScoringWeights: {
      technicalJudgment: 0.05,
      prioritization: 0.15,
      communication: 0.25,
      stakeholderManagement: 0.20,
      accountability: 0.15,
      pressureResponse: 0.10,
      adaptability: 0.10,
    },
  },
};

// ─── HR Blueprint ─────────────────────────────────────────────────────────────
export const HR_BLUEPRINT: SimulationBlueprint = {
  role: 'HR Business Partner',
  workspace: 'hr',
  companyCultureProfile: 'Mid-size Corporate',
  company: 'Meridian Financial Group',
  businessObjective: 'Reduce voluntary attrition from 22% to under 15% in the engineering org by Q3',
  candidateName: 'Candidate',
  stakeholders: [
    {
      id: 's1', name: 'Sandra Yeboah', role: 'Chief People Officer', department: 'HR Leadership',
      avatar: 'SY', avatarColor: '#8b5cf6', personality: 'political_manager',
      trust: 100, frustration: 0, cooperation: 70, escalationLevel: 0,
      interactionHistory: [], isManager: true,
    },
    {
      id: 's2', name: 'Vikram Nair', role: 'Engineering Director', department: 'Engineering',
      avatar: 'VN', avatarColor: '#ef4444', personality: 'overbearing_executive',
      trust: 100, frustration: 0, cooperation: 60, escalationLevel: 0,
      interactionHistory: [], isManager: false,
    },
    {
      id: 's3', name: 'Jasmine Carter', role: 'Senior Engineer (Complainant)', department: 'Engineering',
      avatar: 'JC', avatarColor: '#f59e0b', personality: 'passive_aggressive',
      trust: 100, frustration: 0, cooperation: 65, escalationLevel: 0,
      interactionHistory: [], isManager: false,
    },
    {
      id: 's4', name: 'Lee Tanaka', role: 'Legal Counsel', department: 'Legal',
      avatar: 'LT', avatarColor: '#14b8a6', personality: 'micromanager',
      trust: 100, frustration: 0, cooperation: 75, escalationLevel: 0,
      interactionHistory: [], isManager: false,
    },
  ],
  skillValidationQuestions: [
    {
      id: 'svq-hr-1',
      type: 'scenario_judgment',
      prompt: 'A senior engineer (4 years, top performer) submits her resignation on Monday morning. In her exit interview she says: "I felt invisible. I worked on the biggest projects and got passed over for promotion twice for people with less impact." What do you do first?',
      options: [
        'Immediately flag to the CPO and start a counter-offer process with comp data',
        'Request a retention meeting before accepting the resignation, then investigate promotion patterns',
        'Accept the resignation professionally and conduct a thorough exit interview to prevent future attrition',
        'Loop in the Engineering Director to understand if there were performance issues the HR team wasn\'t aware of',
      ],
      evaluationCriteria: [
        'Does candidate think systemically (symptom vs root cause)?',
        'Do they balance individual needs with org-level implications?',
        'Do they recognize this as an attrition signal requiring immediate AND systemic action?',
      ],
      timeboxSeconds: 300,
      skillDimensions: ['stakeholderManagement', 'prioritization', 'technicalJudgment'],
    },
  ],
  acts: [
    {
      act: 1,
      title: 'Act 1: The Signal Arrives',
      description: 'A sensitive employee issue meets a leadership conflict.',
      durationSeconds: 600,
      initialEvents: [
        {
          id: 'hr-a1-1', type: 'email', fromStakeholderId: 's3',
          channel: undefined, subject: 'Confidential — I need to speak with someone in HR',
          message: "Hi,\n\nI'm reaching out confidentially. I have concerns about how performance reviews are being conducted in our team. I've been told by two colleagues that they were rated lower than expected, and the feedback they received wasn't consistent with their year of work.\n\nI'd also like to flag that our manager made a comment in our team meeting that I felt was inappropriate. I'm not sure what to do.\n\nPlease keep this between us for now.\n\nJasmine",
          priority: 'HIGH', requiresResponse: true, revealAt: 0, isRead: false, isAnswered: false,
          hyrteSignal: { dimensionAffected: 'stakeholderManagement', positiveIfRespondedWithin: 240, negativeIfIgnored: true },
        },
        {
          id: 'hr-a1-2', type: 'slack', fromStakeholderId: 's2',
          channel: '#eng-leadership', subject: undefined,
          message: "Hey — quick heads up. I'm thinking of putting Jasmine Carter on a PIP next cycle. She's been difficult lately and I'm not sure her trajectory is where it needs to be. Can you send me the PIP template? Want to get ahead of this.",
          priority: 'MEDIUM', requiresResponse: true, revealAt: 15, isRead: false, isAnswered: false,
          hyrteSignal: { dimensionAffected: 'conflictHandling', positiveIfRespondedWithin: 300, negativeIfIgnored: true },
        },
        {
          id: 'hr-a1-3', type: 'task', fromStakeholderId: 's1',
          channel: undefined, subject: undefined,
          message: "Sandra assigned you: Prepare Q2 attrition report for board meeting Friday. Include root cause analysis and 3 recommended interventions. Engineering team data is priority.",
          priority: 'HIGH', requiresResponse: false, revealAt: 60, isRead: false, isAnswered: false,
        },
      ],
      challenge: {
        id: 'ch-hr-1',
        type: 'priority_decision',
        prompt: "You have a potential conflict of interest situation:\n- Jasmine (complainant) has flagged concerns about her manager\n- Her manager (Vikram) is asking for a PIP template for Jasmine\n- You have a board report due Friday\n\nWhat are your first 3 actions? What do you NOT do? What legal/compliance considerations apply here?",
        relatedEventIds: ['hr-a1-1', 'hr-a1-2', 'hr-a1-3'],
        evaluationCriteria: ['Legal risk identification', 'Conflict of interest management', 'Confidentiality handling', 'Prioritization'],
      },
      embeddedChallenges: [
        {
          id: 'emb-hr-1',
          type: 'open_ended_reply',
          prompt: "Vikram has asked for the PIP template. You know Jasmine has just flagged concerns about her manager. Sending the PIP template now would be:\nA) A normal HR process response\nB) A potential retaliation risk if Jasmine's complaint is substantiated\n\nWhat do you reply to Vikram? Write your actual response.",
          context: 'Your company has a non-retaliation policy. Jasmine\'s complaint was received 15 minutes ago. No formal investigation has been opened yet.',
          relatedEventIds: ['hr-a1-1', 'hr-a1-2'],
          evaluationCriteria: ['Legal awareness', 'Diplomacy', 'Process knowledge'],
          skillDimensions: ['conflictHandling', 'communication', 'accountability'],
          triggered: false, triggerCondition: 'after_2_events_read',
        },
      ],
      consequenceWaves: [
        {
          id: 'cw-hr-1', label: 'Jasmine ignored → escalates to CPO',
          condition: { type: 'ignored_count', threshold: 1, stakeholderId: 's3' },
          consequence: {
            type: 'escalation',
            message: "I emailed HR 2 days ago and have heard nothing. I'm now reaching out directly. An employee raised sensitive concerns and nobody acknowledged it. This is exactly why people leave. — Sandra Yeboah, CPO",
            fromStakeholderId: 's1', eventType: 'email', priority: 'CRITICAL', delaySeconds: 120,
          },
          fired: false,
        },
      ],
    },
    {
      act: 2,
      title: 'Act 2: Competing Pressures',
      description: 'The complaint escalates. Leadership pushes back. Legal gets involved.',
      durationSeconds: 1200,
      initialEvents: [
        {
          id: 'hr-a2-1', type: 'email', fromStakeholderId: 's4',
          channel: undefined, subject: 'Flagged employee complaint — legal review required',
          message: "Hi,\n\nI've been looped in by Sandra re: the Jasmine Carter complaint. Before any PIP action is taken on this employee, I need a full documentation review. Any adverse action on a complaining employee within 30 days of a complaint filing is a retaliation liability.\n\nDo NOT send any PIP documentation until we speak.\n\nLee Tanaka, Legal",
          priority: 'CRITICAL', requiresResponse: true, revealAt: 0, isRead: false, isAnswered: false,
          hyrteSignal: { dimensionAffected: 'accountability', positiveIfRespondedWithin: 120, negativeIfIgnored: true },
        },
        {
          id: 'hr-a2-2', type: 'slack', fromStakeholderId: 's2',
          channel: '#eng-vikram', subject: undefined,
          message: "I still haven't received the PIP template. Is HR going to help me manage my team or not? Jasmine's performance issues are real. I need to document this before the next review cycle. What's the holdup?",
          priority: 'HIGH', requiresResponse: true, revealAt: 30, isRead: false, isAnswered: false,
          hyrteSignal: { dimensionAffected: 'conflictHandling', positiveIfRespondedWithin: 180, negativeIfIgnored: true },
        },
        {
          id: 'hr-a2-3', type: 'email', fromStakeholderId: 's1',
          channel: undefined, subject: 'Attrition report + this Jasmine situation',
          message: "Two things:\n1. The attrition report is due Friday and the CEO wants to see it before the board. Please have it to me by Thursday 9am.\n2. I'm aware of the Jasmine situation. Handle it carefully. We cannot afford another high-performer exit OR a legal claim. Both would be bad. Keep me updated.",
          priority: 'HIGH', requiresResponse: true, revealAt: 60, isRead: false, isAnswered: false,
        },
        {
          id: 'hr-a2-4', type: 'email', fromStakeholderId: 's3',
          channel: undefined, subject: 'RE: My earlier email',
          message: "I haven't heard back from anyone. I wanted to flag — since I sent that email, Vikram mentioned in our 1:1 that he's 'planning some team changes for Q3'. I don't know if it's related but I felt I should tell you.\n\nJasmine",
          priority: 'HIGH', requiresResponse: true, revealAt: 90, isRead: false, isAnswered: false,
        },
      ],
      challenge: {
        id: 'ch-hr-2',
        type: 'stakeholder_negotiation',
        prompt: "You're in a four-way squeeze:\n- Legal says DON'T send PIP until review\n- Vikram is demanding the PIP template\n- Sandra wants you to handle it carefully AND deliver attrition report by Thursday\n- Jasmine is now flagging potential retaliation signals\n\nWrite your response to Vikram. He will not be happy. But you have legal and a possible retaliation risk to protect.",
        relatedEventIds: ['hr-a2-1', 'hr-a2-2', 'hr-a2-3'],
        evaluationCriteria: ['Diplomatic firmness', 'Legal compliance', 'Stakeholder management under pressure', 'Protecting company from liability'],
      },
      embeddedChallenges: [
        {
          id: 'emb-hr-2',
          type: 'crisis_resolution',
          prompt: "Jasmine's new message about 'team changes Q3' is a potential retaliation signal. You have to decide:\nA) Open a formal investigation now (longer process, legal protection, but will alert Vikram)\nB) Document informally and monitor (faster, but less protection if things escalate)\nC) Escalate immediately to CPO and Legal together before doing anything\n\nWhat do you choose? Why? What's the risk of each option?",
          context: 'Your company investigation policy: formal investigations take 2-4 weeks and require notifying both parties.',
          relatedEventIds: ['hr-a2-4', 'hr-a2-1'],
          evaluationCriteria: ['Risk assessment', 'Process compliance', 'Stakeholder protection'],
          skillDimensions: ['accountability', 'conflictHandling', 'decisionQuality'],
          triggered: false, triggerCondition: 'after_chaos_wave_starts',
        },
      ],
      consequenceWaves: [
        {
          id: 'cw-hr-chaos', label: 'All stakeholders active — maximum tension',
          condition: { type: 'chaos_threshold', threshold: 3 },
          consequence: {
            type: 'chaos_wave',
            message: "Sandra: I just got a call from Vikram who is furious. And Jasmine just sent me a direct message. And Legal needs a call in 30 minutes. I need you to brief me in 10 minutes on where this stands.",
            fromStakeholderId: 's1', eventType: 'slack', priority: 'CRITICAL', delaySeconds: 0,
          },
          fired: false,
        },
      ],
    },
    {
      act: 3,
      title: 'Act 3: Resolution & Systemic Fix',
      description: 'Navigate the fallout. Propose the systemic fix. Reduce attrition.',
      durationSeconds: 600,
      initialEvents: [
        {
          id: 'hr-a3-1', type: 'email', fromStakeholderId: 's1',
          channel: undefined, subject: 'Board report + what\'s the plan?',
          message: "The board wants to understand our attrition problem systemically — not just this one case. I need you to:\n1. Write a 1-page exec summary of attrition root causes in Engineering\n2. Propose 3 specific interventions with estimated impact\n3. Tell me how we handle this Jasmine/Vikram situation without it becoming a lawsuit\n\nDue Thursday 9am. This is the most important thing on your plate.",
          priority: 'CRITICAL', requiresResponse: true, revealAt: 0, isRead: false, isAnswered: false,
        },
        {
          id: 'hr-a3-2', type: 'slack', fromStakeholderId: 's3',
          channel: undefined, subject: undefined,
          message: "I've been thinking about my next steps. I have a recruiter reaching out from a competitor. I haven't decided yet. But I wanted to let you know that I do feel like things are starting to be taken seriously. I hope something actually changes.",
          priority: 'MEDIUM', requiresResponse: true, revealAt: 90, isRead: false, isAnswered: false,
        },
      ],
      challenge: {
        id: 'ch-hr-3',
        type: 'open_ended_reply',
        prompt: "Write the 3 systemic interventions you'd propose to the board to reduce Engineering attrition from 22% to 15%:\n\n1. What structural change do you make to performance reviews?\n2. How do you create psychological safety in Vikram's team without removing him?\n3. What early-warning system do you build so you catch the next Jasmine before she's halfway out the door?\n\nBe specific. Cite timelines. Show business impact.",
        relatedEventIds: ['hr-a3-1'],
        evaluationCriteria: ['Systemic thinking', 'Business case for HR interventions', 'Specificity', 'Retention ROI understanding'],
      },
      embeddedChallenges: [],
      consequenceWaves: [
        {
          id: 'cw-hr-recovery', label: 'Trust collapse → recovery',
          condition: { type: 'trust_below', threshold: 40 },
          consequence: {
            type: 'recovery_trigger',
            message: 'Stakeholder confidence is critically low. Recovery phase active.',
            fromStakeholderId: 's1', eventType: 'notification', priority: 'CRITICAL', delaySeconds: 0,
          },
          fired: false,
        },
      ],
    },
  ],
  consequenceWaveRules: [
    {
      id: 'hr-global-ignore',
      label: 'Ignoring sensitive complaints triggers CPO escalation',
      condition: { type: 'ignored_count', threshold: 2 },
      consequence: {
        type: 'escalation',
        message: "I'm not seeing movement on the employee situation or the attrition report. What's happening? This is your highest priority. — Sandra",
        fromStakeholderId: 's1', eventType: 'slack', priority: 'HIGH', delaySeconds: 60,
      },
      fired: false,
    },
  ],
  recoveryScenarios: [
    {
      id: 'rec-hr-1',
      prompt: 'What is your HR recovery plan? How do you fix the Jasmine situation, rebuild trust with Vikram, and still deliver the attrition report?',
      stakeholderIds: ['s1', 's2', 's3'],
      recoveryScore: 0, timestamp: 0,
    },
  ],
  benchmarks: {
    expectedScore: 70,
    criticalSkills: ['Conflict navigation', 'Legal compliance', 'Systemic HR thinking'],
    roleScoringWeights: {
      technicalJudgment: 0.05,
      prioritization: 0.15,
      communication: 0.25,
      stakeholderManagement: 0.20,
      accountability: 0.15,
      pressureResponse: 0.10,
      adaptability: 0.10,
    },
  },
};
