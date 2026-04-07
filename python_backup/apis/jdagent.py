import logging
import json
import asyncio
import hashlib
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set
from dotenv import load_dotenv
import os

# --------------------------------------------------
# Logging
# --------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("jd-assessment-agent")

# --------------------------------------------------
# Load env
# --------------------------------------------------
load_dotenv()

# --------------------------------------------------
# Core Trait Definitions
# --------------------------------------------------
CORE_TRAITS = {
    "Personality": [
        "Leadership",
        "Accountability", 
        "Adaptability",
        "Stress Tolerance",
        "Ownership Mindset",
        "Initiative",
        "Teamwork",
        "Resilience"
    ],
    "Communication": [
        "Clarity of Expression",
        "Listening Behavior",
        "Conflict Handling",
        "Persuasion Style",
        "Written Communication",
        "Presentation Skills",
        "Feedback Reception"
    ],
    "Integrity": [
        "Ethical Decision Making",
        "Honesty",
        "Reliability",
        "Accountability for Mistakes",
        "Confidentiality",
        "Fairness"
    ],
    "Cognitive Ability": [
        "Problem Solving",
        "Analytical Thinking",
        "Pattern Recognition",
        "Learning Agility",
        "Critical Thinking",
        "Decision Speed",
        "Attention to Detail"
    ],
    "Risk and Decision Making": [
        "Risk Assessment",
        "Data-Driven Decisions",
        "Intuitive Judgment",
        "Decisiveness",
        "Strategic Thinking",
        "Trade-off Analysis"
    ]
}

QUESTION_FORMATS = [
    "situational_mcq",      # Scenario with multiple choice actions
    "behavioral_scale",     # Likert scale on past behavior
    "preference_choice",    # Choose between two approaches
    "text_response",        # Short text answer
    "ranking"               # Rank options by preference
]

# --------------------------------------------------
# Test State Management
# --------------------------------------------------
@dataclass
class AssessmentState:
    job_description: Optional[str] = None
    job_title: Optional[str] = None
    extracted_skills: List[str] = field(default_factory=list)
    
    # Trait configuration
    selected_traits: Dict[str, str] = field(default_factory=dict)
    trait_characteristics: Dict[str, List[str]] = field(default_factory=dict)
    
    # Assessment progress
    current_phase: str = "jd_input"
    current_question_index: int = 0
    total_questions: int = 0
    
    # Questions and responses
    personality_questions: List[Dict] = field(default_factory=list)
    skills_questions: List[Dict] = field(default_factory=list)
    current_question: Optional[Dict] = None
    
    # Scoring
    trait_scores: Dict[str, List[int]] = field(default_factory=dict)
    characteristic_scores: Dict[str, List[int]] = field(default_factory=dict)
    skills_scores: Dict[str, int] = field(default_factory=dict)
    
    response_history: List[Dict] = field(default_factory=list)
    used_question_hashes: Set[str] = field(default_factory=set)

