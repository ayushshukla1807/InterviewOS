// ─── Core Types for InterviewOS / HYRTE Living Workplace Simulation v3.0 ────

export type PersonalityType =
  | 'passive_aggressive'
  | 'credit_stealer'
  | 'micromanager'
  | 'lazy_contributor'
  | 'difficult_client'
  | 'political_manager'
  | 'overbearing_executive'
  | 'supportive_colleague';

export type WorkspaceType =
  | 'product_manager'
  | 'software_engineer'
  | 'sales'
  | 'hr'
  | 'customer_support'
  | 'finance'
  | 'marketing'
  | 'operations';

export type EventType = 'slack' | 'email' | 'task' | 'meeting' | 'notification' | 'escalation';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActNumber = 1 | 2 | 3;

// ─── HYRTE Phases ─────────────────────────────────────────────────────────────
// Simulation is behavior-driven, not timer-driven.
// Timer only controls pacing. Phase transitions happen via candidate actions.
export type HyrtePhase =
  | 'pre_skill'      // Direct skill validation before workspace (15%)
  | 'workspace'      // Normal workday: Act 1
  | 'chaos'          // Chaos wave: multiple demands simultaneously (Act 2)
  | 'recovery'       // Recovery phase: candidate must rebuild trust (Act 3)
  | 'complete';      // Simulation ended, scoring finalized

// ─── Score Distribution (HYRTE Model) ────────────────────────────────────────
// 15% → Direct Skill Validation (pre-simulation)
// 35% → Embedded Skill Challenges (in-simulation decisions)
// 50% → Workplace Intelligence (behavioral signals across all interactions)

export interface HyrteSkillScore {
  directSkill: {
    score: number;        // 0–100
    weight: 0.15;
    responses: { questionId: string; response: string; score: number; rationale: string }[];
  };
  embeddedSkills: {
    score: number;        // 0–100
    weight: 0.35;
    dimensions: Record<string, { score: number; label: string; observations: string[] }>;
  };
  workplaceIntelligence: {
    score: number;        // 0–100
    weight: 0.50;
    dimensions: {
      communication: number;
      adaptability: number;
      conflictHandling: number;
      stakeholderManagement: number;
      prioritization: number;
      accountability: number;
      pressureResponse: number;
      decisionQuality: number;
    };
    observations: string[];
  };
  total: number;          // weighted sum
  hiringInsight: string;  // Gemini-generated paragraph
  recoveryScore: number;  // 0–100: how well they recovered from mistakes
}

// ─── Role-specific Scoring Weights ───────────────────────────────────────────
export type RoleScoringProfile = Record<string, number>; // dimension → weight (sum = 1.0)

export const ROLE_SCORING_PROFILES: Record<WorkspaceType, RoleScoringProfile> = {
  product_manager: {
    technicalJudgment: 0.10, prioritization: 0.20, communication: 0.15,
    stakeholderManagement: 0.20, accountability: 0.15, pressureResponse: 0.10, adaptability: 0.10,
  },
  software_engineer: {
    technicalJudgment: 0.30, prioritization: 0.15, communication: 0.10,
    stakeholderManagement: 0.10, accountability: 0.15, pressureResponse: 0.10, adaptability: 0.10,
  },
  sales: {
    technicalJudgment: 0.05, prioritization: 0.15, communication: 0.25,
    stakeholderManagement: 0.20, accountability: 0.15, pressureResponse: 0.10, adaptability: 0.10,
  },
  hr: {
    technicalJudgment: 0.05, prioritization: 0.15, communication: 0.25,
    stakeholderManagement: 0.20, accountability: 0.15, pressureResponse: 0.10, adaptability: 0.10,
  },
  customer_support: {
    technicalJudgment: 0.10, prioritization: 0.10, communication: 0.30,
    stakeholderManagement: 0.20, accountability: 0.15, pressureResponse: 0.10, adaptability: 0.05,
  },
  finance: {
    technicalJudgment: 0.25, prioritization: 0.20, communication: 0.15,
    stakeholderManagement: 0.15, accountability: 0.15, pressureResponse: 0.05, adaptability: 0.05,
  },
  marketing: {
    technicalJudgment: 0.10, prioritization: 0.15, communication: 0.25,
    stakeholderManagement: 0.20, accountability: 0.10, pressureResponse: 0.10, adaptability: 0.10,
  },
  operations: {
    technicalJudgment: 0.15, prioritization: 0.20, communication: 0.15,
    stakeholderManagement: 0.15, accountability: 0.20, pressureResponse: 0.10, adaptability: 0.05,
  },
};

