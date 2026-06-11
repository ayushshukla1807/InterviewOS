const fs = require('fs');

const roles = ["software_engineer", "data_engineer", "ai_ml_engineer", "frontend", "backend", "fullstack"];
const topics = ['Arrays / Hashing', 'Two Pointers', 'Sliding Window', 'Stack', 'Binary Search', 'Linked List', 'Trees', 'Tries', 'Heap / Priority Queue', 'Backtracking', 'Graphs', 'Advanced Graphs', '1-D Dynamic Programming', '2-D Dynamic Programming', 'Greedy', 'Intervals', 'Math & Geometry', 'Bit Manipulation'];
const difficulties = ['Easy', 'Medium', 'Hard'];
const languages = ['javascript', 'python', 'java', 'cpp', 'react'];

function generateQuestions() {
  const questions = [];
  for (let i = 1; i <= 10000; i++) {
    const role = roles[i % roles.length];
    const topic = topics[i % topics.length];
    const diff = difficulties[i % difficulties.length];
    const lang = languages[i % languages.length];
    
    questions.push(`  {
    id: 'q${i}',
    title: 'Question ${i}',
    difficulty: '${diff}',
    topic: '${topic}',
    language: '${lang}',
    roles: ["${role}"],
    prompt: 'Implement a solution for a ${diff.toLowerCase()} ${topic.toLowerCase()} problem in ${lang}.',
    initialCode: '/* Write your ${lang} code here */'
  }`);
  }
  return questions.join(',\n');
}

const fileContent = `export interface CodingQuestion {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  language: string;
  roles: string[];
  prompt: string;
  initialCode: string;
}

export const codingQuestions: CodingQuestion[] = [
${generateQuestions()}
];

export function getRandomCodingQuestion(roleId?: string, preferredLang?: string): CodingQuestion {
  let filtered = codingQuestions;
  
  if (roleId) {
    filtered = filtered.filter(q => q.roles.includes(roleId));
  }
  
  if (preferredLang) {
    const langFiltered = filtered.filter(q => q.language === preferredLang);
    if (langFiltered.length > 0) filtered = langFiltered;
  }
  
  if (filtered.length === 0) return codingQuestions[0];
  
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
}
`;

fs.writeFileSync('lib/coding-questions.ts', fileContent, 'utf8');
console.log('Successfully generated 10,000 coding questions.');
