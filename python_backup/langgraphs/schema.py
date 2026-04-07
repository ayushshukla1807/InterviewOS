from pydantic import BaseModel, Field
from typing import TypedDict, List, Dict, Optional
# class InterviewState(BaseModel):
#     user_plan: list = []
#     plan_tracking: dict = {"current_section": {}, "questions_asked": 0, "completed_sections": 0}
#     history: list = []
#     current_question: Optional[str] = None
#     llm_answer: Optional[str] = None
#     user_answer: Optional[str] = None
#     critique: Optional[str] = None
#     resume: str
#     langsmith_run_id: Optional[str] = None

class InterviewState(TypedDict):
    history: List[Dict]
    current_question: Optional[str]
    current_section: Optional[str]
    user_answer: Optional[str]
    critique: Optional[Dict]
    resume: Optional[Dict]
    langsmith_run_id: Optional[str]
    type: Optional[int]
    question_asked: Optional[int]  # Track question number
    last_score: Optional[int]  # Last answer score
    # Production enhancements
    difficulty: Optional[int]  # 1=easy, 2=medium, 3=hard
    persona: Optional[int]  # 0=Professional, 1=Friendly, 2=Strict, 3=Casual
    used_acknowledgments: Optional[List[str]]  # Track phrases used in session
    recent_answers_summary: Optional[str]  # Rolling summary of last 1-2 answers
    consecutive_high_scores: Optional[int]  # Track consecutive 4-5 scores for fast difficulty increase
    used_followup_templates: Optional[List[str]]  # Track follow-up patterns to prevent repetition
    # Challenge injection tracking
    consecutive_safe_questions: Optional[int]  # Track safe/easy questions in a row
    last_challenge_question_num: Optional[int]  # Question number of last challenge

class UserInput(BaseModel):
    answer: str


initial_state = {
    "history": [],
    "current_question": None,
    "current_section":None,
    "user_answer": None,
    "critique": None,
    "resume": None,
    "langsmith_run_id": None,
    "question_asked": 0,
    "last_score": 3,
    "difficulty": 2,  # Start at medium difficulty
    "persona": 0,  # 0=Professional (default)
    "used_acknowledgments": [],
    "recent_answers_summary": "",
    "consecutive_high_scores": 0,
    "used_followup_templates": [],
    "consecutive_safe_questions": 0,
    "last_challenge_question_num": 0,
}




# Section Score Model (unified from both branches)
class SectionScore(BaseModel):
    score: int = Field(..., description="Score 0-100 for this section")
    strong_points: List[str] = Field(default_factory=list, description="List of 0-2 genuinely observed strengths (only if truly present)")
    improvement_points: List[str] = Field(default_factory=list, description="List of 3-5 specific, actionable improvement areas (mandatory)")


# Section-wise scores structure
class SectionScores(BaseModel):
    introduction: SectionScore = Field(..., description="Opening responses and first impressions")
    core_skills: SectionScore = Field(..., description="Technical and domain-specific knowledge answers")
    behavioral: SectionScore = Field(..., description="Situational and behavioral question responses")
    communication_quality: SectionScore = Field(..., description="Clarity, structure, and articulation")
    confidence_tone: SectionScore = Field(..., description="Confidence level and delivery tone")
    clarity_relevance: SectionScore = Field(..., description="Answer relevance and logical coherence")
    off_script_handling: SectionScore = Field(..., description="Ability to handle unexpected or probing questions")


# Critical flags detection
class CriticalFlags(BaseModel):
    incomplete_answers: List[str] = Field(default_factory=list, description="Questions with incomplete or shallow responses")
    made_up_facts: List[str] = Field(default_factory=list, description="Instances of fabricated or unverified information")
    off_topic_rambling: List[str] = Field(default_factory=list, description="Responses that deviated from the question")
    excessive_fillers: List[str] = Field(default_factory=list, description="Answers with >5 filler words (umm, like, actually, I think)")
    lack_structure: List[str] = Field(default_factory=list, description="Unorganized or poorly structured responses")
    confidence_issues: List[str] = Field(default_factory=list, description="Signs of overconfidence or severe underconfidence")
    inconsistencies: List[str] = Field(default_factory=list, description="Contradictory statements across answers")


