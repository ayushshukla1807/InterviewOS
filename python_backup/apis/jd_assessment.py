from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import asyncio
import uuid
from datetime import datetime
import json
import logging
import os

from apis.jdagent import (
    AssessmentState, JDAnalyzer, AssessmentQuestionGenerator,
    AssessmentScorer, CORE_TRAITS
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("jd-assessment-api")

router = APIRouter()

# In-memory session storage (in production, use Redis or database)
sessions: Dict[str, AssessmentState] = {}

# Pydantic models
class JDRequest(BaseModel):
    job_description: str

class ResponseRequest(BaseModel):
    response: str

class SessionResponse(BaseModel):
    session_id: str
    job_title: Optional[str] = None
    extracted_skills: List[str] = []
    selected_traits: Dict[str, str] = {}
    current_phase: str
    current_question: Optional[Dict] = None
    question_number: int = 0
    total_questions: int = 0

class AssessmentResults(BaseModel):
    session_id: str
    job_title: str
    overall_score: float
    personality_score: float
    skills_score: float
    recommendation: str
    trait_breakdown: Dict
    skills_breakdown: Dict
    detailed_analysis: str

# Helper functions
def get_session(session_id: str) -> AssessmentState:
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return sessions[session_id]

def create_session() -> str:
    session_id = str(uuid.uuid4())
    sessions[session_id] = AssessmentState()
    return session_id

# API Endpoints
@router.get("/")
async def root():
    return {"message": "JD Assessment API is running"}

@router.post("/start", response_model=SessionResponse)
async def start_assessment(request: JDRequest):
    """Start a new assessment session with job description"""
    try:
        session_id = create_session()
        state = get_session(session_id)

        # Initialize components
        jd_analyzer = JDAnalyzer()

        # Analyze JD
        logger.info(f"Analyzing JD for session {session_id}")
        analysis = await jd_analyzer.analyze_jd(request.job_description)

        # Update state
        state.job_description = request.job_description
        state.job_title = analysis['job_title']
        state.extracted_skills = analysis['required_skills']

        for trait, priority in analysis['recommended_traits'].items():
            if priority != "None":
                state.selected_traits[trait] = priority
                state.trait_characteristics[trait] = CORE_TRAITS.get(trait, [])

        # Generate personality questions
        question_generator = AssessmentQuestionGenerator()
        all_questions = []

        for trait, priority in state.selected_traits.items():
            characteristics = state.trait_characteristics.get(trait, [])
            question_count = {"High": 5, "Medium": 3, "Low": 2}.get(priority, 3)

            questions = await question_generator.generate_personality_questions(
                trait=trait,
                characteristics=characteristics,
                job_context=f"{state.job_title}: {state.job_description[:300]}",
                count=question_count
            )
            all_questions.extend(questions)

        state.personality_questions = all_questions
        state.total_questions = len(all_questions)
        state.current_question_index = 0

        # Initialize trait scores
        for trait in state.selected_traits.keys():
            state.trait_scores[trait] = []

        state.current_phase = "personality_test"

        # Get first question
        current_question = None
        if state.personality_questions:
            current_question = state.personality_questions[0]

        return SessionResponse(
            session_id=session_id,
            job_title=state.job_title,
            extracted_skills=state.extracted_skills,
            selected_traits=state.selected_traits,
            current_phase=state.current_phase,
            current_question=current_question,
            question_number=1,
            total_questions=len(state.personality_questions)
        )

    except Exception as e:
        logger.error(f"Error starting assessment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/question", response_model=SessionResponse)
async def get_current_question(session_id: str):
    """Get current question for a session"""
    try:
        state = get_session(session_id)

        current_question = None
        question_number = state.current_question_index + 1

        if state.current_phase == "personality_test":
            if state.current_question_index < len(state.personality_questions):
                current_question = state.personality_questions[state.current_question_index]
        elif state.current_phase == "skills_test":
            if state.current_question_index < len(state.skills_questions):
                current_question = state.skills_questions[state.current_question_index]

        return SessionResponse(
            session_id=session_id,
            job_title=state.job_title,
            extracted_skills=state.extracted_skills,
            selected_traits=state.selected_traits,
            current_phase=state.current_phase,
            current_question=current_question,
            question_number=question_number,
            total_questions=state.total_questions
        )

    except Exception as e:
        logger.error(f"Error getting question: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/respond", response_model=SessionResponse)
async def submit_response(session_id: str, request: ResponseRequest):
    """Submit response to current question"""
    try:
        # Use session_id from path parameter
        state = get_session(session_id)
        scorer = AssessmentScorer()

        if state.current_phase == "personality_test":
            await handle_personality_response(state, request.response, scorer)
        elif state.current_phase == "skills_test":
            await handle_skills_response(state, request.response, scorer)

        # Check if assessment is complete
        if state.current_phase == "completed":
            # Generate final report
            results = await generate_assessment_report(state)
            return SessionResponse(
                session_id=session_id,
                job_title=state.job_title,
                extracted_skills=state.extracted_skills,
                selected_traits=state.selected_traits,
                current_phase="completed",
                current_question=None,
                question_number=0,
                total_questions=0
            )

        # Get next question
        current_question = None
        question_number = state.current_question_index + 1

        if state.current_phase == "personality_test":
            if state.current_question_index < len(state.personality_questions):
                current_question = state.personality_questions[state.current_question_index]
        elif state.current_phase == "skills_test":
            if state.current_question_index < len(state.skills_questions):
                current_question = state.skills_questions[state.current_question_index]

        return SessionResponse(
            session_id=session_id,
            job_title=state.job_title,
            extracted_skills=state.extracted_skills,
            selected_traits=state.selected_traits,
            current_phase=state.current_phase,
            current_question=current_question,
            question_number=question_number,
            total_questions=state.total_questions
        )

    except Exception as e:
        logger.error(f"Error submitting response: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def handle_personality_response(state: AssessmentState, response: str, scorer: AssessmentScorer):
    """Handle personality question response"""
    question = state.personality_questions[state.current_question_index]
    q_format = question.get('format', 'behavioral_scale')

    # If empty response (timer expired), skip validation and use default score
    if not response.strip():
        # Use neutral score for timer expiration
        final_score = 3  # Neutral score
    else:
        # Validate response based on format
        if q_format == 'situational_mcq':
            if response.upper() not in ['A', 'B', 'C', 'D']:
                raise HTTPException(status_code=400, detail="Please enter A, B, C, or D")
        elif q_format == 'behavioral_scale':
            if response.lower() not in ['never', 'rarely', 'sometimes', 'often', 'always']:
                raise HTTPException(status_code=400, detail="Please enter: Never, Rarely, Sometimes, Often, or Always")
        elif q_format == 'preference_choice':
            if response.upper() not in ['A', 'B']:
                raise HTTPException(status_code=400, detail="Please enter A or B")
        elif q_format == 'ranking':
            try:
                rankings = [int(x.strip()) for x in response.split(',')]
                expected_count = len(question.get('items', []))
                if len(rankings) != expected_count:
                    raise HTTPException(status_code=400, detail=f"Please enter {expected_count} numbers separated by commas")
            except:
                raise HTTPException(status_code=400, detail="Please enter numbers separated by commas (e.g., 2,1,4,3)")
        elif q_format == 'text_response':
            if len(response.strip()) < 10:
                raise HTTPException(status_code=400, detail="Please provide a more detailed response (2-3 sentences)")

        # Score the response
        if q_format == 'text_response':
            final_score = scorer.score_text_response(question, response)
        else:
            final_score = scorer.score_personality_response(question, response)

    # Store score
    trait = question['trait']
    characteristic = question['characteristic']

    if trait in state.trait_scores:
        state.trait_scores[trait].append(final_score)

    if characteristic not in state.characteristic_scores:
        state.characteristic_scores[characteristic] = []
    state.characteristic_scores[characteristic].append(final_score)

    # Store response
    state.response_history.append({
        'type': 'personality',
        'format': q_format,
        'question': question.get('scenario', question.get('question', '')),
        'trait': trait,
        'characteristic': characteristic,
        'response': response,
        'score': final_score
    })

    # Move to next question
    state.current_question_index += 1

    # Check if personality test is complete
    if state.current_question_index >= len(state.personality_questions):
        await prepare_skills_test(state)

async def prepare_skills_test(state: AssessmentState):
    """Prepare skills assessment questions"""
    question_generator = AssessmentQuestionGenerator()

    # Generate questions for each skill
    for skill in state.extracted_skills[:10]:  # Limit to 10 skills
        question = await question_generator.generate_skills_question(
            skill=skill,
            job_context=f"{state.job_title}: {state.job_description[:300]}"
        )

        if question:
            state.skills_questions.append(question)
            state.skills_scores[skill] = 0  # Initialize score

    state.current_phase = "skills_test"
    state.current_question_index = 0

async def handle_skills_response(state: AssessmentState, response: str, scorer: AssessmentScorer):
    """Handle skills question response"""
    question = state.skills_questions[state.current_question_index]

    # If empty response (timer expired), skip validation and mark as incorrect
    if not response.strip():
        is_correct = False
    else:
        answer = response.upper().strip()
        if answer not in ['A', 'B', 'C', 'D']:
            raise HTTPException(status_code=400, detail="Invalid answer. Please respond with A, B, C, or D.")

        is_correct = (answer == question['correct'])

    # Update score
    skill = question['skill']
    if is_correct:
        state.skills_scores[skill] = 1
    else:
        state.skills_scores[skill] = 0

    # Store response
    state.response_history.append({
        'type': 'skills',
        'question': question['question'],
        'skill': skill,
        'user_answer': answer,
        'correct_answer': question['correct'],
        'correct': is_correct
    })

    # Move to next question
    state.current_question_index += 1

    # Check if assessment is complete
    if state.current_question_index >= len(state.skills_questions):
        state.current_phase = "completed"

@router.get("/{session_id}/results", response_model=AssessmentResults)
async def get_assessment_results(session_id: str):
    """Get final assessment results"""
    try:
        state = get_session(session_id)

        if state.current_phase != "completed":
            raise HTTPException(status_code=400, detail="Assessment not completed")

        return await generate_assessment_report(state)

    except Exception as e:
        logger.error(f"Error getting results: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def generate_assessment_report(state: AssessmentState) -> AssessmentResults:
    """Generate comprehensive assessment report"""
    scorer = AssessmentScorer()

    # Calculate scores
    results = scorer.calculate_overall_fit(state)

    # Generate detailed analysis
    analysis_prompt = f"""Generate a professional HR assessment report for this candidate:

Position: {state.job_title}
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

    return AssessmentResults(
        session_id="",  # Will be set by caller
        job_title=state.job_title,
        overall_score=results['overall_score'],
        personality_score=results['personality_score'],
        skills_score=results['skills_score'],
        recommendation=results['recommendation'],
        trait_breakdown=results['trait_breakdown'],
        skills_breakdown=results['skills_breakdown'],
        detailed_analysis=detailed_analysis
    )

@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """Delete a session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    del sessions[session_id]
    return {"message": "Session deleted"}