# --------------------------------------------------
# JD Analyzer (AI-powered)
# --------------------------------------------------
class JDAnalyzer:
    def __init__(self):
        import openai
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    async def analyze_jd(self, jd_text: str) -> Dict:
        """Extract job title, skills, and recommend traits from JD"""
        prompt = f"""Analyze this Job Description and extract key information:

Job Description:
{jd_text}

Provide a JSON response with:
1. job_title: The main job title/role
2. required_skills: List of 5-10 key technical/functional skills required
3. recommended_traits: For each core trait, assign priority (High/Medium/Low/None)

Core traits to evaluate:
- Personality (leadership, accountability, adaptability, etc.)
- Communication (clarity, listening, conflict handling, etc.)
- Integrity (ethics, honesty, reliability, etc.)
- Cognitive Ability (problem solving, analytical thinking, etc.)
- Risk and Decision Making (risk assessment, decisiveness, etc.)

Return ONLY valid JSON in this format:
{{
    "job_title": "extracted title",
    "required_skills": ["skill1", "skill2", ...],
    "recommended_traits": {{
        "Personality": "High/Medium/Low/None",
        "Communication": "High/Medium/Low/None",
        "Integrity": "High/Medium/Low/None",
        "Cognitive Ability": "High/Medium/Low/None",
        "Risk and Decision Making": "High/Medium/Low/None"
    }}
}}"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert HR analyst. Always return valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Clean JSON
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            return json.loads(response_text.strip())
            
        except Exception as e:
            logger.error(f"Error analyzing JD: {e}")
            return {
                "job_title": "Unknown Position",
                "required_skills": [],
                "recommended_traits": {
                    "Personality": "Medium",
                    "Communication": "Medium",
                    "Integrity": "Medium",
                    "Cognitive Ability": "Medium",
                    "Risk and Decision Making": "Medium"
                }
            }

# --------------------------------------------------
# Enhanced Question Generator
# --------------------------------------------------
class AssessmentQuestionGenerator:
    def __init__(self):
        import openai
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    def _hash_question(self, question_text: str) -> str:
        """Generate hash for deduplication"""
        return hashlib.md5(question_text.lower().strip().encode()).hexdigest()
    
    async def generate_personality_questions(
        self, 
        trait: str, 
        characteristics: List[str],
        job_context: str,
        count: int = 3
    ) -> List[Dict]:
        """Generate diverse personality assessment questions"""
        
        # Distribute across different question formats
        format_distribution = self._distribute_formats(count)
        
        all_questions = []
        
        for question_format, format_count in format_distribution.items():
            questions = await self._generate_questions_by_format(
                trait=trait,
                characteristics=characteristics,
                job_context=job_context,
                question_format=question_format,
                count=format_count
            )
            all_questions.extend(questions)
        
        return all_questions
    
    def _distribute_formats(self, total_count: int) -> Dict[str, int]:
        """Distribute questions across different formats"""
        distribution = {}
        
        if total_count <= 2:
            distribution["situational_mcq"] = total_count
        elif total_count == 3:
            distribution["situational_mcq"] = 1
            distribution["behavioral_scale"] = 1
            distribution["preference_choice"] = 1
        elif total_count == 4:
            distribution["situational_mcq"] = 2
            distribution["text_response"] = 1
            distribution["preference_choice"] = 1
        else:  # 5+
            distribution["situational_mcq"] = 2
            distribution["behavioral_scale"] = 1
            distribution["text_response"] = 1
            distribution["preference_choice"] = 1
            if total_count > 5:
                distribution["ranking"] = total_count - 5
        
        return distribution
    
    async def _generate_questions_by_format(
        self,
        trait: str,
        characteristics: List[str],
        job_context: str,
        question_format: str,
        count: int
    ) -> List[Dict]:
        """Generate questions for a specific format"""
        
        format_prompts = {
            "situational_mcq": self._get_situational_mcq_prompt,
            "behavioral_scale": self._get_behavioral_scale_prompt,
            "preference_choice": self._get_preference_choice_prompt,
            "text_response": self._get_text_response_prompt,
            "ranking": self._get_ranking_prompt
        }
        
        prompt_generator = format_prompts.get(question_format)
        if not prompt_generator:
            return []
        
        prompt = prompt_generator(trait, characteristics, job_context, count)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert organizational psychologist creating nuanced personality assessments. Avoid obvious 'right answers' or moral dilemmas. Focus on behavioral preferences and decision-making styles."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.9,
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Clean JSON
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            questions = json.loads(response_text.strip())
            
            # Add metadata
            for q in questions:
                q['hash'] = self._hash_question(q.get('scenario', q.get('question', '')))
                q['trait'] = trait
                q['format'] = question_format
            
            return questions
            
        except Exception as e:
            logger.error(f"Error generating {question_format} questions: {e}")
            return []
    
    def _get_situational_mcq_prompt(self, trait: str, characteristics: List[str], job_context: str, count: int) -> str:
        return f"""Generate {count} situational multiple-choice questions for "{trait}" trait in this job context:

Job Context: {job_context}
Characteristics to assess: {', '.join(characteristics)}

CRITICAL REQUIREMENTS:
1. Create realistic workplace scenarios with NO obvious "right" answer
2. All options should be reasonable approaches that different personality types might choose
3. Options should reveal behavioral preferences, NOT moral character
4. Avoid scenarios where one option is clearly unethical or incompetent
5. Focus on HOW people approach tasks, not WHETHER they do the right thing

