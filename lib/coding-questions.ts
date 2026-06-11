export interface CodingQuestion {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  prompt: string;
  initialCode: string;
}

export const codingQuestions: CodingQuestion[] = [
  {
    id: 'q1',
    title: 'Two Sum',
    difficulty: 'Easy',
    topic: 'Arrays / Hashing',
    prompt: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]',
    initialCode: 'function twoSum(nums, target) {\n  // Write your solution here\n  \n}'
  },
  {
    id: 'q2',
    title: 'LRU Cache Design',
    difficulty: 'Medium',
    topic: 'System Design / Data Structures',
    prompt: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the `LRUCache` class:\n- `LRUCache(int capacity)` Initialize the LRU cache with positive size capacity.\n- `int get(int key)` Return the value of the key if the key exists, otherwise return -1.\n- `void put(int key, int value)` Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.\n\nThe functions get and put must each run in O(1) average time complexity.',
    initialCode: 'class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n  }\n\n  get(key) {\n    \n  }\n\n  put(key, value) {\n    \n  }\n}'
  },
  {
    id: 'q3',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    topic: 'Stacks',
    prompt: 'Given a string `s` containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    initialCode: 'function isValid(s) {\n  // Write your solution here\n  \n}'
  },
  {
    id: 'q4',
    title: 'Merge Intervals',
    difficulty: 'Medium',
    topic: 'Sorting / Arrays',
    prompt: 'Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.\n\nExample:\nInput: intervals = [[1,3],[2,6],[8,10],[15,18]]\nOutput: [[1,6],[8,10],[15,18]]\nExplanation: Since intervals [1,3] and [2,6] overlap, merge them into [1,6].',
    initialCode: 'function merge(intervals) {\n  // Write your solution here\n  \n}'
  },
  {
    id: 'q5',
    title: 'Serialize and Deserialize Binary Tree',
    difficulty: 'Hard',
    topic: 'Trees / Design',
    prompt: 'Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer, or transmitted across a network connection link to be reconstructed later in the same or another computer environment.\n\nDesign an algorithm to serialize and deserialize a binary tree. There is no restriction on how your serialization/deserialization algorithm should work. You just need to ensure that a binary tree can be serialized to a string and this string can be deserialized to the original tree structure.',
    initialCode: '/**\n * Definition for a binary tree node.\n * function TreeNode(val) {\n *     this.val = val;\n *     this.left = this.right = null;\n * }\n */\n\n/**\n * Encodes a tree to a single string.\n *\n * @param {TreeNode} root\n * @return {string}\n */\nvar serialize = function(root) {\n    \n};\n\n/**\n * Decodes your encoded data to tree.\n *\n * @param {string} data\n * @return {TreeNode}\n */\nvar deserialize = function(data) {\n    \n};'
  }
];

export function getRandomCodingQuestion(difficulty?: 'Easy' | 'Medium' | 'Hard'): CodingQuestion {
  const filtered = difficulty ? codingQuestions.filter(q => q.difficulty === difficulty) : codingQuestions;
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex] || codingQuestions[0];
}
