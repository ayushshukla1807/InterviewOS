"""
Adaptive difficulty management system.
Adjusts question difficulty based on candidate performance (scores).
"""
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

# Difficulty levels
DIFFICULTY_EASY = 1
DIFFICULTY_MEDIUM = 2
DIFFICULTY_HARD = 3

# Difficulty labels for prompts
DIFFICULTY_LABELS = {
    1: "easy/basic/conceptual",
    2: "medium/implementation",
    3: "hard/design/complexity"
}


def adjust_difficulty(
    current_difficulty: int,
    score: int,
    session_id: str = "unknown",
    consecutive_high_scores: int = 0
) -> Tuple[int, bool]:
    """
    Adjust difficulty level based on the candidate's score on previous question.
    
    ENHANCED RULES (faster progression):
    - Score 1-2: Decrease difficulty (but not below 1)
    - Score 3: Keep same difficulty
    - Score 4-5 (single): Increase by 1
    - Score 4-5 (consecutive 2+): Jump to max (level 3) immediately
    
    This ensures strong candidates reach hardest questions faster.
    
    Args:
        current_difficulty: Current difficulty level (1-3)
        score: Score on previous question (1-5)
        session_id: Session ID for logging
        consecutive_high_scores: Number of consecutive 4-5 scores
    
    Returns:
        Tuple of (new_difficulty, was_changed)
    """
    original_difficulty = current_difficulty
    new_difficulty = current_difficulty
    
    if score <= 2:
        # Candidate struggling, make it easier
        new_difficulty = max(DIFFICULTY_EASY, current_difficulty - 1)
    elif score >= 4:
        # Candidate doing well - accelerate difficulty increase
        if consecutive_high_scores >= 2:
            # Jump to max difficulty after 2 consecutive high scores
            new_difficulty = DIFFICULTY_HARD
            logger.info(
                f"[{session_id}] ⚡ FAST TRACK: Jumping to max difficulty "
                f"(consecutive high scores: {consecutive_high_scores})"
            )
        else:
            # Standard increase
            new_difficulty = min(DIFFICULTY_HARD, current_difficulty + 1)
    # score == 3: maintain current difficulty
    
    was_changed = (new_difficulty != original_difficulty)
    
    if was_changed:
        direction = "⬇️ EASIER" if new_difficulty < original_difficulty else "⬆️ HARDER"
        logger.info(
            f"[{session_id}] {direction} Difficulty: {original_difficulty}→{new_difficulty} "
            f"(score={score})"
        )
    else:
        logger.info(
            f"[{session_id}] Difficulty maintained: {current_difficulty} (score={score})"
        )
    
    return new_difficulty, was_changed


def get_difficulty_instruction(difficulty: int) -> str:
    """
    Get instruction text for prompts based on difficulty level.
    
    Args:
        difficulty: Difficulty level (1-3)
    
    Returns:
        Instruction string for prompt
    """
    if difficulty == DIFFICULTY_EASY:
        return """
**DIFFICULTY: EASY/BASIC**
Ask conceptual or definitional questions. Focus on fundamental understanding.
Examples: "What is X?", "Explain the concept of Y", "Define Z"
Avoid complex implementation details or edge cases.
"""
    elif difficulty == DIFFICULTY_HARD:
        return """
**DIFFICULTY: HARD/ADVANCED**
Ask design, complexity, or trade-off questions. Probe deep understanding.
Examples: "Design a system for X", "What are the time/space tradeoffs?", "How would you optimize Y?"
Expect discussion of alternatives, edge cases, and complexity analysis.
"""
    else:  # DIFFICULTY_MEDIUM
        return """
**DIFFICULTY: MEDIUM/IMPLEMENTATION**
Ask practical implementation or application questions.
Examples: "How would you implement X?", "Show me an example of Y", "Walk me through Z"
Focus on practical usage and real-world scenarios.
"""


def get_difficulty_label(difficulty: int) -> str:
    """
    Get human-readable label for difficulty level.
    
    Args:
        difficulty: Difficulty level (1-3)
    
    Returns:
        Label string
    """
    return DIFFICULTY_LABELS.get(difficulty, "medium")


def should_skip_section(
    section_priority: int,
    difficulty: int,
    questions_asked: int
) -> bool:
    """
    Determine if a section should be skipped based on difficulty and priorities.
    
    Lower priority sections can be skipped if:
    - Candidate is doing very well (difficulty=3) and section priority < 3
    - Interview is running long (questions_asked > 15) and priority < 4
    
    Args:
        section_priority: Priority of section (1-5, higher = more important)
        difficulty: Current difficulty level (1-3)
        questions_asked: Total questions asked so far
    
    Returns:
        True if section should be skipped
    """
    # Never skip high-priority sections (4-5)
    if section_priority >= 4:
        return False
    
    # Skip low-priority sections (1-2) if interview is long
    if section_priority <= 2 and questions_asked > 15:
        return True
    
    # Skip medium-priority sections (3) if candidate is advanced and interview is long
    if section_priority == 3 and difficulty == DIFFICULTY_HARD and questions_asked > 12:
        return True
    
    return False


def get_section_question_count(
    section_priority: int,
    difficulty: int
) -> int:
    """
    Determine how many questions to ask from a section based on priority and difficulty.
    
    Args:
        section_priority: Priority of section (1-5)
        difficulty: Current difficulty level (1-3)
    
    Returns:
        Number of questions to ask from this section
    """
    # Base count by priority
    base_counts = {
        5: 5,  # Critical sections (DSA, OOPs, DBMS, Projects)
        4: 3,  # Important sections (OS, Networks, SQL)
        3: 2,  # Medium sections (Experience)
        2: 1,  # Low sections (Achievements, Certs)
        1: 1,  # Minimal sections (Education, Hobbies)
    }
    
    base = base_counts.get(section_priority, 2)
    
    # Adjust based on difficulty
    if difficulty == DIFFICULTY_EASY:
        # Struggling candidates get fewer questions per section
        return max(1, base - 1)
    elif difficulty == DIFFICULTY_HARD:
        # Advanced candidates get more depth
        return min(7, base + 1)
    
    return base