Example (Good):
"Your team is behind schedule on a project. The deadline is in 3 days. You have two competing priorities: ensuring quality or meeting the timeline. What's your most likely approach?"
A) Focus on completing core features perfectly, even if it means missing the deadline by a day
B) Deliver on time with good-enough quality, planning improvements for the next iteration
C) Negotiate with stakeholders for a 2-day extension to balance both quality and completeness
D) Rally the team for overtime to attempt meeting both quality and timeline goals

Return ONLY valid JSON array:
[
    {{
        "scenario": "realistic workplace situation",
        "options": ["A) option 1", "B) option 2", "C) option 3", "D) option 4"],
        "characteristic": "specific characteristic",
        "scoring": {{
            "A": {{"trait_alignment": 0.7, "characteristic_focus": "detail orientation"}},
            "B": {{"trait_alignment": 0.8, "characteristic_focus": "pragmatism"}},
            "C": {{"trait_alignment": 0.9, "characteristic_focus": "strategic thinking"}},
            "D": {{"trait_alignment": 0.6, "characteristic_focus": "drive"}}
        }}
    }}
]"""

    def _get_behavioral_scale_prompt(self, trait: str, characteristics: List[str], job_context: str, count: int) -> str:
        return f"""Generate {count} behavioral frequency scale questions for "{trait}" trait:

Job Context: {job_context}
Characteristics: {', '.join(characteristics)}

REQUIREMENTS:
1. Ask about ACTUAL behaviors, not self-perception or aspirations
2. Use frequency-based responses (Never/Rarely/Sometimes/Often/Always)
3. Avoid socially desirable phrasing
4. Focus on specific, observable actions
5. No obvious "best" answer - different frequencies suit different roles

Example:
"In the past 6 months, how often have you taken on additional projects outside your core responsibilities?"

Return JSON:
[
    {{
        "question": "specific behavioral question about frequency",
        "characteristic": "characteristic name",
        "scale_type": "frequency",
        "high_score_anchor": "Always",
        "optimal_range": "Often to Always indicates high initiative"
    }}
]"""

    def _get_preference_choice_prompt(self, trait: str, characteristics: List[str], job_context: str, count: int) -> str:
        return f"""Generate {count} preference choice questions for "{trait}" trait:

Job Context: {job_context}
Characteristics: {', '.join(characteristics)}

REQUIREMENTS:
1. Present two equally valid but different approaches
2. Neither option should be "wrong" - they reveal different working styles
3. Make choices realistic and context-specific
4. Avoid extreme or obviously bad options

Example:
"When starting a complex project, which approach feels more natural to you?"
A) Dive into research and planning before taking action - I prefer having a clear roadmap
B) Start with small experiments and adjust based on what I learn - I prefer learning by doing

Return JSON:
[
    {{
        "question": "Which approach do you naturally prefer?",
        "option_a": "First approach with brief rationale",
        "option_b": "Second approach with brief rationale",
        "characteristic": "characteristic name",
        "scoring": {{"A": 0.7, "B": 0.9}}
    }}
]"""

    def _get_text_response_prompt(self, trait: str, characteristics: List[str], job_context: str, count: int) -> str:
        return f"""Generate {count} short text response questions for "{trait}" trait:

Job Context: {job_context}
Characteristics: {', '.join(characteristics)}

REQUIREMENTS:
1. Ask for specific examples or descriptions (2-3 sentences)
2. Questions should reveal thought processes and priorities
3. No "correct" answer - evaluating approach and reasoning
4. Focus on real situations, not hypotheticals

Example:
"Describe a recent situation where you had to make a decision without having all the information you wanted. What factors did you consider?"

Return JSON:
[
    {{
        "question": "open-ended question requiring 2-3 sentence response",
        "characteristic": "characteristic name",
        "evaluation_criteria": ["criteria1", "criteria2", "criteria3"],
        "keywords_positive": ["keyword1", "keyword2"],
        "keywords_negative": ["keyword1", "keyword2"]
    }}
]"""

    def _get_ranking_prompt(self, trait: str, characteristics: List[str], job_context: str, count: int) -> str:
        return f"""Generate {count} ranking questions for "{trait}" trait:

Job Context: {job_context}
Characteristics: {', '.join(characteristics)}

REQUIREMENTS:
1. Present 4-5 items to rank by importance or preference
2. All items should be valuable - ranking reveals priorities
3. No "trap" options that are obviously bad
4. Context-specific to the job role

