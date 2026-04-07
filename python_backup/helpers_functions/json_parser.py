"""
Robust JSON parsing utilities with sanitization, retry logic, and fallback
"""
import json
import re
import logging
from typing import Dict, Any, Optional, Tuple, List

logger = logging.getLogger(__name__)

def sanitize_json_response(text: str) -> str:
    """
    Strip everything before first { and after last } to extract clean JSON.
    
    Args:
        text: Raw LLM response that may contain markdown, explanations, etc.
    
    Returns:
        Sanitized JSON string
    """
    # Remove markdown code blocks if present
    text = text.strip()
    
    # Remove ```json or ``` markers
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    
    if text.endswith("```"):
        text = text[:-3]
    
    text = text.strip()
    
    # Find first { and last }
    first_brace = text.find('{')
    last_brace = text.rfind('}')
    
    if first_brace == -1 or last_brace == -1 or first_brace >= last_brace:
        logger.warning("No valid JSON braces found in response")
        return text
    
    # Extract only the JSON portion
    json_text = text[first_brace:last_brace + 1]
    
    return json_text


def parse_llm_json_response(
    response_text: str,
    expected_keys: list,
    session_id: str = "unknown",
    retry_callback: Optional[callable] = None,
    max_retries: int = 1
) -> Dict[str, Any]:
    """
    Parse JSON from LLM response with robust error handling.
    
    Args:
        response_text: Raw LLM response
        expected_keys: List of required keys in JSON
        session_id: Session identifier for logging
        retry_callback: Optional function to retry LLM call with corrective prompt
        max_retries: Maximum number of retry attempts
    
    Returns:
        Dict with parsed JSON data (returns fallback dict on failure)
    """
    # Log raw output (truncated)
    logger.info(f"[{session_id}] Raw LLM output (first 500 chars): {response_text[:500]}")
    
    # Attempt 1: Parse with sanitization
    try:
        sanitized = sanitize_json_response(response_text)
        parsed = json.loads(sanitized)
        
        # Validate expected keys
        missing_keys = [k for k in expected_keys if k not in parsed]
        if missing_keys:
            logger.warning(f"[{session_id}] Missing keys: {missing_keys}")
        else:
            logger.info(f"[{session_id}] JSON parsed successfully on first attempt")
            return parsed
            
    except json.JSONDecodeError as e:
        logger.error(f"[{session_id}] JSON parse error on first attempt: {e}")
        logger.debug(f"[{session_id}] Sanitized text: {sanitized[:300]}")
    
    # Attempt 2: Retry with corrective prompt (if callback provided)
    if retry_callback and max_retries > 0:
        logger.info(f"[{session_id}] Attempting retry with corrective prompt")
        try:
            retry_response = retry_callback(expected_keys)
            sanitized = sanitize_json_response(retry_response)
            parsed = json.loads(sanitized)
            
            logger.info(f"[{session_id}] JSON parsed successfully on retry")
            return parsed
            
        except Exception as e:
            logger.error(f"[{session_id}] Retry also failed: {e}")
    
    # Fallback: Return minimal safe JSON
    logger.warning(f"[{session_id}] Using fallback JSON structure")
    return get_fallback_response()


def get_fallback_response(session_id: str = "unknown") -> Dict[str, Any]:
    """
    Generate deterministic fallback JSON when parsing fails.
    
    Args:
        session_id: Session identifier for logging
    
    Returns:
        Minimal valid JSON response
    """
    return {
        "section_name": "General",
        "best_question": "I'd like to hear more about your experience. Could you elaborate on what you just mentioned?",
        "Critique": {
            "quality": "Satisfactory",
            "correct_answer": "Unable to evaluate - please provide more details",
            "follow_up_question": "Can you give me a specific example?",
            "strengths_and_weakness": "Need more information to assess"
        }
    }


