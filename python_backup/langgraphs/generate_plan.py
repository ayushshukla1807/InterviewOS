import sys
import os
import logging
import time
from langchain_core.output_parsers import JsonOutputParser
from dotenv import load_dotenv
load_dotenv()

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from helpers_functions.model import client_llm
from helpers_functions.json_parser import parse_llm_json_response
from langgraphs.schema import InterviewState
from langgraphs.langsmith_setup import tracer, json_output_parser
from langgraphs.prompts import technical_prompt, hr_prompt, marketing_prompt, sales_prompt

# Initialize logger
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('[%(asctime)s] %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

def generate_plan(state: InterviewState) -> InterviewState:
    """
    Generate initial interview plan based on resume and interview type.
    Enhanced with robust JSON parsing, logging, and LangSmith observability.
    """
    start_total = time.time()
    session_id = state.get("session_id", "unknown")
    interview_type = state.get("type", -1)
    
    # Map interview type to role name
    type_mapping = {0: "technical", 1: "hr", 2: "marketing", 3: "sales"}
    role = type_mapping.get(interview_type, "unknown")
    
    logger.info(f"[Session {session_id}] Starting plan generation for {role} interview")
    
    try:
        # Select prompt based on interview type
        prompt_fn = None
        if interview_type == 0:
            prompt_fn = technical_prompt
        elif interview_type == 1:
            prompt_fn = hr_prompt
        elif interview_type == 2:
            prompt_fn = marketing_prompt
        elif interview_type == 3:
            prompt_fn = sales_prompt
        else:
            raise ValueError(f"Unknown interview type: {interview_type}")
        
        resume = state["resume"]
        prompt_text = prompt_fn(resume)
        prompt_length = len(prompt_text)
        
        logger.info(f"[Session {session_id}] Prompt: {prompt_length} chars, Type: {role}")
        
        # Invoke LLM with LangSmith metadata (temperature=0.0 for deterministic planning)
        start_invoke = time.time()
        response = client_llm.invoke(
            [("system", prompt_text)],
            config={
                "callbacks": [tracer],
                "metadata": {
                    "session_id": session_id,
                    "role": role,
                    "operation": "plan_generation",
                    "temperature": 0.0,  # Deterministic for consistent planning
                    "max_tokens": 1000,
                    "model": "gpt-3.5-turbo"
                }
            },
        )
        llm_latency = time.time() - start_invoke
        response_length = len(response.content) if hasattr(response, 'content') else 0
        
        logger.info(f"[Session {session_id}] LLM response: {response_length} chars in {llm_latency:.2f}s")
        
        # Parse JSON with robust error handling
        def retry_callback():
            """Fallback for plan generation - return minimal valid structure"""
            logger.warning(f"[Session {session_id}] Plan generation retry triggered")
            return client_llm.invoke(
                [("system", prompt_text + "\n\nIMPORTANT: Return ONLY valid JSON, no markdown.")],
                config={"callbacks": [tracer]}
            ).content
        
        json_data = parse_llm_json_response(
            response.content,
            expected_keys=["summary", "interview_question", "current_section"],
            session_id=session_id,
            retry_callback=retry_callback
        )
        
        # Update state with parsed data
        current_section = json_data["current_section"]
        state["resume"] = json_data["summary"]
        state["resume"][current_section]["asked_question"] = str(
            int(state["resume"][current_section]["asked_question"]) + 1
        )
        state["current_section"] = current_section
        state["current_question"] = json_data["interview_question"]
        
        # Initialize production state fields if not already set
        if "difficulty" not in state or state["difficulty"] is None:
            state["difficulty"] = 2  # Start at medium difficulty
        if "persona" not in state or state["persona"] is None:
            state["persona"] = 0  # Default to Professional persona
        if "used_acknowledgments" not in state or state["used_acknowledgments"] is None:
            state["used_acknowledgments"] = []
        if "recent_answers_summary" not in state or state["recent_answers_summary"] is None:
            state["recent_answers_summary"] = ""
        if "consecutive_high_scores" not in state or state["consecutive_high_scores"] is None:
            state["consecutive_high_scores"] = 0  # Track for accelerated difficulty increase
        if "used_followup_templates" not in state or state["used_followup_templates"] is None:
            state["used_followup_templates"] = []  # Track follow-up patterns for variation
        
        logger.info(f"[Session {session_id}] Plan generated successfully. Section: {current_section}, Difficulty: {state['difficulty']}, Persona: {state['persona']}")
        
    except Exception as e:
        logger.error(f"[Session {session_id}] Plan generation failed: {str(e)}", exc_info=True)
        # Graceful fallback
        state["current_question"] = (
            "There was an issue processing your request. Could you please tell me about yourself to begin?"
        )
    finally:
        total_time = time.time() - start_total
        logger.info(f"[Session {session_id}] Total plan generation time: {total_time:.2f}s")

    return state