Example:
"When evaluating a new business opportunity, rank these factors by how much weight you'd give them (1=most important, 4=least important):"
- Potential revenue impact
- Alignment with long-term strategy
- Resource requirements
- Speed to market

Return JSON:
[
    {{
        "question": "Rank these by importance/preference",
        "items": ["item1", "item2", "item3", "item4"],
        "characteristic": "characteristic name",
        "ideal_ranking": [2, 1, 4, 3]
    }}
]"""
    
    async def generate_skills_question(
        self,
        skill: str,
        job_context: str,
        difficulty: str = "Medium"
    ) -> Dict:
        """Generate a multiple-choice skills question"""
        
        prompt = f"""Generate a practical skills assessment question for "{skill}" in this job context:

Job Context: {job_context}
Difficulty: {difficulty}

Requirements:
1. Create ONE realistic scenario-based question
2. Include exactly 4 options (A, B, C, D)
3. Only ONE correct answer
4. Question should test practical application, not just theory
5. Include brief explanation for correct answer

Return ONLY valid JSON:
{{
    "question": "Scenario or question here",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correct": "A",
    "explanation": "Why this is correct"
}}"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert technical assessor."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Clean JSON
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            question = json.loads(response_text.strip())
            question['hash'] = self._hash_question(question['question'])
            question['skill'] = skill
            
            return question
            
        except Exception as e:
            logger.error(f"Error generating skills question: {e}")
            return None

# --------------------------------------------------
# Enhanced Scoring Engine
# --------------------------------------------------
class AssessmentScorer:
    
    @staticmethod
    def score_personality_response(question: Dict, response: str) -> int:
        """Score personality question based on format"""
        question_format = question.get('format', 'behavioral_scale')
        
        if question_format == 'situational_mcq':
            # Score based on alignment
            scoring = question.get('scoring', {})
            score_data = scoring.get(response.upper(), {})
            alignment = score_data.get('trait_alignment', 0.5)
            return int(alignment * 5)  # Convert to 1-5 scale
        
        elif question_format == 'behavioral_scale':
            # Frequency scale: Never(1) to Always(5)
            scale_map = {
                'never': 1, 'rarely': 2, 'sometimes': 3, 
                'often': 4, 'always': 5
            }
            return scale_map.get(response.lower(), 3)
        
        elif question_format == 'preference_choice':
            # A or B choice
            scoring = question.get('scoring', {'A': 0.6, 'B': 0.8})
            score_value = scoring.get(response.upper(), 0.5)
            return int(score_value * 5)
        
        elif question_format == 'ranking':
            # Compare to ideal ranking
            try:
                user_ranking = [int(x.strip()) for x in response.split(',')]
                ideal = question.get('ideal_ranking', [])
                
                # Calculate similarity (inverse of difference)
                if len(user_ranking) == len(ideal):
                    differences = sum(abs(user_ranking[i] - ideal[i]) for i in range(len(ideal)))
                    max_diff = len(ideal) * (len(ideal) - 1)
                    similarity = 1 - (differences / max_diff)
                    return int(similarity * 4) + 1  # 1-5 scale
            except:
                pass
            return 3
        
        else:  # text_response or default
            # For text responses, return neutral score (manual review needed)
            return 3
    
    @staticmethod
    def score_text_response(question: Dict, response: str) -> int:
        """Basic keyword-based scoring for text responses"""
        positive_keywords = question.get('keywords_positive', [])
        negative_keywords = question.get('keywords_negative', [])
        
        response_lower = response.lower()
        
        positive_count = sum(1 for kw in positive_keywords if kw.lower() in response_lower)
        negative_count = sum(1 for kw in negative_keywords if kw.lower() in response_lower)
        
        # Simple scoring: 3 (neutral) + positive - negative
        score = 3 + positive_count - negative_count
        return max(1, min(5, score))
    
    @staticmethod
    def calculate_trait_score(scores: List[int]) -> Dict:
        """Calculate aggregate trait score"""
        if not scores:
            return {"score": 0, "percentage": 0, "level": "Not Assessed"}
        
        avg_score = sum(scores) / len(scores)
        percentage = ((avg_score - 1) / 4) * 100
        
        if percentage >= 80:
            level = "Excellent"
        elif percentage >= 65:
            level = "Strong"
        elif percentage >= 50:
            level = "Adequate"
        elif percentage >= 35:
            level = "Developing"
        else:
            level = "Needs Improvement"
        
        return {
            "score": round(avg_score, 2),
            "percentage": round(percentage, 1),
            "level": level,
            "responses": len(scores)
        }
    
    @staticmethod
    def calculate_overall_fit(state: AssessmentState) -> Dict:
        """Calculate overall candidate fit score"""
        
        personality_scores = []
        trait_breakdown = {}
        
        for trait, priority in state.selected_traits.items():
            if trait in state.trait_scores and state.trait_scores[trait]:
                trait_result = AssessmentScorer.calculate_trait_score(state.trait_scores[trait])
                trait_breakdown[trait] = trait_result
                
                weight = {"High": 1.5, "Medium": 1.0, "Low": 0.5}.get(priority, 1.0)
                personality_scores.append(trait_result['percentage'] * weight)
        
        personality_score = sum(personality_scores) / len(personality_scores) if personality_scores else 0
        
        skills_correct = sum(1 for score in state.skills_scores.values() if score > 0)
        skills_total = len(state.skills_scores)
        skills_score = (skills_correct / skills_total * 100) if skills_total > 0 else 0
        
        overall_score = (personality_score * 0.6) + (skills_score * 0.4)
        
        if overall_score >= 80:
            recommendation = "Highly Recommended"
        elif overall_score >= 65:
            recommendation = "Recommended"
        elif overall_score >= 50:
            recommendation = "Consider with Reservations"
        else:
            recommendation = "Not Recommended"
        
        return {
            "overall_score": round(overall_score, 1),
            "personality_score": round(personality_score, 1),
            "skills_score": round(skills_score, 1),
            "recommendation": recommendation,
            "trait_breakdown": trait_breakdown,
            "skills_breakdown": state.skills_scores
        }

