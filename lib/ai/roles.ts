export type RoleCategory = 
  | 'software_engineering'
  | 'data_analytics'
  | 'cloud_devops'
  | 'cybersecurity'
  | 'ai_ml'
  | 'management_qa';

export interface RoleConfig {
  id: string;
  title: string;
  category: RoleCategory;
  categoryLabel: string;
  icon: string;
  color: string;           // tailwind color token (e.g. 'indigo')
  description: string;
  coreSkills: string[];
  questionFocus: string[];
  initialGreeting: string; // personalized Syed opening
}

export const ROLE_CATEGORIES: Record<RoleCategory, { label: string; color: string }> = {
  software_engineering: { label: 'Software Development & Engineering', color: 'indigo' },
  data_analytics:       { label: 'Data & Analytics',                  color: 'violet' },
  cloud_devops:         { label: 'Cloud Computing & DevOps',           color: 'sky' },
  cybersecurity:        { label: 'Cybersecurity & IT Infrastructure',  color: 'rose' },
  ai_ml:                { label: 'AI & Machine Learning',              color: 'emerald' },
  management_qa:        { label: 'Management & Quality Assurance',     color: 'amber' },
};

export const ROLES: RoleConfig[] = [
  // ── SOFTWARE ENGINEERING ──────────────────────────────────────────
  {
    id: 'fullstack',
    title: 'Full Stack Developer',
    category: 'software_engineering',
    categoryLabel: 'Software Development & Engineering',
    icon: '',
    color: 'indigo',
    description: 'Builds both the front-end (user-facing) and back-end (server-side) of an application.',
    coreSkills: ['React', 'Node.js', 'REST APIs', 'SQL/NoSQL', 'System Design'],
    questionFocus: [
      'React component lifecycle and state management patterns',
      'Backend API design, authentication, and middleware',
      'Database schema design and query optimization',
      'Deployment pipelines and containerization basics',
      'Security fundamentals: XSS, CSRF, SQL injection prevention',
    ],
    initialGreeting: "Hey {name}! I'm Syed. Super glad you're here. Full Stack engineering is honestly one of the most versatile skill sets out there. Before we get into the technical stuff, tell me — what's a product or feature you've shipped end-to-end recently that you're proud of?",
  },
  {
    id: 'frontend',
    title: 'Frontend Developer',
    category: 'software_engineering',
    categoryLabel: 'Software Development & Engineering',
    icon: '',
    color: 'indigo',
    description: 'Focuses on user experience and the visual elements of a website or app.',
    coreSkills: ['HTML/CSS', 'JavaScript', 'React/Vue', 'Performance', 'Accessibility'],
    questionFocus: [
      'Browser rendering pipeline and paint optimization',
      'React hooks, memoization, and re-render control',
      'CSS architecture: BEM, CSS Modules, CSS-in-JS',
      'Web performance: LCP, CLS, INP metrics',
      'Accessibility standards and ARIA semantics',
    ],
    initialGreeting: "Hi {name}! I'm Syed. Really happy to have you here. Frontend engineering is all about bridging design and logic — which I find really exciting. To kick things off, tell me: what's a performance problem you've debugged in a browser that took you the longest to figure out?",
  },
  {
    id: 'backend',
    title: 'Backend Developer',
    category: 'software_engineering',
    categoryLabel: 'Software Development & Engineering',
    icon: '',
    color: 'indigo',
    description: 'Manages server-side logic, APIs, and database interactions.',
    coreSkills: ['APIs', 'Databases', 'Auth/JWT', 'Caching', 'Microservices'],
    questionFocus: [
      'REST vs GraphQL API design trade-offs',
      'Authentication and authorization patterns (OAuth, JWT, sessions)',
      'Database indexing, query planning, and optimization',
      'Caching strategies: Redis, CDN, in-memory',
      'Concurrency, async patterns, and race conditions',
    ],
    initialGreeting: "Hello {name}! I'm Syed. Backend systems are like the engine of everything we build — can't see them but they power everything. Let's have a relaxed chat first. Tell me about the last API or service you built that you'd build differently today if you had a second shot?",
  },
  {
    id: 'mobile',
    title: 'Mobile App Developer',
    category: 'software_engineering',
    categoryLabel: 'Software Development & Engineering',
    icon: '',
    color: 'indigo',
    description: 'Specializes in creating applications for iOS or Android platforms.',
    coreSkills: ['React Native / Flutter', 'Swift / Kotlin', 'State Management', 'Push Notifications', 'App Store Deployment'],
    questionFocus: [
      'Native vs cross-platform trade-offs (React Native vs Flutter vs Swift)',
      'State management in mobile (Redux, MobX, Provider)',
      'Handling offline-first patterns and local storage',
      'Performance optimization: list rendering, image caching',
      'App lifecycle, deep links, and push notification handling',
    ],
    initialGreeting: "Hey {name}! Syed here. Mobile is such a fascinating space — the constraints you work with are totally different from the web. To start us off, what's the most interesting mobile-specific challenge you had to solve, like dealing with poor networks, battery constraints, or platform quirks?",
  },
  {
    id: 'healthcare_ai',
    title: 'Healthcare & EMR Integration Developer',
    category: 'software_engineering',
    categoryLabel: 'Software Development & Engineering',
    icon: '',
    color: 'indigo',
    description: 'Builds secure healthcare integrations (HL7/FHIR), EMR connections, and HIPAA-compliant patient communication systems.',
    coreSkills: ['FHIR / HL7', 'EMR Integration', 'HIPAA & Security', 'Node.js/Python', 'AI Agents'],
    questionFocus: [
      'FHIR resource mapping and clinical workflow automation (Epic, Cerner)',
      'Designing HIPAA-compliant message delivery and data storage pipelines',
      'Implementing secure WhatsApp/SMS gateways for automated care reminders',
      'LLM reasoning safety, hallucination prevention in clinical triage contexts',
      'Database schema designs for patient scheduling and appointment booking',
    ],
    initialGreeting: "Hi {name}! I'm Syed. Digital health and EMR integrations are so critical — security and interoperability are super important when dealing with patient care. To kick off: tell me about a time you had to design a system with strict security or compliance constraints (like HIPAA) or integrate with a complex external API like an EMR. What was the toughest part?",
  },

  // ── DATA & ANALYTICS ─────────────────────────────────────────────
  {
    id: 'data_scientist',
    title: 'Data Scientist',
    category: 'data_analytics',
    categoryLabel: 'Data & Analytics',
    icon: '',
    color: 'violet',
    description: 'Uses advanced algorithms, ML, and statistical models to predict future trends.',
    coreSkills: ['Python', 'Scikit-learn', 'Statistics', 'Feature Engineering', 'Model Evaluation'],
    questionFocus: [
      'Model selection and bias-variance trade-off',
      'Feature engineering and selection strategies',
      'Overfitting: regularization, cross-validation',
      'Statistical hypothesis testing',
      'End-to-end ML pipeline design',
    ],
    initialGreeting: "Hi {name}! I'm Syed. Data science is where math meets real-world impact — I always find these conversations really stimulating. To start, tell me about a model you've trained: what was the business problem, and how did you validate that it actually worked?",
  },
  {
    id: 'data_engineer',
    title: 'Data Engineer',
    category: 'data_analytics',
    categoryLabel: 'Data & Analytics',
    icon: '',
    color: 'violet',
    description: 'Designs and builds scalable systems for collecting, storing, and analyzing data.',
    coreSkills: ['ETL Pipelines', 'Spark/Airflow', 'Data Warehousing', 'SQL', 'Kafka/Streaming'],
    questionFocus: [
      'ETL vs ELT patterns and when to use each',
      'Data pipeline orchestration with Airflow or similar',
      'Streaming vs batch processing trade-offs',
      'Data warehouse design: star vs snowflake schemas',
      'Handling late data, data quality, and lineage',
    ],
    initialGreeting: "Hey {name}! Syed here. Data engineering is the unsung hero of any analytics operation — without the right pipelines, nothing else works. Tell me: what's the most complex data pipeline you've built or maintained, and what made it challenging?",
  },
  {
    id: 'data_analyst',
    title: 'Data Analyst',
    category: 'data_analytics',
    categoryLabel: 'Data & Analytics',
    icon: '',
    color: 'violet',
    description: 'Cleans, organizes, and visualizes data to create actionable reports.',
    coreSkills: ['SQL', 'Excel/Sheets', 'Tableau/Power BI', 'Python/R', 'Storytelling'],
    questionFocus: [
      'Advanced SQL: window functions, CTEs, query optimization',
      'Data cleaning and handling missing values',
      'Dashboard design principles and stakeholder communication',
      'Statistical analysis: correlation, regression, A/B testing',
      'Translating data insights into business decisions',
    ],
    initialGreeting: "Hi {name}! I'm Syed. Data analysis is all about telling compelling stories with numbers. I love these conversations. To start, walk me through a dashboard or report you created that actually changed a business decision — what was the insight, and how did you present it?",
  },

  // ── CLOUD & DEVOPS ─────────────────────────────────────────────────
  {
    id: 'cloud_engineer',
    title: 'Cloud Engineer',
    category: 'cloud_devops',
    categoryLabel: 'Cloud Computing & DevOps',
    icon: '',
    color: 'sky',
    description: 'Builds and manages cloud infrastructure using AWS, Azure, or GCP.',
    coreSkills: ['AWS/Azure/GCP', 'Terraform/IaC', 'Networking', 'IAM', 'Cost Optimization'],
    questionFocus: [
      'Cloud architecture patterns: multi-region, HA, DR',
      'Infrastructure as Code with Terraform or CloudFormation',
      'Networking: VPCs, subnets, security groups, load balancers',
      'IAM policies, roles, and least privilege principles',
      'Cost optimization strategies and reserved capacity planning',
    ],
    initialGreeting: "Hello {name}! I'm Syed. Cloud infrastructure is what makes modern software scale — and getting it wrong can be expensive, literally! To warm up: walk me through a cloud architecture you designed or significantly contributed to. What were the key trade-offs you made?",
  },
  {
    id: 'devops_engineer',
    title: 'DevOps Engineer',
    category: 'cloud_devops',
    categoryLabel: 'Cloud Computing & DevOps',
    icon: '',
    color: 'sky',
    description: 'Bridges software development and IT operations with automation and continuous delivery.',
    coreSkills: ['CI/CD', 'Docker/Kubernetes', 'Monitoring', 'Scripting', 'Git workflows'],
    questionFocus: [
      'CI/CD pipeline design and optimization',
      'Container orchestration with Kubernetes',
      'Monitoring, observability, and alerting strategies',
      'Blue-green and canary deployment patterns',
      'Incident response: how to handle production outages',
    ],
    initialGreeting: "Hey {name}! Syed here. DevOps is one of those roles where you see the entire software lifecycle — which I think makes you a uniquely valuable engineer. Tell me: what's the fastest you've ever had to triage and resolve a production incident? What was your approach?",
  },

  // ── CYBERSECURITY ──────────────────────────────────────────────────
  {
    id: 'cybersecurity',
    title: 'Cybersecurity Specialist',
    category: 'cybersecurity',
    categoryLabel: 'Cybersecurity & IT Infrastructure',
    icon: '',
    color: 'rose',
    description: 'Monitors networks for security breaches and implements encryptions and firewalls.',
    coreSkills: ['OWASP', 'Penetration Testing', 'SIEM', 'Encryption', 'Threat Modeling'],
    questionFocus: [
      'OWASP Top 10 vulnerabilities and mitigations',
      'Threat modeling and attack surface analysis',
      'Incident response and digital forensics',
      'Encryption: symmetric vs asymmetric, TLS internals',
      'Zero trust architecture principles',
    ],
    initialGreeting: "Hi {name}! I'm Syed. Security is one of the most critical and underappreciated disciplines in tech. To get us started: tell me about a vulnerability you discovered or a security incident you've dealt with. How did you approach it?",
  },
  {
    id: 'network_admin',
    title: 'Network Administrator',
    category: 'cybersecurity',
    categoryLabel: 'Cybersecurity & IT Infrastructure',
    icon: '',
    color: 'rose',
    description: 'Maintains LANs, WANs, and intranets to ensure maximum uptime.',
    coreSkills: ['TCP/IP', 'DNS/DHCP', 'Firewalls', 'VPN', 'Network Monitoring'],
    questionFocus: [
      'OSI model and TCP/IP stack internals',
      'DNS resolution, caching, and TTL troubleshooting',
      'VLAN segmentation and network security',
      'Firewall rules, ACLs, and NAT configuration',
      'Network performance monitoring and diagnostics',
    ],
    initialGreeting: "Hello {name}! I'm Syed. Network administration is fundamental to everything — if the network is down, nothing works. Tell me: what's the most complex network issue you've ever troubleshot? Walk me through how you diagnosed and fixed it.",
  },
  {
    id: 'sysadmin',
    title: 'System Administrator',
    category: 'cybersecurity',
    categoryLabel: 'Cybersecurity & IT Infrastructure',
    icon: '',
    color: 'rose',
    description: 'Installs, upgrades, and monitors an organization\'s software and hardware systems.',
    coreSkills: ['Linux/Windows Admin', 'Shell Scripting', 'Backup & Recovery', 'Virtualization', 'Active Directory'],
    questionFocus: [
      'Linux system hardening and user management',
      'Shell scripting for automation and monitoring',
      'Backup strategies and disaster recovery planning',
      'Virtualization: VMs vs containers',
      'Active Directory and LDAP management',
    ],
    initialGreeting: "Hey {name}! Syed here. SysAdmins keep everything running behind the scenes — it's demanding but incredibly important work. To start: tell me about a system outage or failure you've managed. What was your process for bringing it back online?",
  },

  // ── AI & MACHINE LEARNING ─────────────────────────────────────────
  {
    id: 'ai_ml_engineer',
    title: 'AI / ML Engineer',
    category: 'ai_ml',
    categoryLabel: 'AI & Machine Learning',
    icon: '',
    color: 'emerald',
    description: 'Designs self-running AI software and ML models that automate processes.',
    coreSkills: ['PyTorch/TensorFlow', 'Model Deployment', 'MLOps', 'NLP/CV', 'Feature Engineering'],
    questionFocus: [
      'Neural network architectures: CNNs, RNNs, Transformers',
      'Model training: optimizers, loss functions, regularization',
      'MLOps: model versioning, monitoring, and retraining pipelines',
      'Inference optimization: quantization, pruning, distillation',
      'Evaluation metrics and handling imbalanced datasets',
    ],
    initialGreeting: "Hi {name}! I'm Syed. AI/ML engineering is moving so fast right now — it's honestly one of the most exciting spaces. To start us off: tell me about an ML model you've built or fine-tuned. What problem did it solve, and how did you measure its success?",
  },
  {
    id: 'prompt_engineer',
    title: 'Prompt Engineer',
    category: 'ai_ml',
    categoryLabel: 'AI & Machine Learning',
    icon: '',
    color: 'emerald',
    description: 'Designs and optimizes inputs to get the most accurate responses from Generative AI tools.',
    coreSkills: ['LLM APIs', 'Chain-of-Thought Prompting', 'RAG', 'Evaluation', 'Fine-tuning'],
    questionFocus: [
      'Prompt patterns: few-shot, chain-of-thought, system prompts',
      'RAG architecture: chunking, embedding, retrieval strategies',
      'LLM evaluation: ROUGE, BLEU, human eval frameworks',
      'Hallucination mitigation and grounding techniques',
      'Fine-tuning vs prompting: when to use which',
    ],
    initialGreeting: "Hello {name}! Syed here. Prompt engineering is such a new and fascinating discipline — the interface between human intent and machine behavior. Let's start with something practical: describe a complex prompt you designed. What was the problem, and how did you iterate to get the right output?",
  },
  {
    id: 'ai_engineer',
    title: 'AI Engineer (Applications)',
    category: 'ai_ml',
    categoryLabel: 'AI & Machine Learning',
    icon: '',
    color: 'emerald',
    description: 'Builds AI-powered applications integrating LLMs, RAG, and agentic workflows.',
    coreSkills: ['LangChain/LlamaIndex', 'Vector Databases', 'APIs', 'RAG', 'Agentic Systems'],
    questionFocus: [
      'LLM application architecture: RAG vs fine-tuning',
      'Vector databases: embeddings, indexing, similarity search',
      'Agentic frameworks: tool calling, memory, and orchestration',
      'Latency and cost optimization for LLM inference',
      'Evaluation and testing of AI-powered applications',
    ],
    initialGreeting: "Hey {name}! I'm Syed. AI application engineering is where the rubber meets the road — turning research into products people actually use. To warm up: walk me through an AI-powered feature or application you've shipped. What was the hardest technical problem you had to solve?",
  },

  // ── MANAGEMENT & QA ────────────────────────────────────────────────
  {
    id: 'it_pm',
    title: 'IT Project Manager',
    category: 'management_qa',
    categoryLabel: 'Management & Quality Assurance',
    icon: '',
    color: 'amber',
    description: 'Oversees IT projects, manages timelines, coordinates team efforts, and communicates with clients.',
    coreSkills: ['Agile/Scrum', 'Risk Management', 'Stakeholder Communication', 'Budgeting', 'JIRA/Asana'],
    questionFocus: [
      'Agile ceremonies: how you run sprint planning and retrospectives',
      'Handling scope creep and changing requirements',
      'Risk identification and mitigation strategies',
      'Cross-functional team coordination and conflict resolution',
      'Stakeholder management and executive reporting',
    ],
    initialGreeting: "Hi {name}! I'm Syed. Project management in tech is uniquely challenging — you need to speak both the language of engineers and executives. To start: tell me about a project that went off-track and how you course-corrected it. What were the key decisions you made?",
  },
  {
    id: 'qa_engineer',
    title: 'QA Engineer',
    category: 'management_qa',
    categoryLabel: 'Management & Quality Assurance',
    icon: '',
    color: 'amber',
    description: 'Tests software to identify bugs and glitches before a product reaches end-users.',
    coreSkills: ['Test Automation', 'Selenium/Playwright', 'API Testing', 'Bug Reporting', 'CI Integration'],
    questionFocus: [
      'Test pyramid: unit, integration, and E2E test strategies',
      'Test automation frameworks: Selenium, Playwright, Cypress',
      'API testing with Postman or code-based frameworks',
      'Integrating tests into CI/CD pipelines',
      'Performance and load testing methodologies',
    ],
    initialGreeting: "Hello {name}! Syed here. QA engineers are the last line of defense before users experience something broken — a role I deeply respect. Tell me: what's the most critical bug you ever caught before it went to production? How did you find it?",
  },
  {
    id: 'uiux_designer',
    title: 'UI/UX Designer',
    category: 'management_qa',
    categoryLabel: 'Management & Quality Assurance',
    icon: '',
    color: 'amber',
    description: 'Researches user behavior and designs intuitive, visually pleasing interfaces.',
    coreSkills: ['Figma', 'User Research', 'Wireframing', 'Design Systems', 'Usability Testing'],
    questionFocus: [
      'User research methods: interviews, surveys, usability testing',
      'Design system architecture and component libraries',
      'Wireframing to high-fidelity prototyping workflow',
      'Accessibility in design: WCAG guidelines',
      'Measuring design success: analytics and user metrics',
    ],
    initialGreeting: "Hey {name}! I'm Syed. UI/UX is where empathy meets craft — it's the discipline that makes or breaks a product's success. To start: walk me through a design project you worked on from discovery to delivery. What was the most surprising thing you learned from user research?",
  },
];

// Helper to get role by ID
export const getRoleById = (id: string): RoleConfig | undefined =>
  ROLES.find(r => r.id === id);

// Group roles by category for display
export const getRolesByCategory = (): Record<RoleCategory, RoleConfig[]> => {
  const grouped: any = {};
  for (const cat of Object.keys(ROLE_CATEGORIES) as RoleCategory[]) {
    grouped[cat] = ROLES.filter(r => r.category === cat);
  }
  return grouped;
};
