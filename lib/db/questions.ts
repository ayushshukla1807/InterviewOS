export type Question = {
  id: string;
  title: string;
  track: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Architect';
  category: 'Coding' | 'System Design' | 'Theoretical' | 'Behavioral';
  prompt: string;
  weightage: number;
  tags: string[];
};

class HyrteQuestionEngine {
  private bank: Question[] = [];

  constructor() {
    this.initializeBank();
  }

  private initializeBank() {
    // Initial Elite Question Set (JS/Fullstack Focus)
    const initialSet: Question[] = [
      {
        id: 'JS-001',
        title: 'V8 Memory Management & Scavenge Algorithm',
        track: 'JS',
        difficulty: 'Advanced',
        category: 'Theoretical',
        prompt: 'How does the V8 engine distinguish between the Young Generation and Old Generation? Explain the "Scavenge" algorithm and how "closures" can lead to memory leaks in long-running Node.js processes.',
        weightage: 25,
        tags: ['V8', 'Memory', 'Optimization']
      },
      {
        id: 'SEC-001',
        title: 'Zero-Knowledge Proofs in Auth Systems',
        track: 'Security',
        difficulty: 'Expert',
        category: 'System Design',
        prompt: 'How would you implement a ZKP-based authentication system to prevent server-side password storage? Discuss the trade-offs between computational overhead and security.',
        weightage: 40,
        tags: ['Cryptography', 'Security', 'Architecture']
      },
      {
        id: 'OPS-001',
        title: 'Multi-Region Kubernetes Traffic Splitting',
        track: 'DevOps',
        difficulty: 'Architect',
        category: 'Coding',
        prompt: 'Design an Istio-based traffic splitting strategy for a blue-green deployment across 3 global clusters. How do you handle sticky sessions in a stateless environment?',
        weightage: 35,
        tags: ['Kubernetes', 'Istio', 'Scale']
      }
    ];

    const mockCategories = ['JS', 'Security', 'DevOps', 'Backend', 'Python', 'Go', 'Data'];
    const mockDifficulties: Question['difficulty'][] = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Architect'];

    for (let i = 0; i < 5000; i++) {
      const track = mockCategories[Math.floor(Math.random() * mockCategories.length)];
      const diff = mockDifficulties[Math.floor(Math.random() * mockDifficulties.length)];
      this.bank.push({
        id: `Q-${i}`,
        title: `${track} Optimization Challenge #${Math.floor(Math.random() * 1000)}`,
        track,
        difficulty: diff,
        category: i % 3 === 0 ? 'Coding' : 'Theoretical',
        prompt: `Deep dive into ${track} optimization strategy #${i}. [Dynamic elite technical scenario focused on ${diff} level challenges].`,
        weightage: Math.floor(Math.random() * 50) + 10,
        tags: [track, 'Assessment', 'Enterprise']
      });
    }

    this.bank = [...initialSet, ...this.bank];
  }

  public getQuestionsByTrack(track: string): Question[] {
    return this.bank.filter(q => q.track === track || q.track === 'JS'); 
  }

  public getAdaptiveChallenge(track: string, currentScore: number): Question {
    const trackQuestions = this.getQuestionsByTrack(track);
    if (currentScore > 80) {
      return trackQuestions.find(q => q.difficulty === 'Expert' || q.difficulty === 'Architect') || trackQuestions[0];
    }
    return trackQuestions[Math.floor(Math.random() * 10)]; 
  }

  public getTotalCount(): number {
    return this.bank.length;
  }
}

export const questionEngine = new HyrteQuestionEngine();