# --------------------------------------------------
# Console Assessment Handler
# --------------------------------------------------
class ConsoleAssessmentAgent:
    def __init__(self):
        self.state = AssessmentState()
        self.jd_analyzer = JDAnalyzer()
        self.question_generator = AssessmentQuestionGenerator()
        self.scorer = AssessmentScorer()
    
    async def send_message(self, text: str):
        """Display message to user"""
        print("\n" + "="*70)
        print(text)
        print("="*70 + "\n")
    
    async def handle_jd_input(self, jd_text: str):
        """Process job description"""
        await self.send_message("📋 Analyzing Job Description...")
        
        analysis = await self.jd_analyzer.analyze_jd(jd_text)
        
        self.state.job_description = jd_text
        self.state.job_title = analysis['job_title']
        self.state.extracted_skills = analysis['required_skills']
        
        for trait, priority in analysis['recommended_traits'].items():
            if priority != "None":
                self.state.selected_traits[trait] = priority
                self.state.trait_characteristics[trait] = CORE_TRAITS.get(trait, [])
        
        summary = f"""
✅ Job Description Analyzed Successfully!

📌 Position: {self.state.job_title}

🎯 Key Skills Identified:
{chr(10).join(f"   • {skill}" for skill in self.state.extracted_skills[:10])}

🧠 Recommended Assessment Traits:
{chr(10).join(f"   • {trait}: {priority} Priority" for trait, priority in self.state.selected_traits.items())}

The assessment will consist of:
   1. Personality Assessment (Mixed question formats)
   2. Skills Assessment (Multiple choice questions)
"""
        await self.send_message(summary)
        
        self.state.current_phase = "personality_test"
        await self.prepare_personality_test()
    
    async def prepare_personality_test(self):
        """Generate personality questions for all traits"""
        await self.send_message("🔄 Generating personalized assessment questions...")
        
        all_questions = []
        
        for trait, priority in self.state.selected_traits.items():
            characteristics = self.state.trait_characteristics.get(trait, [])
            
            question_count = {"High": 5, "Medium": 3, "Low": 2}.get(priority, 3)
            
            questions = await self.question_generator.generate_personality_questions(
                trait=trait,
                characteristics=characteristics,
                job_context=f"{self.state.job_title}: {self.state.job_description[:300]}",
                count=question_count
            )
            
            all_questions.extend(questions)
        
        self.state.personality_questions = all_questions
        self.state.total_questions = len(all_questions)
        self.state.current_question_index = 0
        
        for trait in self.state.selected_traits.keys():
            self.state.trait_scores[trait] = []
        
        await self.send_message(f"""
✅ Assessment Ready!

📊 Total Questions: {self.state.total_questions} personality + {len(self.state.extracted_skills)} skills

Let's begin with the personality assessment.
Questions will use different formats:
   • Situational scenarios (choose A/B/C/D)
   • Behavioral frequency (Never/Rarely/Sometimes/Often/Always)
   • Preference choices (A or B)
   • Text responses (2-3 sentences)
   • Rankings (order by preference)

Be honest - this reveals your working style, not your character!
""")
        
        await self.show_next_personality_question()
    
    async def show_next_personality_question(self):
        """Display next personality question with appropriate format"""
        if self.state.current_question_index >= len(self.state.personality_questions):
            await self.prepare_skills_test()
            return
        
        question = self.state.personality_questions[self.state.current_question_index]
        self.state.current_question = question
        
        q_num = self.state.current_question_index + 1
        total = len(self.state.personality_questions)
        
        q_format = question.get('format', 'behavioral_scale')
        
        # Format-specific display
        if q_format == 'situational_mcq':
            q_text = f"""
📝 Personality Question {q_num}/{total} [Situational Scenario]

Trait: {question['trait']} → {question['characteristic']}

{question['scenario']}

{chr(10).join(question['options'])}

Your answer (A/B/C/D):
"""
        
        elif q_format == 'behavioral_scale':
            q_text = f"""
📝 Personality Question {q_num}/{total} [Behavioral Frequency]

Trait: {question['trait']} → {question['characteristic']}

{question['question']}

How often? (Enter: Never/Rarely/Sometimes/Often/Always):
"""
        
        elif q_format == 'preference_choice':
            q_text = f"""
📝 Personality Question {q_num}/{total} [Preference Choice]

Trait: {question['trait']} → {question['characteristic']}

{question['question']}

A) {question['option_a']}

B) {question['option_b']}

Your choice (A or B):
"""
        
        elif q_format == 'text_response':
            q_text = f"""
📝 Personality Question {q_num}/{total} [Text Response]

Trait: {question['trait']} → {question['characteristic']}

{question['question']}

Your response (2-3 sentences):
"""
        
        elif q_format == 'ranking':
            items_display = '\n'.join([f"   {i+1}. {item}" for i, item in enumerate(question['items'])])
            q_text = f"""
📝 Personality Question {q_num}/{total} [Ranking]

Trait: {question['trait']} → {question['characteristic']}

{question['question']}

{items_display}

Rank them by entering numbers separated by commas (e.g., 2,1,4,3):
"""
        else:
            q_text = f"Question {q_num}/{total}: {question}"
        
        await self.send_message(q_text)
    
    async def handle_personality_response(self, response: str):
        """Process personality question response based on format"""
        question = self.state.current_question
        q_format = question.get('format', 'behavioral_scale')
        
        # Validate and score based on format
        if q_format == 'situational_mcq':
            if response.upper() not in ['A', 'B', 'C', 'D']:
                await self.send_message("❌ Please enter A, B, C, or D")
                return
        
        elif q_format == 'behavioral_scale':
            if response.lower() not in ['never', 'rarely', 'sometimes', 'often', 'always']:
                await self.send_message("❌ Please enter: Never, Rarely, Sometimes, Often, or Always")
                return
        
        elif q_format == 'preference_choice':
            if response.upper() not in ['A', 'B']:
                await self.send_message("❌ Please enter A or B")
                return
        
        elif q_format == 'ranking':
            try:
                rankings = [int(x.strip()) for x in response.split(',')]
                expected_count = len(question.get('items', []))
                if len(rankings) != expected_count:
                    await self.send_message(f"❌ Please enter {expected_count} numbers separated by commas")
                    return
            except:
                await self.send_message("❌ Please enter numbers separated by commas (e.g., 2,1,4,3)")
                return
        
        elif q_format == 'text_response':
            if len(response.strip()) < 10:
                await self.send_message("❌ Please provide a more detailed response (2-3 sentences)")
                return
        
        # Score the response
        if q_format == 'text_response':
            final_score = self.scorer.score_text_response(question, response)
        else:
            final_score = self.scorer.score_personality_response(question, response)
        
        # Store score
        trait = question['trait']
        characteristic = question['characteristic']
        
        if trait in self.state.trait_scores:
            self.state.trait_scores[trait].append(final_score)
        
        if characteristic not in self.state.characteristic_scores:
            self.state.characteristic_scores[characteristic] = []
        self.state.characteristic_scores[characteristic].append(final_score)
        
        # Store response
        self.state.response_history.append({
            'type': 'personality',
            'format': q_format,
            'question': question.get('scenario', question.get('question', '')),
            'trait': trait,
            'characteristic': characteristic,
            'response': response,
            'score': final_score
        })
        
        # Move to next question
        self.state.current_question_index += 1
        await self.show_next_personality_question()
    
    async def prepare_skills_test(self):
        """Generate skills assessment questions"""
        await self.send_message("""
✅ Personality Assessment Complete!

🔄 Preparing Skills Assessment...
""")
        
        # Generate questions for each skill
        for skill in self.state.extracted_skills[:10]:  # Limit to 10 skills
            question = await self.question_generator.generate_skills_question(
                skill=skill,
                job_context=f"{self.state.job_title}: {self.state.job_description[:300]}"
            )
            
            if question:
                self.state.skills_questions.append(question)
                self.state.skills_scores[skill] = 0  # Initialize score
        
        self.state.current_phase = "skills_test"
        self.state.current_question_index = 0
        
        await self.send_message(f"""
✅ Skills Assessment Ready!

📊 {len(self.state.skills_questions)} questions on key skills

Answer each multiple-choice question (A/B/C/D)
""")
        
        await self.show_next_skills_question()
    
    async def show_next_skills_question(self):
        """Display next skills question"""
        if self.state.current_question_index >= len(self.state.skills_questions):
            # Assessment complete
            await self.generate_final_report()
            return
        
        question = self.state.skills_questions[self.state.current_question_index]
        self.state.current_question = question
        
        q_num = self.state.current_question_index + 1
        total = len(self.state.skills_questions)
        
        q_text = f"""
📝 Skills Question {q_num}/{total}

Skill: {question['skill']}

{question['question']}

{chr(10).join(question['options'])}

Your answer (A/B/C/D):
"""
        await self.send_message(q_text)
    
    async def handle_skills_response(self, response: str):
        """Process skills question response"""
        answer = response.upper().strip()
        
        if answer not in ['A', 'B', 'C', 'D']:
            await self.send_message("❌ Invalid answer. Please respond with A, B, C, or D.")
            return
        
        question = self.state.current_question
        is_correct = (answer == question['correct'])
        
        # Update score
        skill = question['skill']
        if is_correct:
            self.state.skills_scores[skill] = 1
            result = "✅ Correct!"
        else:
            self.state.skills_scores[skill] = 0
            result = "❌ Incorrect"
        
        # Store response
        self.state.response_history.append({
            'type': 'skills',
            'question': question['question'],
            'skill': skill,
            'user_answer': answer,
            'correct_answer': question['correct'],
            'correct': is_correct
        })
        
        # Show feedback
        feedback = f"""
{result}
Correct answer: {question['correct']}

💡 {question['explanation']}
"""
        await self.send_message(feedback)
        
        # Move to next question
        self.state.current_question_index += 1
        await self.show_next_skills_question()
    
    async def generate_final_report(self):
        """Generate comprehensive assessment report"""
        self.state.current_phase = "completed"
        
        await self.send_message("🎉 Assessment Complete! Generating comprehensive report...")
        
        # Calculate scores
        results = self.scorer.calculate_overall_fit(self.state)
        
        # Format trait breakdown
        trait_summary = "\n".join([
            f"   • {trait}: {data['level']} ({data['percentage']}%) - Based on {data['responses']} questions"
            for trait, data in results['trait_breakdown'].items()
        ])
        
        # Format skills breakdown
        skills_summary = "\n".join([
            f"   • {skill}: {'✓ Pass' if score > 0 else '✗ Needs Development'}"
            for skill, score in results['skills_breakdown'].items()
        ])
        
        # Generate detailed analysis
        analysis_prompt = f"""Generate a professional HR assessment report for this candidate:

Position: {self.state.job_title}
Overall Fit Score: {results['overall_score']}/100
Recommendation: {results['recommendation']}

Personality Scores:
{json.dumps(results['trait_breakdown'], indent=2)}

Skills Performance:
{json.dumps(results['skills_breakdown'], indent=2)}

Provide:
1. Executive Summary (2-3 sentences)
2. Key Strengths (3-4 points)
3. Development Areas (2-3 points)
4. Hiring Recommendation with rationale
5. Onboarding/Development Suggestions

Keep it professional and actionable."""

        try:
            import openai
            client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert HR analyst."},
                    {"role": "user", "content": analysis_prompt}
                ],
                temperature=0.7,
            )
            
            detailed_analysis = response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating analysis: {e}")
            detailed_analysis = "Detailed analysis unavailable."
        
        # Final report
        report = f"""
╔═══════════════════════════════════════════════════════════════════╗
║                    CANDIDATE ASSESSMENT REPORT                    ║
╚═══════════════════════════════════════════════════════════════════╝

📋 Position: {self.state.job_title}

───────────────────────────────────────────────────────────────────
OVERALL FIT SCORE
───────────────────────────────────────────────────────────────────
🎯 Total Score: {results['overall_score']}/100
   • Personality Fit: {results['personality_score']}/100
   • Skills Assessment: {results['skills_score']}/100

📊 Recommendation: {results['recommendation']}

───────────────────────────────────────────────────────────────────
PERSONALITY TRAIT ASSESSMENT
───────────────────────────────────────────────────────────────────
{trait_summary}

───────────────────────────────────────────────────────────────────
SKILLS ASSESSMENT RESULTS
───────────────────────────────────────────────────────────────────
{skills_summary}

───────────────────────────────────────────────────────────────────
DETAILED ANALYSIS
───────────────────────────────────────────────────────────────────

{detailed_analysis}

╔═══════════════════════════════════════════════════════════════════╗
║                      END OF ASSESSMENT REPORT                     ║
╚═══════════════════════════════════════════════════════════════════╝
"""
        await self.send_message(report)

