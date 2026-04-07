"""
Context manager for maintaining rolling conversation context.
Helps next questions build on recent candidate answers.
"""
import logging

logger = logging.getLogger(__name__)


def update_recent_context(
    current_summary: str,
    latest_answer: str,
    critique_feedback: str,
    max_length: int = 300
) -> str:
    """
    Maintain rolling summary of last 1-2 answers for context awareness.
    
    This summary is included in prompts to help the LLM generate follow-ups
    that reference specific details from the candidate's recent answers.
    
    Args:
        current_summary: Existing context summary from state
        latest_answer: Candidate's most recent answer
        critique_feedback: Feedback from critique (strengths_and_weakness)
        max_length: Maximum length of summary to maintain
    
    Returns:
        Updated context summary
    """
    if not latest_answer:
        return current_summary
    
    # Truncate answer and feedback for conciseness
    answer_snippet = latest_answer[:100].strip()
    if len(latest_answer) > 100:
        answer_snippet += "..."
    
    feedback_snippet = critique_feedback[:50].strip() if critique_feedback else ""
    
    # Create new entry
    new_entry = f"Answered: {answer_snippet}"
    if feedback_snippet:
        new_entry += f" [Feedback: {feedback_snippet}]"
    
    # Append to current summary
    if current_summary:
        updated = f"{current_summary} | {new_entry}"
    else:
        updated = new_entry
    
    # Keep only most recent context (trim from beginning if too long)
    if len(updated) > max_length:
        # Find the last separator and keep everything after it
        parts = updated.split(" | ")
        while len(" | ".join(parts)) > max_length and len(parts) > 1:
            parts.pop(0)
        updated = " | ".join(parts)
    
    return updated


def get_context_instruction(recent_summary: str, current_section: str) -> str:
    """
    Generate instruction text for prompts to use recent context.
    
    Args:
        recent_summary: Rolling summary of recent answers
        current_section: Current interview section
    
    Returns:
        Instruction string for prompt
    """
    if not recent_summary or len(recent_summary.strip()) == 0:
        return ""
    
    return f"""
**RECENT CONVERSATION CONTEXT**:
{recent_summary}

When staying in the "{current_section}" section, build on these details in your follow-up.
Reference specific things they mentioned (tools, projects, challenges, etc.).
"""
