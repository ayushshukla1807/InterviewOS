"""
Evidence extraction utilities for critique generation.
Extracts verbatim candidate phrases to ground critique in specific evidence.
"""
import re
import logging
from typing import List, Optional, Dict, Tuple

logger = logging.getLogger(__name__)


def extract_candidate_phrases(answer: str, max_phrases: int = 2, max_words_per_phrase: int = 10) -> List[str]:
    """
    Extract 1-2 high-impact verbatim phrases from candidate answer.
    Prioritizes technical terms, verb phrases, and specific details.
    
    Args:
        answer: Candidate's answer text
        max_phrases: Maximum number of phrases to extract (default 2)
        max_words_per_phrase: Maximum words per phrase (default 10)
    
    Returns:
        List of extracted phrases (verbatim quotes)
    """
    if not answer or len(answer.strip()) < 10:
        return []
    
    # Split into sentences
    sentences = re.split(r'[.!?]+', answer)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 5]
    
    if not sentences:
        return []
    
    phrases = []
    
    # Priority 1: Look for technical terms/patterns (code-like, technical keywords)
    # FIXED: Changed patterns to stop at commas to prevent truncation
    technical_patterns = [
        r'\b(?:debounce|throttle|memoize|optimize|refactor|implement|reduce|cache|async|await)\b[^.!?,;]{0,60}',
        r'\b(?:useState|useEffect|React|API|database|query|component)\b[^.!?,;]{0,60}',
        r'\b(?:performance|scalability|latency|TTL|timeout|response time)\b[^.!?,;]{0,60}',
        r'\b(?:reduced|increased|improved|handled|managed|designed)\s+\w+\s+\w+',
    ]
    
    for pattern in technical_patterns:
        matches = re.findall(pattern, answer, re.IGNORECASE)
        for match in matches[:2]:
            # Limit to max_words_per_phrase
            words = match.split()
            if len(words) > max_words_per_phrase:
                match = ' '.join(words[:max_words_per_phrase])
            
            # FIXED: Apply same aggressive cleaning as Priority 2
            match = re.sub(r'\s+(?:and|or|with|using|for|to|the|a|an|where|which|that|by|from)$', '', match, flags=re.IGNORECASE)
            match = re.sub(r'[,\s]+\w{1,2}$', '', match)  # Remove trailing fragments like ", h"
            match = match.strip(':,;. ')
            
            if match and len(match) > 5:
                phrases.append(match.strip())
                if len(phrases) >= max_phrases:
                    return phrases
    
    # Priority 2: Extract verb phrases (action-oriented)
    # Look for patterns like "I [verb] [object]" - capture complete meaningful phrases
    # FIXED: Increased range from {3,100} to {3,150} to capture longer complete phrases
    # CRITICAL FIX: Changed pattern from [^.!?,;] to [^.!?;,] to properly break at commas
    verb_pattern = r'\b(?:I|We|They)\s+(?:used|implemented|built|created|designed|handled|optimized|reduced|increased|managed|developed|worked|applied)\s+[^.!?;,]{3,150}'
    verb_matches = re.findall(verb_pattern, answer, re.IGNORECASE)
    
    for match in verb_matches[:3]:  # Get top 3 candidates
        # Clean up the match
        match = match.strip()
        words = match.split()
        
        # Find a natural breaking point within the word limit
        if len(words) > max_words_per_phrase:
            # FIXED: Expanded break words list to include more natural boundaries
            break_words = ['and', 'or', 'with', 'using', 'for', 'to', 'where', 'which', 'that', 'in', 'on', 'at', 'by', 'from', 'without', 'while', 'when', 'if', 'but']
            best_break = max_words_per_phrase
            
            # Look for a natural break point before the limit
            # FIXED: Scan wider range to find better breaking points
            for i in range(min(max_words_per_phrase, len(words) - 1), max(5, max_words_per_phrase - 7), -1):
                if i < len(words) and words[i].lower() in break_words:
                    best_break = i
                    break
            
            match = ' '.join(words[:best_break])
        
        # FIXED: More aggressive cleaning to ensure complete words
        # Remove trailing incomplete words and fragments
        match = re.sub(r'\s+(?:and|or|with|using|for|to|the|a|an|where|which|that|by|from)$', '', match, flags=re.IGNORECASE)
        # Remove trailing single letters or incomplete words (like "h" from "data flows, h")
        match = re.sub(r',?\s+\w{1,2}$', '', match)
        match = match.strip(':,;. ')
        
        if match and match not in phrases and len(match) > 10:
            phrases.append(match.strip())
            if len(phrases) >= max_phrases:
                return phrases
    
    # Priority 3: Extract specific numbers/metrics (data-driven evidence)
    metric_pattern = r'\b(?:\d+(?:\.\d+)?(?:%|ms|MB|GB|seconds?|minutes?|x|times?)?)\s+[\w\s]{0,30}'
    metric_matches = re.findall(metric_pattern, answer)
    
    for match in metric_matches[:1]:
        words = match.split()
        if len(words) > max_words_per_phrase:
            match = ' '.join(words[:max_words_per_phrase])
        if match not in phrases and len(match) > 3:
            phrases.append(match.strip())
            if len(phrases) >= max_phrases:
                return phrases
    
    # Priority 4: Fallback - extract key noun phrases from first 2 sentences
    if not phrases and len(sentences) > 0:
        # Take first substantial sentence
        first_sentence = sentences[0]
        words = first_sentence.split()
        if len(words) >= 4:
            # Extract middle chunk (skip "I think" etc.)
            start_idx = 0
            if words[0].lower() in ['i', 'we', 'so', 'well', 'like', 'you', 'actually']:
                start_idx = 1
            
            chunk = ' '.join(words[start_idx:min(start_idx + max_words_per_phrase, len(words))])
            phrases.append(chunk.strip())
    
    logger.info(f"Extracted {len(phrases)} evidence phrase(s): {phrases[:max_phrases]}")
    return phrases[:max_phrases]


