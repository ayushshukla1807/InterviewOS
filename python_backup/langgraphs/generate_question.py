import sys
import os
import time
import logging
import json
from dotenv import load_dotenv
load_dotenv()

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from helpers_functions.model import client_llm2
from helpers_functions.json_parser import (
    parse_llm_json_response,
    get_fallback_response,
    mask_pii,
    get_qualitative_label
)
from helpers_functions.score_calibrator import apply_calibration_to_critique
from helpers_functions.acknowledgment_manager import select_acknowledgment, update_used_acknowledgments, get_followup_template
from helpers_functions.difficulty_manager import adjust_difficulty, get_difficulty_instruction
from helpers_functions.context_manager import update_recent_context, get_context_instruction
from helpers_functions.persona_manager import get_persona_instruction, resolve_persona
from helpers_functions.followup_manager import (
    get_followup_instruction, 
    detect_contradictions, 
    add_natural_imperfection,
    should_inject_challenge,
    get_challenge_question
)
from helpers_functions.evidence_extractor import extract_candidate_phrases, inject_evidence_into_critique
from langgraphs.schema import InterviewState
from langgraphs.langsmith_setup import tracer, json_output_parser
from langgraphs.prompts import (
    technical_prompt_test,
    hr_prompt_test,
    marketing_prompt_test,
    sales_prompt_test,
)