// ─── Pre-Simulation Skill Validation ─────────────────────────────────────────
// Candidate sees this BEFORE entering the workplace dashboard.
// 5-minute window. Tests baseline role competency.
export interface SkillValidationQuestion {
  id: string;
  type: 'priority_decision' | 'open_ended' | 'data_analysis' | 'scenario_judgment';
  prompt: string;
  context?: string;           // e.g., table of metrics, data points
  options?: string[];         // for priority_decision type
  evaluationCriteria: string[];
  timeboxSeconds: number;     // typically 300 (5 min)
  skillDimensions: string[];  // which dimensions this validates
}

// ─── Consequence Wave ─────────────────────────────────────────────────────────
// Defines automatic triggers that fire chaos/consequence events based on behavior.
// Simulation is BEHAVIOR-DRIVEN — these make every session feel alive and different.
export interface ConsequenceWaveTrigger {
  id: string;
  label: string;
  condition: {
    type: 'ignored_count' | 'trust_below' | 'time_elapsed' | 'responded_to' | 'chaos_threshold';
    threshold?: number;       // numeric threshold
    stakeholderId?: string;   // specific stakeholder
    eventId?: string;         // specific event
  };
  consequence: {
    type: 'escalation' | 'new_event' | 'chaos_wave' | 'recovery_trigger';
    message: string;
    fromStakeholderId: string;
    eventType: EventType;
    priority: Priority;
    delaySeconds: number;     // how long after trigger fires before event appears
  };
  fired: boolean;             // tracks if this wave has already fired
  firedAt?: number;           // timestamp when fired
}

// ─── Recovery Phase ───────────────────────────────────────────────────────────
// Triggered when stakeholder trust < 40 across 2+ stakeholders OR major mistake made.
// HYRTE-unique: evaluate HOW candidate recovers, not just that they failed.
export interface RecoveryAction {
  id: string;
  prompt: string;             // what recovery looks like for this scenario
  stakeholderIds: string[];   // who needs to be addressed
  candidateResponse?: string; // what they actually said
  recoveryScore: number;      // 0–100: quality of recovery
  timestamp: number;
}

// ─── Embedded Skill Challenge ─────────────────────────────────────────────────
// Role-specific challenges embedded inside the workday simulation.
// Evaluated as 35% of total score.
export interface EmbeddedChallenge {
  id: string;
  type: 'priority_decision' | 'open_ended_reply' | 'stakeholder_negotiation' | 'data_analysis' | 'crisis_resolution';
  prompt: string;
  context?: string;           // additional data/metrics for the challenge
  relatedEventIds: string[];
  evaluationCriteria: string[];
  skillDimensions: string[];  // which HYRTE dimensions this evaluates
  triggered: boolean;
  triggerCondition?: string;  // when to show this challenge
  response?: string;
  score?: number;
}

// ─── Stakeholder ─────────────────────────────────────────────────────────────

export interface StakeholderState {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;           // initials
  avatarColor: string;      // hex
  personality: PersonalityType;
  trust: number;            // 0–100, starts 100
  frustration: number;      // 0–100, starts 0
  cooperation: number;      // 0–100, starts 80
  escalationLevel: number;  // 0=calm 1=concerned 2=upset 3=escalated
  interactionHistory: string[]; // last N actions candidate took with them
  isManager: boolean;
  reportsTo?: string;       // stakeholder id
  photoUrl?: string;
}

// ─── Simulation Events ────────────────────────────────────────────────────────

export interface SimulationEvent {
  id: string;
  type: EventType;
  fromStakeholderId: string;
  channel?: string;
  subject?: string;
  message: string;
  priority: Priority;
  requiresResponse: boolean;
  consequenceOf?: string;     // parent event id
  revealAt?: number;          // seconds from simulation start
  triggerCondition?: string;  // behavior-based trigger (e.g., "ignored_count >= 2")
  isRead: boolean;
  isAnswered: boolean;
  revealedAt?: number;        // actual timestamp when revealed to candidate
  // HYRTE scoring signal
  hyrteSignal?: {
    dimensionAffected: string;
    positiveIfRespondedWithin: number; // seconds
    negativeIfIgnored: boolean;
  };
}

// ─── Candidate Actions ────────────────────────────────────────────────────────

