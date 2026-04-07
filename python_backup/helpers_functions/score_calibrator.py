"""
Scoring calibration system with few-shot examples and heuristic adjustment.
Ensures realistic 1-5 scores through LLM guidance and post-processing.
"""
import logging
import re
from typing import Dict, Tuple

logger = logging.getLogger(__name__)

# Import evidence validation
try:
    from helpers_functions.evidence_extractor import validate_critique_has_evidence
except ImportError:
    # Fallback if not available
    def validate_critique_has_evidence(critique, candidate_answer, score, session_id="unknown"):
        return True, ""

# Few-shot calibration examples for prompts (ULTRA-COMPACT)
SCORING_CALIBRATION_EXAMPLES = """
### SCORING CALIBRATION - Use These Patterns:

**Score 1** (Poor): "Not sure, maybe something about pointers?" → Off-topic, no understanding, guessing
**Score 2** (Below Average): "Hashing is for storing data" → Incomplete, vague, lacks detail
**Score 3** (Average): "Hash map uses key-value pairs for O(1) lookup" → Basic definition, correct but shallow
**Score 4** (Good): "Hash maps provide O(1) average lookup via hashing. Used them in my cache system for user sessions" → Correct + practical example
**Score 5** (Excellent): "Hash maps offer O(1) average, O(n) worst-case lookup. Tradeoff: memory overhead vs speed. In my payment system, used consistent hashing to handle collision-heavy scenarios; implemented separate chaining for collision resolution" → Tradeoffs + complexity analysis + concrete example + edge cases

**KEY INDICATORS:**
- Score 5 needs: example/project + tradeoffs/alternatives + complexity/edge cases
- Score 1-2: "I don't know", off-topic, purely guessing
- Score 3: Correct definition only, no depth
"""

# Evidence keywords for score validation (EXPANDED)
STRONG_EVIDENCE_KEYWORDS = [
    "example", "project", "implemented", "designed", "tradeoff", "alternative",
    "edge case", "complexity", "optimization", "considered", "compared",
    "experience", "used", "built", "handled", "analyzed", "time complexity",
    "space complexity", "performance", "scalability", "steps", "approach",
    "strategy", "solution", "implemented", "architecture", "design pattern"
]

# Weak answer indicators (expanded for stricter evaluation)
WEAK_INDICATORS = [
    "i don't know", "not sure", "i guess", "maybe", "i think so",
    "probably", "might be", "i'm not familiar", "haven't worked", "no idea",
    "not really", "kind of", "sort of", "i suppose", "unsure",
    "haven't done", "don't remember", "i believe", "possibly", "could be",
    "not too familiar", "haven't used", "no experience", "unclear",
    "not much", "limited understanding", "vague", "i'll try"
]


def get_calibration_examples() -> str:
    """
    Returns few-shot scoring calibration examples for inclusion in prompts.
    
    Returns:
        String containing calibration examples
    """
    return SCORING_CALIBRATION_EXAMPLES


