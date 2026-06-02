// ─── Core Types for InterviewOS Living Workplace Simulation v2.0 ────────────

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
  | 'customer_support';

export type EventType = 'slack' | 'email' | 'task' | 'meeting' | 'notification' | 'escalation';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActNumber = 1 | 2 | 3;

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
  photoUrl?: string;        // photorealistic avatar image url
}

// ─── Simulation Events ────────────────────────────────────────────────────────

export interface SimulationEvent {
  id: string;
  type: EventType;
  fromStakeholderId: string;
  channel?: string;           // for slack
  subject?: string;           // for email
  message: string;
  priority: Priority;
  requiresResponse: boolean;
  consequenceOf?: string;     // parent event id that triggered this
  revealAt?: number;          // seconds from simulation start to reveal
  isRead: boolean;
  isAnswered: boolean;
}

// ─── Candidate Actions ────────────────────────────────────────────────────────

export type CandidateActionType =
  | 'responded'
  | 'ignored'
  | 'escalated'
  | 'delegated'
  | 'asked_clarification'
  | 'requested_hint';

export interface CandidateAction {
  type: CandidateActionType;
  eventId: string;
  stakeholderId: string;
  response?: string;
  responseTimeSeconds: number;
  timestamp: number;
}

// ─── Simulation Challenge ─────────────────────────────────────────────────────

export type ChallengeType = 'priority_decision' | 'open_ended_reply' | 'stakeholder_negotiation';

export interface SimulationChallenge {
  id: string;
  type: ChallengeType;
  prompt: string;
  relatedEventIds: string[];
  evaluationCriteria: string[];
}

// ─── Acts ─────────────────────────────────────────────────────────────────────

export interface SimulationAct {
  act: ActNumber;
  title: string;
  description: string;
  durationSeconds: number;
  initialEvents: SimulationEvent[];
  challenge: SimulationChallenge;
}

// ─── Blueprint ────────────────────────────────────────────────────────────────

export interface SimulationBlueprint {
  role: string;
  workspace: WorkspaceType;
  companyCultureProfile: string;
  company: string;
  candidateName?: string;
  stakeholders: StakeholderState[];
  acts: SimulationAct[];
  benchmarks: {
    expectedScore: number;
    criticalSkills: string[];
  };
}

// ─── Full Runtime State ────────────────────────────────────────────────────────

export interface SimulationRuntimeState {
  blueprint: SimulationBlueprint;
  currentAct: ActNumber;
  actStartTime: number;
  eventStream: SimulationEvent[];           // all events ever revealed
  pendingConsequences: SimulationEvent[];   // queued for future reveal
  stakeholderStates: Record<string, StakeholderState>;
  candidateActions: CandidateAction[];
  currentChallenge: SimulationChallenge | null;
  challengeResponses: { challengeId: string; response: string }[];
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
  };
}

// ─── Behavioral Report ────────────────────────────────────────────────────────

export interface BehavioralReport {
  overallScore: number;
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