# --------------------------------------------------
# Console Runner
# --------------------------------------------------
async def run_console_assessment():
    """Run the JD-based assessment in console"""
    print("\n" + "╔" + "═"*68 + "╗")
    print("║       JD-BASED ADAPTIVE ASSESSMENT SYSTEM - BETA v2.0          ║")
    print("╚" + "═"*68 + "╝")
    print("\n🎓 Welcome to the Enhanced JD-Based Assessment Agent")
    print("📋 Paste your Job Description to begin candidate assessment")
    print("🧠 The system will create a custom multi-format personality + skills test\n")
    
    agent = ConsoleAssessmentAgent()
    
    print("="*70)
    print("Please paste the Job Description below (press Enter twice when done):")
    print("="*70)
    
    # Collect multi-line JD input
    jd_lines = []
    empty_count = 0
    
    while True:
        try:
            line = input()
            if not line.strip():
                empty_count += 1
                if empty_count >= 2:  # Two empty lines = done
                    break
            else:
                empty_count = 0
                jd_lines.append(line)
        except EOFError:
            break
    
    jd_text = "\n".join(jd_lines).strip()
    
    if not jd_text:
        print("\n❌ No Job Description provided. Exiting...")
        return
    
    # Process JD
    await agent.handle_jd_input(jd_text)
    
    # Main interaction loop
    while agent.state.current_phase != "completed":
        try:
            user_input = input("\n👉 Your response: ").strip()
            
            if not user_input:
                continue
            
            if agent.state.current_phase == "personality_test":
                await agent.handle_personality_response(user_input)
            elif agent.state.current_phase == "skills_test":
                await agent.handle_skills_response(user_input)
            
        except KeyboardInterrupt:
            print("\n\n⚠️  Assessment interrupted. Exiting...")
            break
        except Exception as e:
            logger.error(f"Error: {e}")
            print(f"\n❌ Error occurred: {e}")
            break
    
    print("\n✅ Thank you for using the Enhanced JD-Based Assessment System!")

# --------------------------------------------------
# Main Entry Point
# --------------------------------------------------
if __name__ == "__main__":
    logger.info("Starting JD-Based Adaptive Assessment Agent...")
    
    # Check for OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        print("\n❌ ERROR: OPENAI_API_KEY not found in environment variables.")
        print("Please set your OpenAI API key in .env file:")
        print("OPENAI_API_KEY=your_api_key_here\n")
        exit(1)
    
    # Run assessment
    asyncio.run(run_console_assessment())