def calibrate_score(
    score: int,
    critique_text: str,
    answer_text: str,
    session_id: str = "unknown"
) -> Tuple[int, bool]:
    """
    Apply heuristic calibration to LLM-assigned scores.
    
    Checks if score aligns with evidence in critique/answer text.
    Downgrades overly generous scores or upgrades overly harsh ones.
    
    Args:
        score: LLM-assigned score (1-5)
        critique_text: Combined critique text (strengths_and_weakness, correct_answer)
        answer_text: Candidate's answer
        session_id: Session ID for logging
    
    Returns:
        Tuple of (calibrated_score, was_adjusted)
    """
    original_score = score
    was_adjusted = False
    
    # Normalize texts to lowercase for analysis
    critique_lower = critique_text.lower()
    answer_lower = answer_text.lower() if answer_text else ""
    
    # Count evidence indicators
    strong_evidence_count = sum(1 for keyword in STRONG_EVIDENCE_KEYWORDS if keyword in critique_lower or keyword in answer_lower)
    weak_indicator_count = sum(1 for indicator in WEAK_INDICATORS if indicator in answer_lower)
    
    # Rule 1: Score 5 requires strong evidence
    if score == 5:
        # Must have at least 3 strong evidence keywords
        if strong_evidence_count < 3:
            score = 4
            was_adjusted = True
            logger.info(
                f"[{session_id}] Score calibration: 5→4 "
                f"(insufficient evidence: {strong_evidence_count} keywords)"
            )
    
    # Rule 2: Score 4-5 should not have weak indicators
    if score >= 4 and weak_indicator_count >= 2:
        score = max(3, score - 1)
        was_adjusted = True
        logger.info(
            f"[{session_id}] Score calibration: {original_score}→{score} "
            f"(weak indicators detected: {weak_indicator_count})"
        )
    
    # CRITICAL Rule 2b: Explicit "I don't know" / "Can't think" = automatic score 1
    # *** RUN THIS EARLY to prevent other rules from upgrading these answers ***
    if answer_text:
        explicit_unknown = [
            "i don't know", "don't know", "no idea", "i'm not sure", "not sure",
            "haven't worked", "no experience", "not familiar", "don't remember",
            "can't think", "can't recall", "i don't understand", "unclear",
            "sorry", "i give up", "no clue", "confused", "lost"
        ]
        answer_lower = answer_text.lower().strip()
        
        # If answer is VERY short (< 50 chars) and contains unknown phrase = score 1
        if len(answer_text) < 50 and any(phrase in answer_lower for phrase in explicit_unknown):
            if score > 1:
                score = 1
                was_adjusted = True
                logger.warning(
                    f"[{session_id}] Score calibration: {original_score}→1 "
                    f"(explicit lack of knowledge in short answer: '{answer_text[:50]}...')"
                )
        # For longer answers (50-100 chars), still downgrade if mostly just "I don't know"
        elif len(answer_text) < 100:
            unknown_match_count = sum(1 for phrase in explicit_unknown if phrase in answer_lower)
            if unknown_match_count >= 2 and score > 1:
                score = 1
                was_adjusted = True
                logger.warning(
                    f"[{session_id}] Score calibration: {original_score}→1 "
                    f"(multiple 'don't know' phrases: {unknown_match_count})"
                )
    
    # Rule 3: Score 1 with some correctness should be upgraded (but NOT if "I don't know")
    # Only apply if we didn't just force score 1 above
    if score == 1 and original_score == 1:
        # Check for any correctness indicators in critique
        correctness_phrases = ["correct", "right", "good", "understands", "knows"]
        has_correctness = any(phrase in critique_lower for phrase in correctness_phrases)
        
        if has_correctness or strong_evidence_count > 0:
            score = 2
            was_adjusted = True
            logger.info(
                f"[{session_id}] Score calibration: 1→2 "
                f"(some correctness detected)"
            )
    
    # Rule 3b: Score 3 with multiple weak indicators should be downgraded
    # FIXED: Increased threshold from 3 to 4 weak indicators to be less harsh
    # Score 3 is "average/satisfactory" - should only downgrade if REALLY weak (4+ indicators)
    if score == 3 and weak_indicator_count >= 4:
        score = 2
        was_adjusted = True
        logger.info(
            f"[{session_id}] Score calibration: 3→2 "
            f"(multiple weak indicators: {weak_indicator_count})"
        )
    
    # Rule 4: Very short answers (< 20 words) rarely deserve 4-5
    if answer_text:
        word_count = len(answer_text.split())
        if word_count < 20 and score >= 4:
            score = 3
            was_adjusted = True
            logger.info(
                f"[{session_id}] Score calibration: {original_score}→3 "
                f"(answer too brief: {word_count} words)"
            )
        # FIXED: Very short + weak = score 2 (increased threshold from 1 to 2 weak indicators)
        # Being brief alone shouldn't penalize too much - need multiple weak signals
        elif word_count < 15 and score >= 3 and weak_indicator_count >= 2:
            score = 2
            was_adjusted = True
            logger.info(
                f"[{session_id}] Score calibration: {original_score}→2 "
                f"(very brief + weak: {word_count} words, {weak_indicator_count} weak indicators)"
            )
    
    # Rule 5: Ensure score stays in valid range
    score = max(1, min(5, score))
    
    if was_adjusted:
        logger.warning(
            f"[{session_id}] ⚖️  SCORE ADJUSTED: {original_score} → {score}"
        )
    
    return score, was_adjusted


def validate_critique_format(critique: Dict, session_id: str = "unknown") -> bool:
    """
    Validate that critique contains all required fields with proper format.
    
    Args:
        critique: Critique dictionary from LLM
        session_id: Session ID for logging
    
    Returns:
        True if valid, False otherwise
    """
    required_keys = ["score", "correct_answer", "follow_up_question", "strengths_and_weakness"]
    
    # Check all required keys present
    missing_keys = [k for k in required_keys if k not in critique]
    if missing_keys:
        logger.error(f"[{session_id}] ❌ Missing critique keys: {missing_keys}")
        return False
    
    # Validate score is integer 1-5
    score = critique.get("score")
    if not isinstance(score, int) or score < 1 or score > 5:
        logger.error(f"[{session_id}] ❌ Invalid score: {score} (must be integer 1-5)")
        return False
    
    # Validate text fields are non-empty strings
    for key in ["correct_answer", "follow_up_question", "strengths_and_weakness"]:
        value = critique.get(key, "")
        if not isinstance(value, str) or len(value.strip()) == 0:
            logger.error(f"[{session_id}] ❌ Empty or invalid {key}")
            return False
    
    # Validate length constraints (enforce conciseness)
    correct_answer = critique["correct_answer"]
    follow_up = critique["follow_up_question"]
    strengths_weakness = critique["strengths_and_weakness"]
    
    # correct_answer should be 1 concise sentence (< 200 chars)
    if len(correct_answer) > 250:
        logger.warning(f"[{session_id}] ⚠️  correct_answer too long ({len(correct_answer)} chars)")
    
    # follow_up_question should be single question (< 150 chars)
    if len(follow_up) > 200:
        logger.warning(f"[{session_id}] ⚠️  follow_up_question too long ({len(follow_up)} chars)")
    
    # strengths_and_weakness should be 1-2 sentences (< 300 chars)
    if len(strengths_weakness) > 350:
        logger.warning(f"[{session_id}] ⚠️  strengths_and_weakness too long ({len(strengths_weakness)} chars)")
    
    logger.info(f"[{session_id}] ✅ Critique validation passed")
    return True