# Benchmark comparison (from report branch)
class BenchmarkComparison(BaseModel):
    overall_vs_benchmark: str = Field(..., description="Above/Below/At benchmark comparison")
    percentile_rank: str = Field(..., description="Percentile rank vs previous candidates (e.g., '42nd percentile')")
    section_comparisons: Dict[str, str] = Field(default_factory=dict, description="Each section vs benchmark (e.g., 'core_skills: Below benchmark')")


# Detailed insight layers (from tones branch)
class DetailedInsightLayers(BaseModel):
    L1_Integrity_and_Reliability: str = Field(..., description="Honesty, consistency, owns mistakes")
    L2_Cultural_Fit: str = Field(..., description="Collaboration, adaptability, team alignment")
    L3_Competence: str = Field(..., description="Technical depth, problem-solving, domain knowledge")
    L4_Judgment: str = Field(..., description="Decision-making, tradeoff analysis, prioritization")
    L5_Communication: str = Field(..., description="Clarity, structure, ability to explain complex topics")


# Performance breakdown (from tones branch)
class PerformanceBreakdown(BaseModel):
    Cognitive_Aptitude: str = Field(..., description="Reasoning, learning ability, problem-solving approach")
    Integrity: str = Field(..., description="Transparency, accountability, ethical awareness")
    Cultural_Fit: str = Field(..., description="Teamwork, openness to feedback, growth mindset")
    Situational_Judgment: str = Field(..., description="Handling ambiguity, practical decisions, context awareness")


# QA Analysis (from tones branch)
class QAAnalysis(BaseModel):
    average_score: str = Field(..., description="Average score across all questions")
    strengths: str = Field(..., description="Top 2-3 strongest areas with specifics")
    weaknesses: str = Field(..., description="Top 2-3 areas for improvement with specifics")
    follow_up_questions: List[str] = Field(default_factory=list, description="Critical follow-up questions from critiques")


# Unified Candidate Summary (combining both branches)
class CandidateSummary(BaseModel):
    # Core metrics
    overall_score: int = Field(..., description="Overall score 0-100 based on raw data, no rounding")
    
    # From report branch: detailed section-wise breakdown
    section_scores: SectionScores = Field(..., description="Detailed scores and feedback for all 7 sections")
    strict_improvement_areas: List[str] = Field(default_factory=list, description="5-8 specific, actionable, role-aligned improvement points")
    genuine_strengths: List[str] = Field(default_factory=list, description="Only truly observed strengths (0-3 items, can be empty)")
    critical_flags: CriticalFlags = Field(..., description="Auto-detected critical issues during interview")
    final_verdict: str = Field(..., description="One of: 'major_improvement', 'moderate_improvement', 'minor_improvement'")
    benchmark_comparison: Optional[BenchmarkComparison] = Field(None, description="Comparison vs previous candidates (optional)")
    precise_summary: str = Field(..., description="2-3 sentences honest assessment with NO motivational language or sugarcoating")
    
    # From tones branch: layered insights and comprehensive analysis
    percentile_rank: Optional[str] = Field(None, description="Percentile rank among candidates")
    role_match_index: Optional[str] = Field(None, description="Role match percentage or assessment")
    fit_summary: Optional[str] = Field(None, description="Overall fit summary")
    summary: Optional[str] = Field(None, description="Holistic narrative covering technical skills, communication, and readiness")
    detailed_insight_layers: Optional[DetailedInsightLayers] = Field(None, description="5-layer insight analysis")
    performance_breakdown: Optional[PerformanceBreakdown] = Field(None, description="4-area performance breakdown")
    hyrte_insight: Optional[str] = Field(None, description="Overall professional readiness and hiring recommendation")
    qa_analysis: Optional[QAAnalysis] = Field(None, description="Question-answer analysis with strengths and weaknesses")
