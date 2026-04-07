export type ScenarioTask = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
};

export type SkillMapping = {
  name: string;
  level: string;
  weight: number;
  description: string;
};

export type SimulationScenario = {
  id: string;
  title: string;
  subtitle: string;
  company: string;
  role: string;
  track: string;
  difficulty: string;
  overview: string;
  tasks: ScenarioTask[];
  skills: SkillMapping[];
  initialCode: string;
  language: string;
};

export const SCENARIOS: Record<string, SimulationScenario> = {
  JS: {
    id: 'SCENARIO-JS-01',
    title: 'Fintech Dashboard Optimization',
    subtitle: 'High-frequency transaction dashboard showing real-time updates',
    company: 'FinSphere Payments',
    role: 'Frontend Performance Engineer',
    track: 'JS',
    difficulty: 'Advanced',
    overview: 'The payments dashboard experiences massive lag and UI stuttering during high-volume periods. Users report CPU spikes and freezing browsers. Your job is to refactor the data aggregation pipeline, implement throttling/debouncing, optimize render performance, and clear any V8 memory leaks caused by leftover event listeners.',
    tasks: [
      { id: 't1', title: 'Refactor Transaction Aggregator', description: 'Write an optimized data aggregator helper that batches updates and recalculates totals efficiently without unnecessary re-allocations.', status: 'pending' },
      { id: 't2', title: 'Implement Event Throttle/Debounce', description: 'Create a highly robust debounce/throttle utility to handle high-frequency webhook notifications.', status: 'pending' },
      { id: 't3', title: 'Clear V8 Memory Leaks', description: 'Audit the cleanup cycle of your hook/callback to ensure no closure variables are retained after component unmount.', status: 'pending' }
    ],
    skills: [
      { name: 'React Rendering', level: 'Senior', weight: 35, description: 'Optimizing rendering cycles, minimizing component re-renders, and using virtual lists.' },
      { name: 'V8 Memory Management', level: 'Expert', weight: 35, description: 'Preventing memory leaks, understanding closures, and Scavenger/Mark-Sweep collector patterns.' },
      { name: 'Async Optimization', level: 'Mid-Senior', weight: 30, description: 'Implementing robust debouncers, throttles, and managing high-throughput event loops.' }
    ],
    initialCode: `// FINSPHERE PAYMENTS INC. - DASHBOARD OPTIMIZATION PROTOCOL
// TODO: Implement the batch aggregation pipeline and memory-safe event handlers.

class TransactionAggregator {
  private transactions: Array<{ id: string; amount: number; timestamp: number }> = [];
  
  constructor() {
    // Initialize aggregator
  }

  // Task 1: Batch process incoming updates securely and memory-efficiently
  public push(tx: { id: string; amount: number }) {
    // Write your code here
  }

  // Task 2: Retrieve total amounts within windows using efficient lookup tables
  public getAggregatedSum(): number {
    return 0;
  }
}

// Task 3: Implement a memory-safe debounce to rate-limit dashboard updates
export function debounce(fn: Function, delay: number) {
  // Ensure that no closure references leak memory upon termination
  return fn;
}`,
    language: 'javascript'
  },
  DSA: {
    id: 'SCENARIO-DSA-01',
    title: 'Ride-Sharing Routing Engine',
    subtitle: 'Multi-region dynamic routing engine with real-time ETA calculations',
    company: 'GoCab Mobility',
    role: 'Backend Core Engineer',
    track: 'DSA',
    difficulty: 'Expert',
    overview: 'GoCab routing algorithms are calculating suboptimal pick-up paths under high traffic conditions, leading to double-digit ETA increases. You need to implement an optimized shortest-path solver (based on A* or Dijkstra) that accounts for dynamic traffic weights, utilizes a Min-Heap for performance, and guarantees a scaling complexity better than O(V^2).',
    tasks: [
      { id: 't1', title: 'Implement Graph Weights Engine', description: 'Build a traffic weight multiplier that dynamically alters network node weights.', status: 'pending' },
      { id: 't2', title: 'Build Min-Heap Helper', description: 'Write an optimized priority queue using binary heap structures to speed up vertex relaxation.', status: 'pending' },
      { id: 't3', title: 'Optimize Routing Complexity', description: 'Execute the Dijkstra/A* pathfinder ensuring O((V+E) log V) scalability constraints.', status: 'pending' }
    ],
    skills: [
      { name: 'Graph Theory & Solvers', level: 'Expert', weight: 40, description: 'Knowledge of shortest-path algorithms, Dijkstra, A*, and grid traversal strategies.' },
      { name: 'Heap Structures', level: 'Senior', weight: 30, description: 'Custom priority queues, binary heaps, array representation of trees, and heapify processes.' },
      { name: 'Big-O Optimization', level: 'Expert', weight: 30, description: 'Reducing time/space complexity, analyzing constraints, and scaling structures.' }
    ],
    initialCode: `// GOCAB MOBILITY - DYNAMIC TRAFFIC PATHFINDER
// TODO: Build the Min-Heap priority queue and path relaxation solver.

class MinHeap {
  private heap: Array<{ node: string; weight: number }> = [];

  public insert(node: string, weight: number) {
    // Task 2: Insert node and bubble-up to maintain heap invariant
  }

  public extractMin(): { node: string; weight: number } | null {
    // Task 2: Extract minimum weight element and heapify-down
    return null;
  }
}

class RoutingEngine {
  private graph: Map<string, Array<{ to: string; distance: number }>> = new Map();

  // Task 1: Add dynamic traffic congestion scaling factor
  public addEdge(from: string, to: string, baseDistance: number, trafficFactor: number = 1.0) {
    // Write code here
  }

  // Task 3: Shortest path routing with priority heap
  public findOptimalPath(start: string, end: string): string[] {
    // Write dynamic programming or pathfinder algorithm here
    return [];
  }
}`,
    language: 'javascript'
  },
  ADA: {
    id: 'SCENARIO-ADA-01',
    title: 'AdTech Real-Time Bidder (RTB)',
    subtitle: 'Ultra-low latency dynamic auction platform handling 1M+ requests per second',
    company: 'OptiBid Technologies',
    role: 'Systems Architect',
    track: 'ADA',
    difficulty: 'Architect',
    overview: 'The OptiBid real-time bidder needs to process bids and select the highest valid bidder within a strict 50ms SLA. If a bid selection takes longer, it is dropped. You are task with designing the dynamic caching framework, configuring a concurrent memory-safe cache pool, and handling multi-region read replicas replication lagging conflicts.',
    tasks: [
      { id: 't1', title: 'Design Low-Latency Cache Sync', description: 'Setup an LRU cache system featuring highly efficient O(1) reads/writes for auction bids.', status: 'pending' },
      { id: 't2', title: 'Handle Lock Contention', description: 'Address lock overheads in concurrent memory pool settings using lock-free read operations.', status: 'pending' },
      { id: 't3', title: 'Mitigate Replication Lag', description: 'Implement consistent hashing or read-your-own-writes synchronization checks.', status: 'pending' }
    ],
    skills: [
      { name: 'Concurrency Control', level: 'Architect', weight: 35, description: 'Lock-free programming, mutex strategies, thread pools, and lock contention mitigation.' },
      { name: 'Low-Latency Cache Design', level: 'Architect', weight: 35, description: 'Designing high performance LRU, LFU caches, dynamic replacement policies, and O(1) performance.' },
      { name: 'System Scaling & Consensus', level: 'Expert', weight: 30, description: 'Consistent hashing, replication protocols, vector clocks, and dealing with split-brain scenarios.' }
    ],
    initialCode: `// OPTIBID TECHNOLOGIES - ULTRA-LOW LATENCY AUCTION ENGINE
// TODO: Implement O(1) LRU cache structure and multi-thread sync helpers.

class LRUNode {
  key: string;
  value: any;
  prev: LRUNode | null = null;
  next: LRUNode | null = null;
  constructor(key: string, value: any) { this.key = key; this.value = value; }
}

class BidCache {
  private capacity: number;
  private cache: Map<string, LRUNode> = new Map();
  private head: LRUNode | null = null;
  private tail: LRUNode | null = null;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  // Task 1: O(1) read operation with usage update
  public get(key: string): any {
    // Write your code here
    return null;
  }

  // Task 1: O(1) write operation with eviction policy
  public put(key: string, value: any) {
    // Write your code here
  }
}

// Task 3: Address replication synchronization using vector clock validations
export function checkReplicationSync(clientClock: number[], replicaClock: number[]): boolean {
  // Return true if replica is sync-ready, false if lagging
  return true;
}`,
    language: 'javascript'
  },
  healthcare_ai: {
    id: 'SCENARIO-HEALTHCARE-AI-01',
    title: 'EMR & Care Integration Pipeline',
    subtitle: 'HIPAA-compliant patient data sync and automated care reminders',
    company: '2care.ai',
    role: 'Healthcare & EMR Integration Developer',
    track: 'healthcare_ai',
    difficulty: 'Advanced',
    overview: 'At 2care.ai, security, compliance, and EMR integration are crucial for patient care workflows. You are tasked with designing and implementing a secure, HIPAA-compliant patient communication pipeline that syncs patient demographics with EMR databases (HL7/FHIR format) and fires automated, rate-limited WhatsApp notifications for chronic care management. You must also ensure that all logs are completely redacted of protected health information (PHI) to prevent HIPAA compliance leaks.',
    tasks: [
      { id: 't1', title: 'Map Database to FHIR Resource', description: 'Write an adapter that maps internal patient database objects to a standard HL7 FHIR Patient resource JSON structure.', status: 'pending' },
      { id: 't2', title: 'HIPAA-Compliant PHI Redaction Logger', description: 'Create a logging utility that intercepts log strings and redacts sensitive Protected Health Information (PHI) such as patient names, emails, and phone numbers before writing to cloud log servers.', status: 'pending' },
      { id: 't3', title: 'Sliding Window Rate Limiter', description: 'Implement an in-memory sliding window rate limiter for patient notifications (e.g. max 3 messages per 24 hours per patient) to prevent spamming.', status: 'pending' }
    ],
    skills: [
      { name: 'FHIR / HL7 Standards', level: 'Senior', weight: 35, description: 'Interpreting and structure mapping clinical data onto standard HL7/FHIR formats.' },
      { name: 'HIPAA & PHI Security', level: 'Expert', weight: 35, description: 'Redacting sensitive information, secure audit logs, and compliance mechanisms.' },
      { name: 'API Rate Limiting', level: 'Mid-Senior', weight: 30, description: 'Sliding window, token bucket, and rate limiting algorithms.' }
    ],
    initialCode: `// 2CARE.AI - HEALTHCARE DATA INTEGRATION PROTOCOL
// TODO: Implement the FHIR converter, the secure PHI logger, and the sliding window rate limiter.

// Task 1: Map database record to FHIR Patient resource format
export function convertToFHIRPatient(dbRecord: {
  id: string;
  fullName: string;
  contactEmail: string;
  phoneNumber: string;
  birthDate: string;
  genderCode: 'M' | 'F' | 'O';
}): Record<string, any> {
  // Return a valid HL7 FHIR Patient resource representation
  return {};
}

// Task 2: Implement HIPAA-compliant PHI Redactor for logging
export class PHISecureLogger {
  // Redact Name (if matching words), Email patterns, and 10-digit Phone numbers
  public static redact(message: string): string {
    // Write redaction regex or processing logic here
    return message;
  }
}

// Task 3: Sliding window rate limiter for patient alerts
export class PatientAlertRateLimiter {
  private history: Map<string, number[]> = new Map(); // patientId -> timestamps (ms)
  private maxAlerts: number;
  private windowMs: number;

  constructor(maxAlerts = 3, windowMs = 24 * 60 * 60 * 1000) {
    this.maxAlerts = maxAlerts;
    this.windowMs = windowMs;
  }

  // Returns true if the alert can be sent, false otherwise
  public allowAlert(patientId: string, timestamp: number): boolean {
    // Implement sliding window rate limit checks and clean up old entries
    return true;
  }
}`,
    language: 'javascript'
  }
};

export function getScenarioByTrack(track: string): SimulationScenario {
  return SCENARIOS[track] || SCENARIOS.JS;
}