def mask_pii(text: str) -> str:
    """
    Mask personally identifiable information (PII) in text.
    
    Args:
        text: Text that may contain PII
    
    Returns:
        Text with PII masked
    """
    if not text:
        return text
    
    # Email pattern
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    text = re.sub(email_pattern, '[REDACTED_EMAIL]', text)
    
    # Phone patterns (various formats)
    phone_patterns = [
        r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',  # 123-456-7890
        r'\b\(\d{3}\)\s*\d{3}[-.\s]?\d{4}\b',  # (123) 456-7890
        r'\b\d{10}\b',  # 1234567890
        r'\+\d{1,3}\s?\d{6,14}\b',  # International
    ]
    for pattern in phone_patterns:
        text = re.sub(pattern, '[REDACTED_PHONE]', text)
    
    # SSN pattern
    ssn_pattern = r'\b\d{3}-\d{2}-\d{4}\b'
    text = re.sub(ssn_pattern, '[REDACTED_SSN]', text)
    
    # Credit card pattern (simple)
    cc_pattern = r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b'
    text = re.sub(cc_pattern, '[REDACTED_CC]', text)
    
    return text


def get_qualitative_label(score: float) -> str:
    """
    Convert numeric score to qualitative label for consistent branching.
    
    Args:
        score: Numeric score (1-5 or 0-10)
    
    Returns:
        Qualitative label: Strong, Satisfactory, or Needs Elaboration
    """
    # Handle 1-5 scale
    if score <= 5:
        if score >= 4:
            return "Strong"
        elif score >= 3:
            return "Satisfactory"
        else:
            return "Needs Elaboration"
    
    # Handle 0-10 scale (legacy)
    if score >= 7:
        return "Strong"
    elif score >= 5:
        return "Satisfactory"
    else:
        return "Needs Elaboration"


def validate_json_syntax(text: str, session_id: str = "unknown") -> Tuple[str, List[str]]:
    """
    Lightweight JSON validator to catch common syntax issues before parsing.
    Returns (cleaned_text, warnings_list)
    """
    warnings = []
    
    # Remove markdown code blocks if present
    if "```" in text:
        text = text.replace("```json", "").replace("```", "")
        warnings.append("Removed markdown code blocks")
    
    # Detect trailing commas (simple regex - not perfect but catches common cases)
    import re
    if re.search(r',\s*[}\]]', text):
        warnings.append("Detected trailing commas")
        text = re.sub(r',\s*([}\]])', r'\1', text)
    
    # Check for unescaped quotes in strings (very basic check)
    # Count opening/closing braces
    open_braces = text.count('{')
    close_braces = text.count('}')
    if open_braces != close_braces:
        warnings.append(f"Brace mismatch: {open_braces} {{ vs {close_braces} }}")
    
    if warnings:
        logger.warning(f"[{session_id}] JSON validation warnings: {warnings}")
    
    return text, warnings