export type CandidateActionType =
  | 'responded'
  | 'ignored'
  | 'escalated'
  | 'delegated'
  | 'asked_clarification'
  | 'requested_hint'
  | 'recovery_action';

export interface CandidateAction {
  type: CandidateActionType;
  eventId: string;
  stakeholderId: string;
  response?: string;
  responseTimeSeconds: number;
  timestamp: number;
  // HYRTE behavioral signals recorded at action time
  behaviorSignals?: {
    wasFirstToRespond: boolean;
    respondedUnderPressure: boolean;
    soughtClarificationBeforeActing: boolean;
    escalatedAppropriately: boolean;
    acknowledgedMistake: boolean;
  };
}

// ─── Simulation Act ────────────────────────────────────────────────────────────

export interface SimulationChallenge {
  id: string;
  type: 'priority_decision' | 'open_ended_reply' | 'stakeholder_negotiation';
  prompt: string;
  relatedEventIds: string[];
  evaluationCriteria: string[];
}

export interface SimulationAct {
  act: ActNumber;
  title: string;
  description: string;
  durationSeconds: number;
  initialEvents: SimulationEvent[];
  challenge: SimulationChallenge;
  embeddedChallenges?: EmbeddedChallenge[];
  consequenceWaves?: ConsequenceWaveTrigger[];
}

// ─── Blueprint ────────────────────────────────────────────────────────────────

export interface SimulationBlueprint {
  role: string;
  workspace: WorkspaceType;
  companyCultureProfile: string;
  company: string;
  businessObjective: string;  // e.g., "Reduce customer churn by 15%"
  candidateName?: string;
  stakeholders: StakeholderState[];
  acts: SimulationAct[];
  skillValidationQuestions: SkillValidationQuestion[];  // pre-simulation (15%)
  consequenceWaveRules: ConsequenceWaveTrigger[];       // behavior-driven triggers
  recoveryScenarios: RecoveryAction[];                  // template recovery moments
  benchmarks: {
    expectedScore: number;
    criticalSkills: string[];
    roleScoringWeights: RoleScoringProfile;
  };
}

// ─── Full Runtime State ────────────────────────────────────────────────────────

export interface SimulationRuntimeState {
  blueprint: SimulationBlueprint;
  phase: HyrtePhase;
  currentAct: ActNumber;
  actStartTime: number;
  simulationStartTime: number;

  eventStream: SimulationEvent[];
  pendingConsequences: SimulationEvent[];
  consequenceWaveLog: ConsequenceWaveTrigger[];        // which waves have fired

  stakeholderStates: Record<string, StakeholderState>;
  candidateActions: CandidateAction[];

  currentChallenge: SimulationChallenge | null;
  embeddedChallenges: EmbeddedChallenge[];
  challengeResponses: { challengeId: string; response: string; score?: number }[];

  // Pre-simulation skill validation
  skillValidationAnswers: { questionId: string; response: string; timeSpentSeconds: number }[];

  // Recovery
  recoveryActions: RecoveryAction[];
  chaosWaveActive: boolean;
  chaosWaveStartTime?: number;

  // Scoring (computed live but hidden from candidate)
  liveHyrteScore: Partial<HyrteSkillScore>;

  assistantUsageCount: number;
  tabSwitches: number;
  behavioralSignals: {
    ignoredEventIds: string[];
    escalatedEventIds: string[];
    clarificationCount: number;
    averageResponseTimeSeconds: number;
    responseTimes: number[];
    openedEmails: string[];
    openedSlacks: string[];
    recoveryAttempted: boolean;
    firstToRespondToHighPriority: boolean;
    respondedWithDataBeforeDeciding: boolean;
    acknowledgedMistakeProactively: boolean;
  };
}

// ─── Behavioral Report ────────────────────────────────────────────────────────

export interface BehavioralReport {
  overallScore: number;
  hyrteScore: HyrteSkillScore;
  hiringProbability: string;
  predictedEnvironmentFit: {
    startup: number;
    corporate: number;
    remote: number;
  };
  traits: {
    prioritization: string;
    stakeholderManagement: string;
    communicationClarity: string;
    emotionalControl: string;
    accountability: string;
    adaptability: string;
    leadershipSignals: string;
    executionQuality: string;
  };
  redFlags: string[];
  strengths: string[];
  narrativeSummary: string;
  integrityFlags: {
    tabSwitches: number;
    hintUsage: number;
    ignoredCriticalEvents: number;
  };
}
