const fs = require('fs');
const path = require('path');

const roles = [
  'fullstack', 'frontend', 'backend', 'mobile', 'healthcare_ai',
  'data_scientist', 'data_engineer', 'data_analyst', 'cloud_engineer',
  'devops_engineer', 'cybersecurity', 'network_admin', 'sysadmin',
  'ai_ml_engineer', 'prompt_engineer', 'ai_engineer', 'it_pm', 'qa_engineer', 'uiux_designer'
];

const languages = ['javascript', 'java', 'python', 'cpp', 'react'];
const difficulties = ['Easy', 'Medium', 'Hard'];

const templates = [
  {
    topic: 'Arrays / Hashing',
    title: 'Two Sum Variant',
    prompts: [
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
      'Find two elements in the array that sum to a specific value, optimizing for O(N) time.',
      'Implement a hash map approach to find pairs in an array that equal a target sum.'
    ],
    getInitialCode: (lang) => {
      switch(lang) {
        case 'java': return `class Solution {\\n    public int[] twoSum(int[] nums, int target) {\\n        // Your code here\\n    }\\n}`;
        case 'python': return `class Solution:\\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\\n        # Your code here\\n        pass`;
        case 'cpp': return `class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        // Your code here\\n    }\\n};`;
        case 'react': return `export default function TwoSumComponent({ nums, target }) {\\n  // Implement logic and render result\\n  return <div></div>;\\n}`;
        default: return `function twoSum(nums, target) {\\n  // Write your solution here\\n  \\n}`;
      }
    }
  },
  {
    topic: 'System Design / Data Structures',
    title: 'Cache Implementation',
    prompts: [
      'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.',
      'Implement an in-memory Key-Value store with TTL (Time To Live) expiration.',
      'Build a thread-safe LFU (Least Frequently Used) cache with O(1) eviction.'
    ],
    getInitialCode: (lang) => {
      switch(lang) {
        case 'java': return `class LRUCache {\\n    public LRUCache(int capacity) {\\n        \\n    }\\n    \\n    public int get(int key) {\\n        \\n    }\\n    \\n    public void put(int key, int value) {\\n        \\n    }\\n}`;
        case 'python': return `class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n\\n    def get(self, key: int) -> int:\\n        pass\\n\\n    def put(self, key: int, value: int) -> None:\\n        pass`;
        case 'cpp': return `class LRUCache {\\npublic:\\n    LRUCache(int capacity) {\\n        \\n    }\\n    \\n    int get(int key) {\\n        \\n    }\\n    \\n    void put(int key, int value) {\\n        \\n    }\\n};`;
        case 'react': return `import { useState } from 'react';\\n\\nexport function useLRUCache(capacity) {\\n  // Implement custom hook for LRU cache state\\n  return { get, put };\\n}`;
        default: return `class LRUCache {\\n  constructor(capacity) {\\n    this.capacity = capacity;\\n  }\\n  get(key) {\\n    \\n  }\\n  put(key, value) {\\n    \\n  }\\n}`;
      }
    }
  },
  {
    topic: 'Trees / Graphs',
    title: 'Traversal Algorithm',
    prompts: [
      'Implement a level-order traversal (BFS) of a binary tree.',
      'Given a graph represented as an adjacency list, detect if there is a cycle.',
      'Find the shortest path in an unweighted grid using BFS.'
    ],
    getInitialCode: (lang) => {
      switch(lang) {
        case 'java': return `class Solution {\\n    public List<List<Integer>> levelOrder(TreeNode root) {\\n        // Your code here\\n    }\\n}`;
        case 'python': return `class Solution:\\n    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:\\n        # Your code here\\n        pass`;
        case 'cpp': return `class Solution {\\npublic:\\n    vector<vector<int>> levelOrder(TreeNode* root) {\\n        // Your code here\\n    }\\n};`;
        case 'react': return `export default function TreeVisualizer({ root }) {\\n  // Implement traversal and render tree nodes\\n  return <div></div>;\\n}`;
        default: return `function levelOrder(root) {\\n  // Write your solution here\\n  \\n}`;
      }
    }
  },
  {
    topic: 'Sorting / Search',
    title: 'Optimized Search',
    prompts: [
      'Search for a target value in a rotated sorted array in O(log N) time.',
      'Find the k-th largest element in an unsorted array.',
      'Implement binary search on a 2D matrix where rows and columns are sorted.'
    ],
    getInitialCode: (lang) => {
      switch(lang) {
        case 'java': return `class Solution {\\n    public int search(int[] nums, int target) {\\n        // Your code here\\n    }\\n}`;
        case 'python': return `class Solution:\\n    def search(self, nums: List[int], target: int) -> int:\\n        # Your code here\\n        pass`;
        case 'cpp': return `class Solution {\\npublic:\\n    int search(vector<int>& nums, int target) {\\n        // Your code here\\n    }\\n};`;
        case 'react': return `export default function BinarySearchDemo({ arr, target }) {\\n  // Implement search visualization\\n  return <div></div>;\\n}`;
        default: return `function search(nums, target) {\\n  // Write your solution here\\n  \\n}`;
      }
    }
  },
  {
    topic: 'Dynamic Programming',
    title: 'Optimization Problem',
    prompts: [
      'Given a set of items with weights and values, maximize the value in a knapsack of capacity W.',
      'Find the length of the longest palindromic substring.',
      'Determine the minimum number of coins needed to make up a given amount.'
    ],
    getInitialCode: (lang) => {
      switch(lang) {
        case 'java': return `class Solution {\\n    public int knapsack(int[] weights, int[] values, int capacity) {\\n        // Your code here\\n    }\\n}`;
        case 'python': return `class Solution:\\n    def knapsack(self, weights: List[int], values: List[int], capacity: int) -> int:\\n        # Your code here\\n        pass`;
        case 'cpp': return `class Solution {\\npublic:\\n    int knapsack(vector<int>& weights, vector<int>& values, int capacity) {\\n        // Your code here\\n    }\\n};`;
        case 'react': return `export default function DpVisualizer({ items, capacity }) {\\n  // Render DP table\\n  return <div></div>;\\n}`;
        default: return `function knapsack(weights, values, capacity) {\\n  // Write your solution here\\n  \\n}`;
      }
    }
  }
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const numQuestions = 1000;

let output = "export interface CodingQuestion {\\n  id: string;\\n  title: string;\\n  difficulty: 'Easy' | 'Medium' | 'Hard';\\n  topic: string;\\n  language: string;\\n  roles: string[];\\n  prompt: string;\\n  initialCode: string;\\n}\\n\\nexport const codingQuestions: CodingQuestion[] = [\\n";

for (let i = 1; i <= numQuestions; i++) {
  const template = getRandomElement(templates);
  const language = getRandomElement(languages);
  const difficulty = getRandomElement(difficulties);
  
  const numRoles = Math.floor(Math.random() * 4) + 1;
  const assignedRoles = [];
  for(let r = 0; r < numRoles; r++) {
    const role = getRandomElement(roles);
    if (!assignedRoles.includes(role)) assignedRoles.push(role);
  }

  const q = {
    id: "q" + i,
    title: template.title + " (" + language + ")",
    difficulty: difficulty,
    topic: template.topic,
    language: language,
    roles: assignedRoles,
    prompt: getRandomElement(template.prompts),
    initialCode: template.getInitialCode(language)
  };

  const objStr = "  {\\n" +
    "    id: '" + q.id + "',\\n" +
    "    title: '" + q.title + "',\\n" +
    "    difficulty: '" + q.difficulty + "',\\n" +
    "    topic: '" + q.topic + "',\\n" +
    "    language: '" + q.language + "',\\n" +
    "    roles: " + JSON.stringify(q.roles) + ",\\n" +
    "    prompt: `" + q.prompt.replace(/\`/g, "\\\\`") + "`" + ",\\n" +
    "    initialCode: `" + q.initialCode.replace(/\`/g, "\\\\`") + "`" + "\\n" +
    "  }";

  output += objStr;
  if (i < numQuestions) output += ',\\n';
}

output += "\\n];\\n\\nexport function getRandomCodingQuestion(roleId?: string, preferredLang?: string): CodingQuestion {\\n  let filtered = codingQuestions;\\n  \\n  if (roleId) {\\n    filtered = filtered.filter(q => q.roles.includes(roleId));\\n  }\\n  \\n  if (preferredLang) {\\n    const langFiltered = filtered.filter(q => q.language === preferredLang);\\n    if (langFiltered.length > 0) filtered = langFiltered;\\n  }\\n  \\n  if (filtered.length === 0) return codingQuestions[0];\\n  \\n  const randomIndex = Math.floor(Math.random() * filtered.length);\\n  return filtered[randomIndex];\\n}\\n";

const targetPath = path.join(__dirname, 'lib', 'coding-questions.ts');
fs.writeFileSync(targetPath, output);
console.log("Generated " + numQuestions + " questions to " + targetPath);