def parse_summary_json(
    response_text: str,
    session_id: str = "unknown",
    retry_callback: Optional[callable] = None
) -> Tuple[Dict[str, Any], bool]:
    """
    Parse final summary JSON with strict schema enforcement and repair logic.
    
    This function enforces the exact summary schema required by the frontend.
    If parsing fails, attempts one repair call. If that fails, returns deterministic fallback.
    
    Args:
        response_text: Raw LLM response
        session_id: Session identifier for logging
        retry_callback: Function to call LLM for repair
    
    Returns:
        Tuple of (parsed_dict, parse_success)
    """
    logger.info(f"[{session_id}] Parsing summary JSON (length: {len(response_text)} chars)")
    
    # Expected schema keys
    required_top_keys = [
        "overall_score", "percentile_rank", "role_match_index",
        "fit_summary", "summary", "detailed_insight_layers"
    ]
    
    required_insight_keys = [
        "L1_Integrity_and_Reliability", "L2_Cultural_Fit",
        "L3_Competence", "L4_Judgment", "L5_Communication"
    ]
    
    # Attempt 1: Parse raw response
    try:
        sanitized = sanitize_json_response(response_text)
        parsed = json.loads(sanitized)
        
        # Validate top-level keys
        missing_top = [k for k in required_top_keys if k not in parsed]
        if not missing_top:
            # Validate insight layers if present
            insight_layers = parsed.get("detailed_insight_layers", {})
            missing_insight = [k for k in required_insight_keys if k not in insight_layers]
            
            if not missing_insight:
                # Ensure overall_score is string (LLM sometimes returns int)
                if "overall_score" in parsed and not isinstance(parsed["overall_score"], str):
                    parsed["overall_score"] = str(parsed["overall_score"])
                # Truncate long values to ensure total < 800 chars
                parsed = truncate_summary_values(parsed, session_id)
                logger.info(f"[{session_id}] ✅ Summary parsed successfully on first attempt")
                return parsed, True
            else:
                logger.warning(f"[{session_id}] Missing insight keys: {missing_insight}")
        else:
            logger.warning(f"[{session_id}] Missing top keys: {missing_top}")
    
    except json.JSONDecodeError as e:
        logger.error(f"[{session_id}] Initial summary parse failed: {e}")
    
    # Attempt 2: Repair call
    if retry_callback:
        logger.info(f"[{session_id}] Attempting summary repair...")
        try:
            repair_prompt = """
You returned invalid JSON. Return ONLY valid JSON matching this EXACT schema.
Truncate values if necessary to keep total length < 800 characters.

{
  "overall_score": "<number 0-100>",
  "percentile_rank": "<string>",
  "role_match_index": "<string>",
  "fit_summary": "<short string max 100 chars>",
  "summary": "<short string max 200 chars>",
  "detailed_insight_layers": {
    "L1_Integrity_and_Reliability": "<max 100 chars>",
    "L2_Cultural_Fit": "<max 100 chars>",
    "L3_Competence": "<max 100 chars>",
    "L4_Judgment": "<max 100 chars>",
    "L5_Communication": "<max 100 chars>"
  }
}

Return ONLY the JSON object, no other text.
"""
            repair_response = retry_callback(repair_prompt)
            sanitized = sanitize_json_response(repair_response)
            parsed = json.loads(sanitized)
            
            # Ensure overall_score is string (LLM sometimes returns int)
            if "overall_score" in parsed and not isinstance(parsed["overall_score"], str):
                parsed["overall_score"] = str(parsed["overall_score"])
            # Truncate if needed
            parsed = truncate_summary_values(parsed, session_id)
            logger.info(f"[{session_id}] ✅ Summary parsed successfully after repair")
            return parsed, True
            
        except Exception as e:
            logger.error(f"[{session_id}] Summary repair also failed: {e}")
    
    # Fallback: Return deterministic minimal summary
    logger.error(f"[{session_id}] ❌ Using fallback summary (both attempts failed)")
    fallback = get_fallback_summary()
    return fallback, False


def truncate_summary_values(summary: Dict[str, Any], session_id: str = "unknown") -> Dict[str, Any]:
    """
    Truncate summary values to ensure total combined length < 800 characters.
    
    Args:
        summary: Parsed summary dictionary
        session_id: Session ID for logging
    
    Returns:
        Summary with truncated values
    """
    # Max lengths for each field
    max_lengths = {
        "overall_score": 10,
        "percentile_rank": 30,
        "role_match_index": 30,
        "fit_summary": 100,
        "summary": 200,
    }
    
    # Truncate top-level string fields
    for key, max_len in max_lengths.items():
        if key in summary and isinstance(summary[key], str):
            original = summary[key]
            if len(original) > max_len:
                summary[key] = original[:max_len-3] + "..."
                logger.info(f"[{session_id}] Truncated {key}: {len(original)}→{max_len} chars")
    
    # Truncate insight layers (max 100 chars each)
    if "detailed_insight_layers" in summary:
        layers = summary["detailed_insight_layers"]
        for key in layers:
            if isinstance(layers[key], str) and len(layers[key]) > 100:
                original = layers[key]
                layers[key] = original[:97] + "..."
                logger.info(f"[{session_id}] Truncated {key}: {len(original)}→100 chars")
    
    return summary


def get_fallback_summary() -> Dict[str, Any]:
    """
    Generate deterministic fallback summary when all parsing fails.
    
    Returns:
        Minimal valid summary matching required schema
    """
    return {
        "overall_score": "50",
        "percentile_rank": "50th percentile",
        "role_match_index": "50%",
        "fit_summary": "Unable to complete full assessment due to technical issue.",
        "summary": "Candidate completed interview. Detailed analysis unavailable at this time.",
        "detailed_insight_layers": {
            "L1_Integrity_and_Reliability": "Assessment pending",
            "L2_Cultural_Fit": "Assessment pending",
            "L3_Competence": "Assessment pending",
            "L4_Judgment": "Assessment pending",
            "L5_Communication": "Assessment pending"
        }
    }

