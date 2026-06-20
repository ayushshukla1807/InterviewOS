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

class InterviewOSQuestionEngine {
  private bank: Question[] = [];

  constructor() {
    this.initializeBank();
  }

  private initializeBank() {
    // Initial Elite Question Set (JS/Fullstack Focus)
    const initialSet: Question[] = [
      {
        id: 'JS-001',
        title: 'Build a Countdown Timer',
        track: 'JS',
        difficulty: 'Beginner',
        category: 'Coding',
        prompt: 'Create a countdown timer in JavaScript (or React). It should take an initial time in seconds, display the time remaining in MM:SS format, and have Start, Pause, and Reset buttons. Ensure the timer does not drift significantly and handles cleanup properly.',
        weightage: 20,
        tags: ['JS', 'React', 'DOM', 'Timers']
      },
      {
        id: 'JS-002',
        title: 'Implement Debounce Function',
        track: 'JS',
        difficulty: 'Intermediate',
        category: 'Coding',
        prompt: 'Write a `debounce` function that takes a function `fn` and a time `t` in milliseconds as input, and returns a debounced version of that function. The debounced function should delay the execution of `fn` until `t` milliseconds have elapsed since the last time the debounced function was invoked.',
        weightage: 25,
        tags: ['JS', 'Closures', 'Optimization']
      },
      {
        id: 'DSA-001',
        title: 'Valid Parentheses',
        track: 'DSA',
        difficulty: 'Beginner',
        category: 'Coding',
        prompt: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets, and in the correct order.',
        weightage: 20,
        tags: ['DSA', 'Stacks', 'Strings']
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

export const questionEngine = new InterviewOSQuestionEngine();