def calibrate_by_evidence(
    score: int,
    critique_text: str,
    session_id: str = "unknown"
) -> Tuple[int, bool]:
    """
    Evidence-based calibration: check if critique text supports the assigned score.
    
    Rules:
    - Score >=4 but critique lacks evidence tokens → downgrade by 1
    - Score <=2 but critique contains quality indicators → upgrade to 2
    
    Args:
        score: Original score (1-5)
        critique_text: Combined critique text (correct_answer + strengths_and_weakness)
        session_id: Session ID for logging
    
    Returns:
        Tuple of (adjusted_score, was_adjusted)
    """
    original_score = score
    was_adjusted = False
    critique_lower = critique_text.lower()
    
    # Evidence tokens indicating quality reasoning
    quality_evidence = [
        "example", "tradeoff", "complexity", "steps", "edge case",
        "time", "space", "performance", "scalability", "alternative",
        "compared", "analyzed", "implemented", "designed", "architecture"
    ]
    
    # Quality indicators for low scores
    quality_indicators = ["correct", "detailed", "accurate", "comprehensive", "thorough"]
    
    # Count evidence tokens
    evidence_count = sum(1 for token in quality_evidence if token in critique_lower)
    has_quality_indicator = any(indicator in critique_lower for indicator in quality_indicators)
    
    # Rule 1: High score (4-5) without evidence → downgrade
    if score >= 4 and evidence_count == 0:
        score = score - 1
        was_adjusted = True
        logger.info(
            f"[{session_id}] Evidence calibration: {original_score}→{score} "
            f"(high score but no evidence tokens in critique)"
        )
    
    # Rule 2: Low score (1-2) with quality indicators → upgrade to 2
    if score <= 2 and has_quality_indicator and evidence_count > 0:
        if score == 1:
            score = 2
            was_adjusted = True
            logger.info(
                f"[{session_id}] Evidence calibration: {original_score}→{score} "
                f"(critique contains quality indicators: {evidence_count} evidence tokens)"
            )
    
    if was_adjusted:
        logger.warning(f"[{session_id}] 🔍 EVIDENCE-BASED ADJUSTMENT: {original_score} → {score}")
    
    return score, was_adjusted


def apply_calibration_to_critique(
    critique: Dict,
    answer_text: str,
    session_id: str = "unknown"
) -> Dict:
    """
    Main entry point: validate and calibrate critique from LLM.
    
    Args:
        critique: Raw critique dictionary from LLM
        answer_text: Candidate's answer text
        session_id: Session ID for logging
    
    Returns:
        Calibrated critique dictionary with adjusted score if needed
    """
    # Validate format first
    if not validate_critique_format(critique, session_id):
        logger.error(f"[{session_id}] Critique validation failed, returning as-is")
        # Return as-is but log the issue
        return critique
    
    # Extract score and relevant text
    original_score = critique["score"]
    critique_text = f"{critique['correct_answer']} {critique['strengths_and_weakness']}"
    
    # Apply heuristic calibration (word count, weak indicators, etc.)
    calibrated_score, heuristic_adjusted = calibrate_score(
        original_score,
        critique_text,
        answer_text,
        session_id
    )
    
    # Apply evidence-based calibration (check critique quality)
    calibrated_score, evidence_adjusted = calibrate_by_evidence(
        calibrated_score,
        critique_text,
        session_id
    )
    
    # Apply evidence quote validation (NEW - Fix #1)
    # For scores >= 4, require verbatim candidate quotes in critique
    has_evidence, evidence_warning = validate_critique_has_evidence(
        critique,
        answer_text,
        calibrated_score,
        session_id
    )
    
    evidence_missing = False
    if not has_evidence and calibrated_score >= 4:
        logger.warning(
            f"[{session_id}] ⚠️ EVIDENCE MISSING: Score {calibrated_score}→3 "
            f"(high score requires verbatim candidate quotes). {evidence_warning}"
        )
        calibrated_score = 3
        evidence_missing = True
    
    # Update critique with final calibrated score
    was_adjusted = heuristic_adjusted or evidence_adjusted or evidence_missing
    if was_adjusted:
        critique["score"] = calibrated_score
        # Add internal metadata (not sent to frontend)
        critique["_internal_original_score"] = original_score
        critique["_internal_calibration_applied"] = True
        if evidence_missing:
            critique["_internal_evidence_missing"] = True
    
    return critique
