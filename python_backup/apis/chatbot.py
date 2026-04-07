import os
import time
import requests
import sys
import io
import uuid
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from pydantic import BaseModel
from dotenv import load_dotenv
import PyPDF2
import json

load_dotenv()
router = APIRouter()

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from langgraphs.generate_plan import generate_plan
from langgraphs.generate_question import generate_question
from langgraphs.schema import InterviewState, UserInput, initial_state
from langgraphs.langsmith_setup import start_langsmith_run, end_langsmith_run
from langgraphs.prompts import extract_candidate_summary
from helpers_functions.model import client_llm2
from helpers_functions.json_parser import parse_summary_json
import logging

# Initialize logger
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('[%(asctime)s] %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


# Session Manager
class SessionData:
    def __init__(self):
        self.data = []
        self.state = None
        self.created_at = datetime.now()
        self.last_accessed = datetime.now()


class InterviewSummaryData:
    """Store completed interview summaries"""
    def __init__(self, summary: dict):
        self.summary = summary
        self.created_at = datetime.now()


class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, SessionData] = {}
        self.completed_summaries: Dict[str, InterviewSummaryData] = {}
        self.cleanup_task = None

    def create_session(self) -> str:
        """Create a new session and return session_id"""
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = SessionData()
        return session_id

    def get_session(self, session_id: str) -> SessionData:
        """Get session data by session_id"""
        if session_id not in self.sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = self.sessions[session_id]
        session.last_accessed = datetime.now()
        return session

    def delete_session(self, session_id: str):
        """Delete a session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            print(f"🗑️ Session {session_id} deleted")

    def store_summary(self, session_id: str, summary: dict):
        """Store completed interview summary"""
        self.completed_summaries[session_id] = InterviewSummaryData(summary)
        print(f"📝 Summary stored for session {session_id}")

    def get_summary(self, session_id: str) -> Optional[dict]:
        """Get stored summary by session_id"""
        if session_id not in self.completed_summaries:
            return None
        
        summary_data = self.completed_summaries[session_id]
        
        # Check if summary is still within 3-hour window
        time_since_creation = datetime.now() - summary_data.created_at
        if time_since_creation > timedelta(hours=3):
            del self.completed_summaries[session_id]
            print(f"⏰ Summary expired for session {session_id}")
            return None
        
        return summary_data.summary

    def delete_summary(self, session_id: str):
        """Delete a stored summary"""
        if session_id in self.completed_summaries:
            del self.completed_summaries[session_id]
            print(f"🗑️ Summary deleted for session {session_id}")

    async def cleanup_expired_sessions(self):
        """Background task to clean up sessions older than 3 hours"""
        while True:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes
                now = datetime.now()
                expired_sessions = []
                expired_summaries = []

                # Clean up active sessions
                for session_id, session_data in self.sessions.items():
                    time_since_creation = now - session_data.created_at
                    if time_since_creation > timedelta(hours=3):
                        expired_sessions.append(session_id)

                for session_id in expired_sessions:
                    self.delete_session(session_id)
                    print(f"⏰ Auto-deleted expired session: {session_id}")

                # Clean up stored summaries
                for session_id, summary_data in self.completed_summaries.items():
                    time_since_creation = now - summary_data.created_at
                    if time_since_creation > timedelta(hours=3):
                        expired_summaries.append(session_id)

                for session_id in expired_summaries:
                    self.delete_summary(session_id)
                    print(f"⏰ Auto-deleted expired summary: {session_id}")

            except Exception as e:
                print(f"❌ Error in cleanup task: {e}")

    def start_cleanup_task(self):
        """Start the background cleanup task"""
        if self.cleanup_task is None:
            self.cleanup_task = asyncio.create_task(self.cleanup_expired_sessions())


# Global session manager instance
session_manager = SessionManager()


# Request/Response Models
class ResumeRequest(BaseModel):
    resume: str
    type: int  # 0=tech, 1=hr, etc.
    persona: Optional[int] = 0  # 0=Professional, 1=Friendly, 2=Strict, 3=Casual
    difficulty: Optional[int] = 2  # 1=Easy, 2=Medium, 3=Hard (starting level)


class InitializeResponse(BaseModel):
    session_id: str
    state: dict


class AnswerRequest(BaseModel):
    session_id: str
    answer: str


# Unified response models combining both branches
class SectionScore(BaseModel):
    score: int
    strong_points: list[str]
    improvement_points: list[str]


class SectionScores(BaseModel):
    introduction: SectionScore
    core_skills: SectionScore
    behavioral: SectionScore
    communication_quality: SectionScore
    confidence_tone: SectionScore
    clarity_relevance: SectionScore
    off_script_handling: SectionScore


class DetailedInsightLayers(BaseModel):
    L1_Integrity_and_Reliability: str
    L2_Cultural_Fit: str
    L3_Competence: str
    L4_Judgment: str
    L5_Communication: str


class PerformanceBreakdown(BaseModel):
    Cognitive_Aptitude: str
    Integrity: str
    Cultural_Fit: str
    Situational_Judgment: str


class QAAnalysis(BaseModel):
    average_score: str
    strengths: str
    weaknesses: str
    follow_up_questions: list[str]


class CriticalFlags(BaseModel):
    incomplete_answers: list[str]
    made_up_facts: list[str]
    off_topic_rambling: list[str]
    excessive_fillers: list[str]
    lack_structure: list[str]
    confidence_issues: list[str]
    inconsistencies: list[str]


class BenchmarkComparison(BaseModel):
    overall_vs_benchmark: str
    percentile_rank: str
    section_comparisons: Dict[str, str]


class InterviewSummary(BaseModel):
    overall_score: int
    section_scores: SectionScores
    strict_improvement_areas: list[str]
    genuine_strengths: list[str]
    critical_flags: CriticalFlags
    final_verdict: str
    benchmark_comparison: Optional[BenchmarkComparison]
    precise_summary: str
    # From tones branch
    percentile_rank: Optional[str] = None
    role_match_index: Optional[str] = None
    fit_summary: Optional[str] = None
    summary: Optional[str] = None
    detailed_insight_layers: Optional[DetailedInsightLayers] = None
    performance_breakdown: Optional[PerformanceBreakdown] = None
    hyrte_insight: Optional[str] = None
    qa_analysis: Optional[QAAnalysis] = None


class EndInterviewResponse(BaseModel):
    message: str
    overall_score: int
    section_scores: SectionScores
    strict_improvement_areas: list[str]
    genuine_strengths: list[str]
    critical_flags: CriticalFlags
    final_verdict: str
    benchmark_comparison: Optional[BenchmarkComparison]
    precise_summary: str
    # From tones branch
    percentile_rank: Optional[str] = None
    role_match_index: Optional[str] = None
    fit_summary: Optional[str] = None
    summary: Optional[str] = None
    detailed_insight_layers: Optional[DetailedInsightLayers] = None
    performance_breakdown: Optional[PerformanceBreakdown] = None
    hyrte_insight: Optional[str] = None
    qa_analysis: Optional[QAAnalysis] = None
    state: None = None


class GetSummaryResponse(BaseModel):
    session_id: str
    overall_score: int
    section_scores: SectionScores
    strict_improvement_areas: list[str]
    genuine_strengths: list[str]
    critical_flags: CriticalFlags
    final_verdict: str
    benchmark_comparison: Optional[BenchmarkComparison]
    precise_summary: str
    # From tones branch
    percentile_rank: Optional[str] = None
    role_match_index: Optional[str] = None
    fit_summary: Optional[str] = None
    summary: Optional[str] = None
    detailed_insight_layers: Optional[DetailedInsightLayers] = None
    performance_breakdown: Optional[PerformanceBreakdown] = None
    hyrte_insight: Optional[str] = None
    qa_analysis: Optional[QAAnalysis] = None
    generated_at: str


# Utility Functions
def extract_text_from_pdf(pdf_bytes):
    text = ""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
    except Exception as e:
        return f"Error extracting text: {e}"
    return text.strip()


# API Endpoints
@router.on_event("startup")
async def startup_event():
    """Start the cleanup task when the app starts"""
    session_manager.start_cleanup_task()
    print("✅ Session cleanup task started")


@router.post("/extract-text/")
async def extract_text(url: str = Query(...)):
    try:
        response = requests.get(url)
        response.raise_for_status()
        pdf_bytes = response.content
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Error fetching file from URL: {e}")

    extracted_text = extract_text_from_pdf(pdf_bytes)
    return {"url": url, "text": extracted_text}


@router.post("/initialize", response_model=InitializeResponse)
async def initialize_interview(request: ResumeRequest):
    # Create new session
    session_id = session_manager.create_session()
    session = session_manager.get_session(session_id)

    # Initialize state with deep copy to avoid mutable list issues
    from copy import deepcopy
    state = deepcopy(initial_state)
    state["resume"] = request.resume
    state["type"] = request.type
    
    # Validate and store persona (0=Professional, 1=Friendly, 2=Strict, 3=Casual)
    persona = request.persona if request.persona in {0, 1, 2, 3} else 0
    state["persona"] = persona
    
    # Validate and store starting difficulty (1=Easy, 2=Medium, 3=Hard)
    # Note: This is the STARTING difficulty only; adaptive difficulty will adjust it
    starting_difficulty = request.difficulty if request.difficulty in {1, 2, 3} else 2
    state["difficulty"] = starting_difficulty
    
    logger.info(f"Initializing interview - persona: {persona}, starting difficulty: {starting_difficulty}")

    run_id = start_langsmith_run(request.resume)
    state["langsmith_run_id"] = run_id

    try:
        start_time = time.time()
        state = generate_plan(state)
        elapsed_time = time.time() - start_time
        print(f"⏰ Time taken for initialize_interview: {elapsed_time:.2f} seconds")
        
        # Validate that plan generation succeeded (resume should be a dict, not string)
        if isinstance(state["resume"], str):
            raise ValueError("Plan generation failed - resume was not parsed into structured format")
        
        # Store state in session
        session.state = state
        
        return {
            "session_id": session_id,
            "state": state
        }
    except Exception as e:
        end_langsmith_run(run_id, {"error": str(e)})
        session_manager.delete_session(session_id)
        elapsed_time = time.time() - start_time
        print(f"❌ Error occurred after {elapsed_time:.2f} seconds")
        
        # Provide more helpful error message for quota issues
        error_msg = str(e)
        if "429" in error_msg or "quota" in error_msg.lower() or "rate limit" in error_msg.lower():
            raise HTTPException(
                status_code=503,
                detail="API quota exceeded. Please check your OpenAI billing and try again later."
            )
        raise HTTPException(status_code=500, detail=f"Error initializing interview: {e}")


@router.post("/answer", response_model=dict)
async def submit_answer(request: AnswerRequest):
    if not request.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty")

    # Get session
    session = session_manager.get_session(request.session_id)
    
    if session.state is None:
        raise HTTPException(status_code=400, detail="Session state not initialized")

    try:
        state = session.state
        state["user_answer"] = request.answer
        answer = state["user_answer"]
        question = state.get("current_question", "")
        
        print("User Answer Received:", answer)
        print("State before generating question:", state)
        
        state = generate_question(state)
        critique = state.get("critique", {})
        
        print("Current Critique:", critique)
        
        # Store in session data
        el = {"question": question, "answer": answer, "critique": critique}
        session.data.append(el)
        session.state = state
        
        print(session.data, " Data Updated")
        
        return {"session_id":request.session_id,"state": state}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing answer: {e}")


@router.post("/end", response_model=EndInterviewResponse)
async def end_interview(session_id: str):
    try:
        start_total = time.time()
        
        # Get session
        session = session_manager.get_session(session_id)

        if not session.data:
            raise HTTPException(status_code=400, detail="No interview data found.")
        
        # Validate that interview has valid data (not just errors)
        valid_data = [item for item in session.data if item.get("critique") is not None]
        if not valid_data:
            raise HTTPException(
                status_code=400, 
                detail="No valid interview answers were recorded. The interview may have encountered errors during processing."
            )
        
        logger.info(f"[Session {session_id}] Generating final summary for {len(session.data)} Q&A pairs")
        
        # Step 1: Generate summary using GPT with temperature=0.0 for consistency
        prompt = extract_candidate_summary(session.data)
        prompt_length = len(prompt)
        
        start_llm = time.time()
        response = client_llm2.invoke(
            prompt,
            config={
                "metadata": {
                    "session_id": session_id,
                    "operation": "summary_generation",
                    "temperature": 0.0,
                    "model": "gpt-4o-mini"
                } starting with colleges
            },
            temperature=0.0,
            max_tokens=2000,
        )
        llm_latency = time.time() - start_llm
        response_length = len(response.content)
        
        logger.info(f"[Session {session_id}] LLM summary response: {response_length} chars in {llm_latency:.2f}s")
        
        # Step 2: Parse JSON response with enhanced parser and repair callback
        def retry_callback(repair_prompt):
            """Retry with stricter instructions"""
            logger.warning(f"[Session {session_id}] Summary parse failed, attempting repair")
            return client_llm2.invoke(
                repair_prompt + "\n\nCRITICAL: Return ONLY valid JSON, no markdown, respect character limits.",
                config={"metadata": {"session_id": session_id, "operation": "summary_repair"}}
            ).content
        
        summary_json, parse_success = parse_summary_json(
            response.content,
            session_id=session_id,
            retry_callback=retry_callback
        )
        
        # Log telemetry
        total_time = time.time() - start_total
        logger.info(
            f"[Session {session_id}] Summary telemetry: "
            f"qa_pairs={len(session.data)}, "
            f"prompt_length_chars={prompt_length}, "
            f"response_length_chars={response_length}, "
            f"llm_latency_seconds={llm_latency:.2f}, "
            f"parse_success={parse_success}, "
            f"total_time_seconds={total_time:.2f}"
        )

        # Step 3: Store summary before deleting session
        session_manager.store_summary(session_id, summary_json)

        # Step 4: Delete active session after successful completion
        session_manager.delete_session(session_id)

        # Step 5: Return confirmation and generated summary (combined structure from both branches)
        return {
            "message": "Interview ended. Summary generated successfully!",
            # Report branch fields
            "overall_score": summary_json.get("overall_score", 0),
            "section_scores": summary_json.get("section_scores", {}),
            "strict_improvement_areas": summary_json.get("strict_improvement_areas", []),
            "genuine_strengths": summary_json.get("genuine_strengths", []),
            "critical_flags": summary_json.get("critical_flags", {}),
            "final_verdict": summary_json.get("final_verdict", "moderate_improvement"),
            "benchmark_comparison": summary_json.get("benchmark_comparison"),
            "precise_summary": summary_json.get("precise_summary", "N/A"),
            # Tones branch fields
            "percentile_rank": summary_json.get("percentile_rank"),
            "role_match_index": summary_json.get("role_match_index"),
            "fit_summary": summary_json.get("fit_summary"),
            "summary": summary_json.get("summary"),
            "detailed_insight_layers": summary_json.get("detailed_insight_layers"),
            "performance_breakdown": summary_json.get("performance_breakdown"),
            "hyrte_insight": summary_json.get("hyrte_insight"),
            "qa_analysis": summary_json.get("qa_analysis"),
            "state": None,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in end_interview: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error ending interview: {e}")


@router.get("/summary/{session_id}", response_model=GetSummaryResponse)
async def get_interview_summary(session_id: str):
    """
    Retrieve the interview summary for a completed session.
    Summary is available for 3 hours after the /end endpoint is called.
    """
    try:
        summary = session_manager.get_summary(session_id)
        
        if summary is None:
            raise HTTPException(
                status_code=404, 
                detail="Summary not found. It may have expired (>3 hours) or the interview was not completed."
            )
        
        # Get the creation time from stored summary
        summary_data = session_manager.completed_summaries.get(session_id)
        generated_at = summary_data.created_at.isoformat() if summary_data else datetime.now().isoformat()
        
        return {
            "session_id": session_id,
            # Report branch fields
            "overall_score": summary.get("overall_score", 0),
            "section_scores": summary.get("section_scores", {}),
            "strict_improvement_areas": summary.get("strict_improvement_areas", []),
            "genuine_strengths": summary.get("genuine_strengths", []),
            "critical_flags": summary.get("critical_flags", {}),
            "final_verdict": summary.get("final_verdict", "moderate_improvement"),
            "benchmark_comparison": summary.get("benchmark_comparison"),
            "precise_summary": summary.get("precise_summary", "N/A"),
            # Tones branch fields
            "percentile_rank": summary.get("percentile_rank"),
            "role_match_index": summary.get("role_match_index"),
            "fit_summary": summary.get("fit_summary"),
            "summary": summary.get("summary"),
            "detailed_insight_layers": summary.get("detailed_insight_layers"),
            "performance_breakdown": summary.get("performance_breakdown"),
            "hyrte_insight": summary.get("hyrte_insight"),
            "qa_analysis": summary.get("qa_analysis"),
            "generated_at": generated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_interview_summary: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error retrieving summary: {e}")


@router.get("/sessions/count")
async def get_active_sessions():
    """Debug endpoint to see active sessions and stored summaries"""
    return {
        "active_sessions": len(session_manager.sessions),
        "stored_summaries": len(session_manager.completed_summaries),
        "sessions": [
            {
                "session_id": sid,
                "created_at": data.created_at.isoformat(),
                "last_accessed": data.last_accessed.isoformat(),
                "data_count": len(data.data)
            }
            for sid, data in session_manager.sessions.items()
        ],
        "summaries": [
            {
                "session_id": sid,
                "generated_at": data.created_at.isoformat(),
                "expires_at": (data.created_at + timedelta(hours=3)).isoformat()
            }
            for sid, data in session_manager.completed_summaries.items()
        ]
    }