def inject_evidence_into_critique(
    critique_field: str,
    candidate_phrases: List[str],
    fallback_text: str = ""
) -> str:
    """
    Inject candidate evidence phrases into critique text.
    
    Args:
        critique_field: Original critique text
        candidate_phrases: List of verbatim phrases from candidate
        fallback_text: Fallback if no phrases available
    
    Returns:
        Enhanced critique with evidence quotes
    """
    if not candidate_phrases:
        return critique_field or fallback_text
    
    # If critique already has quotes, don't modify
    if '"' in critique_field and any(phrase[:15] in critique_field for phrase in candidate_phrases):
        return critique_field
    
    # Pattern 1: "You mentioned X..." or "You explained X..."
    # Pattern 2: "You said 'X' but..."
    # Pattern 3: "While you described X, you didn't..."
    
    if len(candidate_phrases) >= 1:
        phrase = candidate_phrases[0]
        # Check if critique needs evidence injection
        if "you" in critique_field.lower()[:30]:
            # Already starts with "You", inject quote
            enhanced = critique_field.replace(
                critique_field.split('.')[0],
                f'You mentioned "{phrase}"'
            )
            return enhanced
        else:
            # Prepend evidence
            return f'You said "{phrase}". {critique_field}'
    
    return critique_field


def validate_critique_has_evidence(
    critique: Dict,
    candidate_answer: str,
    score: int,
    session_id: str = "unknown"
) -> Tuple[bool, str]:
    """
    Validate that high-scoring critiques contain verbatim evidence.
    
    Args:
        critique: Critique dictionary with correct_answer, strengths_and_weakness
        candidate_answer: Original candidate answer
        score: Assigned score
        session_id: Session ID for logging
    
    Returns:
        Tuple of (has_evidence: bool, warning_message: str)
    """
    # Only enforce for scores >= 4
    if score < 4:
        return True, ""
    
    critique_text = f"{critique.get('correct_answer', '')} {critique.get('strengths_and_weakness', '')}"
    
    # Check if critique contains quoted phrases
    has_quotes = '"' in critique_text or "'" in critique_text
    
    if has_quotes:
        # Extract quoted text
        quoted_fragments = re.findall(r'["\']([^"\']{5,})["\']', critique_text)
        
        if quoted_fragments:
            # Check if at least one quote appears in candidate answer
            for fragment in quoted_fragments:
                # Normalize for comparison
                if fragment.lower() in candidate_answer.lower():
                    logger.info(f"[{session_id}] ✅ Evidence found: \"{fragment[:40]}...\"")
                    return True, ""
        
        # Has quotes but they don't match answer - suspicious
        logger.warning(f"[{session_id}] ⚠️ Critique has quotes but they don't match answer")
        return False, "Critique contains quotes not found in candidate answer"
    
    # No quotes found for high score
    logger.warning(
        f"[{session_id}] ⚠️ Missing evidence: Score {score} critique lacks quoted candidate phrases"
    )
    return False, f"Score {score} requires verbatim evidence from candidate answer"