# Configure logging collaboration platform
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_question(state: InterviewState) -> InterviewState:
    start_total = time.time()
    session_id = state.get("langsmith_run_id", "unknown")
    interview_type = state.get("type", 0)
    
    # Map type to role name
    role_map = {0: "technical", 1: "hr", 2: "marketing", 3: "sales"}
    role = role_map.get(interview_type, "technical")
    
    # CRITICAL FIX: Increment question counter at START (before challenge checks)
    # This ensures question_asked=1 for first question, 2 for second, etc.
    state["question_asked"] = state.get("question_asked", 0) + 1
    current_question_num = state["question_asked"]
    
    # Get persona information
    persona_id = state.get("persona", 0)
    persona_name = resolve_persona(persona_id)
    
    logger.info(f"\n[{session_id}] ===== GENERATE QUESTION START (Q#{current_question_num}) =====")
    logger.info(f"[{session_id}] Interview type: {interview_type} ({role})")
    logger.info(f"[{session_id}] Persona: {persona_id} ({persona_name})")
    logger.info(f"[{session_id}] Current section: {state.get('current_section')}")
    logger.info(f"[{session_id}] Current difficulty: {state.get('difficulty', 2)}")
    
    try:
        # Select prompt
        start_prompt = time.time()
        if state["type"] == 0:
            prompt = technical_prompt_test
        elif state["type"] == 1:
            prompt = hr_prompt_test
        elif state["type"] == 2:
            prompt = marketing_prompt_test
        elif state["type"] == 3:
            prompt = sales_prompt_test
        else:
            raise ValueError(f"Unknown interview type: {state['type']}")
        
        logger.info(f"[{session_id}] Prompt selection: {time.time() - start_prompt:.4f}s")

        # Extract sections - handle case where resume is still a string (plan generation failed)
        if isinstance(state["resume"], str):
            logger.error(f"[{session_id}] Resume is still a string - plan generation likely failed")
            raise ValueError("Resume was not properly parsed. Plan generation may have failed.")
        
        sections = list(state["resume"].keys())
        logger.info(f"[{session_id}] Sections: {sections}")

        # Helper function to find next section with pending questions (PRIORITY-BASED)
        def find_next_section(resume):
            """
            Find the next section based on PRIORITY (5 > 4 > 3 > 2 > 1).
            Always picks highest priority section with remaining questions.
            Prevents getting stuck in low-priority sections.
            """
            available_sections = []
            
            for section in sections:
                if 'asked_question' not in resume[section] or 'max_question' not in resume[section]:
                    logger.warning(f"[{session_id}] Section '{section}' missing fields, skipping")
                    continue
                
                asked = int(resume[section]['asked_question'])
                max_q = int(resume[section]['max_question'])
                priority = int(resume[section].get('priority', 1))  # Default to lowest priority
                
                if asked < max_q:
                    available_sections.append((priority, section, asked, max_q))
                    logger.info(f"[{session_id}] Section '{section}': priority={priority}, asked={asked}/{max_q}")
            
            if not available_sections:
                return None
            
            # Sort by priority DESC (5 > 4 > 3...), then by asked questions ASC
            available_sections.sort(key=lambda x: (-x[0], x[2]))
            
            selected = available_sections[0]
            logger.info(f"[{session_id}] ✅ Selected section '{selected[1]}' (priority {selected[0]}, {selected[2]}/{selected[3]} asked)")
            return selected[1]

        start_find = time.time()
        next_section = find_next_section(state["resume"])
        state["current_section"] = next_section
        logger.info(f"[{session_id}] Section selection: {time.time() - start_find:.4f}s")

        # Check if interview is complete
        if not next_section:
            logger.info(f"[{session_id}] All sections covered, ending interview")
            state["current_question"] = "Thank you for your time! Do you have any questions for us?"
            state["current_section"] = "Conclusion"
            logger.info(f"[{session_id}] Total runtime: {time.time() - start_total:.4f}s")
            return state

        # Mask PII in user answer before processing
        if state.get("user_answer"):
            state["user_answer"] = mask_pii(state["user_answer"])
        
        # PERSONA INSTRUCTION: Generate persona behavioral rules (affects language only)
        persona_instruction = get_persona_instruction(persona_id)
        logger.info(f"[{session_id}] Persona instruction generated for: {persona_name}")
        
        # PRODUCTION ENHANCEMENT: Generate difficulty instruction
        current_difficulty = state.get("difficulty", 2)
        difficulty_instruction = get_difficulty_instruction(current_difficulty)
        
        # PRODUCTION ENHANCEMENT: Get follow-up intensity from previous score
        # This was stored in the previous iteration
        followup_intensity = state.get("followup_intensity", "")
        
        # PRODUCTION ENHANCEMENT: Generate context instruction
        recent_summary = state.get("recent_answers_summary", "")
        context_instruction = get_context_instruction(recent_summary, state["current_section"])
        
        # Combine context and followup intensity
        if followup_intensity:
            context_instruction = followup_intensity + "\n\n" + context_instruction
        
        # PRODUCTION ENHANCEMENT: Check if we should inject a challenge question
        # Prevents interviewer from being too "safe" with easy follow-ups
        consecutive_safe = state.get("consecutive_safe_questions", 0)
        last_challenge_num = state.get("last_challenge_question_num", 0)
        last_score = state.get("last_score", 3)
        # current_question_num already set at function start
        
        challenge_injection = None
        if should_inject_challenge(consecutive_safe, last_challenge_num, current_question_num, last_score, session_id):
            # Choose challenge type randomly
            challenge_type = "scenario_flip" if state.get("last_score", 3) >= 3 else "production_reality"
            
            # FIXED: Pass context from previous answer for better relevance
            last_answer = state.get("user_answer", "")
            challenge_context = last_answer[:200] if last_answer else ""  # First 200 chars of last answer
            
            challenge_injection = get_challenge_question(role, challenge_type, challenge_context, session_id)
            
            # Reset consecutive safe counter and mark challenge
            state["consecutive_safe_questions"] = 0
            state["last_challenge_question_num"] = current_question_num
            
            logger.info(f"[{session_id}] Injecting {challenge_type} challenge with context: {challenge_injection[:80]}...")
        else:
            # Increment consecutive safe questions
            state["consecutive_safe_questions"] = consecutive_safe + 1
        
        # PRODUCTION ENHANCEMENT: Check for contradictions in answers
        contradiction_prompt = None
        if state.get("user_answer") and state.get("history"):
            contradiction_prompt = detect_contradictions(
                state["user_answer"],
                state["history"],
                session_id
            )
        
        # If contradiction found, use it as a priority follow-up
        if contradiction_prompt:
            logger.warning(f"[{session_id}] Using contradiction follow-up: {contradiction_prompt[:100]}...")
            # Override context instruction to prioritize contradiction
            context_instruction = f"""
### CRITICAL: CONTRADICTION DETECTED
The candidate has given contradictory statements across answers.
Your NEXT QUESTION must address this contradiction:

{contradiction_prompt}

Ask this as your follow-up question. Be direct but professional in pointing out the inconsistency.
"""
        # If challenge injection needed (no contradiction), inject scenario flip or production reality
        elif challenge_injection:
            context_instruction = f"""
### CHALLENGE INJECTION: {challenge_injection.split('—')[0].upper().strip()}
The interview has been too predictable. Inject this challenge question:

{challenge_injection}

Ask this directly to test their adaptability and real-world thinking.
"""
            # Mark as challenge question (not safe)
            state["consecutive_safe_questions"] = 0
        
        # PRODUCTION ENHANCEMENT: Select varied follow-up template
        used_templates = state.get("used_followup_templates", [])
        followup_template = get_followup_template(used_templates)
        logger.info(f"[{session_id}] Selected follow-up template: {followup_template[:50]}...")

        # Use previous acknowledgment for prompt (empty on first question)
        previous_ack = state.get("last_acknowledgment", "")
        
        # LLM invocation with enhanced logging
        start_invoke = time.time()
        
        # Technical interviews use followup templates, others don't
        # PROMPT ORDER: Persona → Difficulty → Context → Question rules
        if state["type"] == 0:  # Technical
            prompt_text = prompt(state, previous_ack, persona_instruction, difficulty_instruction, context_instruction, followup_template)
        else:  # HR, Marketing, Sales
            prompt_text = prompt(state, previous_ack, persona_instruction, difficulty_instruction, context_instruction)
        
        prompt_length = len(prompt_text)
        
        logger.info(f"[{session_id}] Invoking LLM - prompt length: {prompt_length} chars")
        logger.info(f"[{session_id}] Previous acknowledgment: '{previous_ack or '(none - first question)'}' | Difficulty: {current_difficulty} | Persona: {persona_name}")
        
        response = client_llm2.invoke(
            [("system", prompt_text)],
            config={
                "callbacks": [tracer],
                "metadata": {
                    "session_id": session_id,
                    "role": role,
                    "section": state["current_section"],
                    "difficulty": current_difficulty,
                    "temperature": 0.65,
                    "model": "gpt-4o-mini",
                    "ack_phrase": previous_ack,
                }
            },
        )
        
        llm_latency = time.time() - start_invoke
        response_length = len(response.content)
        
        logger.info(f"[{session_id}] LLM response - latency: {llm_latency:.4f}s, length: {response_length} chars")

        # Parse JSON with robust error handling
        start_parse = time.time()
        expected_keys = ["section_name", "best_question", "Critique"]
        
        def retry_callback(keys):
            """Retry with corrective prompt if initial parse fails"""
            retry_prompt = f"""Your previous response had a JSON formatting error. 
            Please return ONLY valid JSON with these exact keys: {', '.join(keys)}.
            No markdown, no explanation, just the JSON object."""
            
            retry_response = client_llm2.invoke(
                [("system", retry_prompt)],
                config={"max_tokens": 150}
            )
            return retry_response.content
        
        parsed_data = parse_llm_json_response(
            response.content,
            expected_keys,
            session_id,
            retry_callback,
            max_retries=1
        )
        
        parse_success = True
        logger.info(f"[{session_id}] JSON parsing: {time.time() - start_parse:.4f}s")

        # Extract and calibrate critique
        critique = parsed_data.get("Critique", {})
        
        # FIX 1: Extract candidate phrases for evidence-based critique
        # If LLM forgot to include quotes, we inject them here as fallback
        candidate_answer = state.get("user_answer", "")
        if candidate_answer:
            candidate_phrases = extract_candidate_phrases(candidate_answer, max_phrases=2, max_words_per_phrase=10)
            
            # Inject evidence into critique fields if phrases found
            if candidate_phrases:
                critique["correct_answer"] = inject_evidence_into_critique(
                    critique.get("correct_answer", ""),
                    candidate_phrases,
                    critique.get("correct_answer", "")
                )
                critique["strengths_and_weakness"] = inject_evidence_into_critique(
                    critique.get("strengths_and_weakness", ""),
                    candidate_phrases,
                    critique.get("strengths_and_weakness", "")
                )
                logger.info(f"[{session_id}] 📝 Evidence injection: Added {len(candidate_phrases)} quotes to critique")
        
        # PRODUCTION ENHANCEMENT: Apply scoring calibration
        # This includes evidence validation (score ≥4 requires quoted evidence)
        critique = apply_calibration_to_critique(
            critique,
            candidate_answer,
            session_id
        )
        
        score = critique.get("score", 3)
        calibration_applied = critique.get("_internal_calibration_applied", False)
        
        # PRODUCTION ENHANCEMENT: Get follow-up intensity based on score
        # This will be used for the NEXT question generation
        followup_intensity = get_followup_instruction(score, session_id)
        state["followup_intensity"] = followup_intensity  # Store for next iteration
        
        # PRODUCTION FIX: Select acknowledgment based on CURRENT score (not previous)
        # Pass followup intensity to enable dynamic probability (35-60% skip chance)
        # Pass persona_id to filter acknowledgments based on language style
        ack_phrase = select_acknowledgment(
            role=role,
            score=score,  # Use the just-calculated score
            used_phrases=state.get("used_acknowledgments", []),
            session_id=session_id,
            followup_intensity=followup_intensity,  # Add intensity for dynamic skipping
            persona_id=persona_id  # Filter phrases based on persona language style
        )
        logger.info(f"[{session_id}] ✅ Acknowledgment selected: '{ack_phrase}' (score={score}, persona={persona_name})")
        
        # Log score with qualitative label for internal tracking
        quality_label = get_qualitative_label(score)
        logger.info(f"[{session_id}] Answer score: {score}/5 ({quality_label}) | Calibrated: {calibration_applied}")
        
        # Store acknowledgment for next question's prompt
        state["last_acknowledgment"] = ack_phrase
        
        # Track consecutive high scores for faster difficulty increase
        consecutive_high = state.get("consecutive_high_scores", 0)
        if score >= 4:
            consecutive_high += 1
        else:
            consecutive_high = 0  # Reset on non-high score
        state["consecutive_high_scores"] = consecutive_high
        
        # PRODUCTION ENHANCEMENT: Adjust difficulty based on score (with acceleration)
        new_difficulty, difficulty_changed = adjust_difficulty(
            current_difficulty,
            score,
            session_id,
            consecutive_high_scores=consecutive_high
        )
        state["difficulty"] = new_difficulty
        
        # PRODUCTION ENHANCEMENT: Update used acknowledgments
        state["used_acknowledgments"] = update_used_acknowledgments(
            state.get("used_acknowledgments", []),
            ack_phrase
        )
        
        # PRODUCTION ENHANCEMENT: Update used follow-up templates
        used_templates = state.get("used_followup_templates", [])
        used_templates.append(followup_template)
        state["used_followup_templates"] = used_templates
        logger.info(f"[{session_id}] Follow-up templates used: {len(used_templates)}")
        
        # PRODUCTION ENHANCEMENT: Update recent context
        if state.get("user_answer"):
            state["recent_answers_summary"] = update_recent_context(
                state.get("recent_answers_summary", ""),
                state["user_answer"],
                critique.get("strengths_and_weakness", "")
            )
        
        # PRODUCTION ENHANCEMENT: Comprehensive telemetry logging
        telemetry = {
            "session_id": session_id,
            "role": role,
            "section": state["current_section"],
            "difficulty": new_difficulty,
            "difficulty_changed": difficulty_changed,
            "prompt_length_chars": prompt_length,
            "model_name": "gpt-4o-mini",
            "temperature": 0.65,
            "max_tokens": 220,
            "llm_latency_seconds": round(llm_latency, 4),
            "response_length_chars": response_length,
            "parse_success": parse_success,
            "score_assigned": score,
            "ack_phrase_used": ack_phrase,
            "calibration_applied": calibration_applied,
            "used_acks_count": len(state.get("used_acknowledgments", [])),
        }
        logger.info(f"[{session_id}] 📊 TELEMETRY: {json.dumps(telemetry)}")

        # Update state
        start_update = time.time()
        
        # Update history with user's answer (PII-masked) - store as dict for JSON serialization
        if state["user_answer"]:
            state["history"].append({"role": "human", "content": state["user_answer"]})
        
        # Update current section and question
        current_section = parsed_data["section_name"]
        generated_question = parsed_data["best_question"]
        
        # PRODUCTION ENHANCEMENT: Add natural imperfections occasionally (15% of questions)
        question_with_imperfections = add_natural_imperfection(generated_question, session_id)
        
        # FIXED: Prepend acknowledgment to question (if not first question)
        if ack_phrase and ack_phrase != "(none - first question)":
            state["current_question"] = f"{ack_phrase} {question_with_imperfections}"
        else:
            state["current_question"] = question_with_imperfections
        
        # Increment asked_question count
        if current_section in state["resume"]:
            state["resume"][current_section]["asked_question"] = str(
                int(state["resume"][current_section].get("asked_question", 0)) + 1
            )
        
        # Add AI question to history - store as dict for JSON serialization
        state["history"].append({"role": "ai", "content": state["current_question"]})
        
        # Remove internal metadata from critique before storing
        critique_clean = {k: v for k, v in critique.items() if not k.startswith("_internal")}
        state["critique"] = critique_clean
        
        logger.info(f"[{session_id}] State update: {time.time() - start_update:.4f}s")
        logger.info(f"[{session_id}] Section '{current_section}': {state['resume'][current_section].get('asked_question', 0)}/{state['resume'][current_section].get('max_question', 0)} questions")
        logger.info(f"[{session_id}] ===== TOTAL RUNTIME: {time.time() - start_total:.4f}s =====\n")

        return state

    except Exception as e:
        logger.error(f"[{session_id}] ERROR: {e}", exc_info=True)
        state["current_question"] = (
            "There was an issue processing your last response. Could you please repeat your previous answer?"
        )
        logger.info(f"[{session_id}] ===== GENERATE QUESTION END (ERROR) =====\n")
        return state








