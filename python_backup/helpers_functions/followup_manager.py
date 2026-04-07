"""
Follow-up question management based on score and contradiction detection.
Adjusts probing intensity and identifies inconsistencies across answers.
"""
import logging
import re
import random
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

# ===== CHALLENGE TEMPLATES =====
# Templates for contradictions and scenario flips

CONTRADICTION_TEMPLATES = {
    "stress": [
        "Earlier you said you handle stress well, but now you mentioned feeling overwhelmed. Can you reconcile that?",
        "You described managing pressure effectively before — how does that fit with what you just said about struggling?",
        "I'm seeing some inconsistency here. Earlier you thrived under pressure, but now you're describing stress differently. Which is accurate?"
    ],
    "teamwork": [
        "You mentioned being a team player earlier, but now you're saying you prefer working alone. Help me understand.",
        "Earlier you emphasized collaboration, but this answer suggests you work better solo. What's your actual preference?",
        "I'm confused — you described yourself as collaborative before, but now independent. Which represents you better?"
    ],
    "leadership": [
        "You said you led teams earlier, but now you're saying you haven't had leadership experience. Can you clarify?",
        "There's a disconnect — earlier you described leading projects, but this suggests you avoid leadership. Which is it?",
        "Help me reconcile this: you mentioned leadership experience before, but now you're describing a support role."
    ],
    "technology": [
        "Earlier you said you're experienced with X, but this answer suggests you're not familiar. What's your actual level?",
        "You described using X extensively before, but now you're saying you haven't worked with it much. Clarify?",
        "I'm seeing inconsistency — you mentioned expertise with X earlier, but this answer contradicts that."
    ]
}

SCENARIO_FLIP_TEMPLATES = {
    "technical": [
        "Now assume traffic is 10x higher — what changes in your approach?",
        "What if you had to implement this with zero third-party libraries — how would you adapt?",
        "Assume the API response time suddenly jumps to 5 seconds — how do you handle it?",
        "What if this needs to work offline? Walk me through the changes.",
        "Now imagine the dataset is 100x larger — what breaks and how do you fix it?",
        "What if you had only 24 hours to ship this to production — what would you prioritize?",
        "Assume you can't use caching — how would your solution change?",
        "What if this needs to support IE11 browsers — what compatibility issues arise?"
    ],
    "hr": [
        "What if your manager strongly disagreed with your approach — how would you handle it?",
        "Imagine the deadline moved up by 2 weeks — how would that change your prioritization?",
        "What if you had to deliver this feedback to someone very senior? Would your approach differ?",
        "Assume the team doubled in size overnight — how would you adapt your communication?",
        "What if you were working remotely with a 12-hour time zone difference — what changes?",
        "Imagine this conflict escalated to HR — at what point would you involve them?"
    ],
    "marketing": [
        "What if your budget was cut in half — what would you prioritize?",
        "Assume the campaign performed 50% worse than expected — how would you pivot?",
        "What if your competitor launched the exact same campaign first — what do you do?",
        "Imagine you had 10x the budget — would you scale this or try something different?",
        "What if the target audience shifted to enterprise instead of SMB — how does the strategy change?",
        "Assume this needs to work in a market with very different cultural norms — what adjusts?"
    ],
    "sales": [
        "What if the prospect says 'We're happy with our current solution' — how do you respond?",
        "Assume the decision-maker changes mid-cycle — how do you reset the relationship?",
        "What if they ask for a 50% discount to close — do you do it?",
        "Imagine the competitor undercuts you by 30% on price — how do you compete?",
        "What if the buying committee grows from 2 to 8 people — how does your approach change?",
        "Assume the budget gets frozen mid-deal — how do you keep it alive?"
    ]
}

PRODUCTION_REALITY_TEMPLATES = {
    "technical": [
        "Tell me about a time this exact approach failed in production. What happened?",
        "Have you ever had to debug this kind of issue at 3 AM? Walk me through it.",
        "What's the worst production incident you caused with this pattern? What did you learn?",
        "When was the last time you had to roll back a change like this? What went wrong?"
    ],
    "hr": [
        "Describe a time this exact strategy backfired. What was the fallout?",
        "Have you ever misjudged a situation like this? What happened?",
        "Tell me about a conflict where your approach made things worse, not better.",
        "When did your communication style fail to land? How did you recover?"
    ],
    "marketing": [
        "Tell me about a campaign that flopped despite using this strategy. What went wrong?",
        "When did your attribution model lie to you? How did you discover it?",
        "Describe a time you invested heavily in a channel that didn't deliver. What happened?",
        "What's the worst ROI you've seen from a campaign you were confident about?"
    ],
    "sales": [
        "Tell me about your biggest deal that fell apart at the last minute. Why did it happen?",
        "When did you misread a prospect and waste weeks on a dead deal?",
        "Describe a time you lost to a competitor you thought you had beat. What happened?",
        "What's the most embarrassing mistake you made in front of a prospect?"
    ]
}


def get_followup_instruction(score: int, session_id: str = "unknown") -> str:
    """
    Generate follow-up instruction based on the previous answer's score.
    Vary probing intensity to simulate realistic interviewer behavior.
    
    Args:
        score: Score from previous answer (1-5)
        session_id: Session ID for logging
        
    Returns:
        Instruction string for the prompt
    """
    if score <= 2:
        # Low score - high-pressure probing
        instruction = """
### FOLLOW-UP INTENSITY: HIGH-PRESSURE PROBING (Weak Answer)
The candidate's previous answer was weak. Probe aggressively:
- Ask for **specific examples** they clearly lack
- Challenge vague statements: "What specifically do you mean by..."
- Test knowledge: "Can you explain the technical details of..."
- Reveal gaps: "How would you handle edge case X?"
- Don't move on easily - dig until you get substance
"""
        logger.info(f"[{session_id}] Follow-up intensity: HIGH-PRESSURE (score {score})")
        
    elif score == 3:
        # Medium score - clarifying questions
        instruction = """
### FOLLOW-UP INTENSITY: CLARIFYING (Satisfactory Answer)
The candidate gave a decent but incomplete answer. Clarify and probe depth:
- Ask for **more context**: "Can you elaborate on..."
- Seek specific details: "What were the actual numbers/results?"
- Test understanding: "How did you decide between X and Y?"
- Look for depth: "What challenges did you face?"
"""
        logger.info(f"[{session_id}] Follow-up intensity: CLARIFYING (score {score})")
        
    else:  # score >= 4
        # High score - challenge assumptions and test depth
        instruction = """
### FOLLOW-UP INTENSITY: CHALLENGE DEPTH (Strong Answer)
The candidate gave a strong answer. Don't let them coast - challenge assumptions:
- Test edge cases: "What if constraint X changed?"
- Challenge trade-offs: "Why not approach Y instead?"
- Probe alternatives: "How would you compare this to..."
- Find limits: "Where would this approach break down?"
- Ask hypothetical extensions: "How would you scale this to..."
"""
        logger.info(f"[{session_id}] Follow-up intensity: CHALLENGE DEPTH (score {score})")
    
    return instruction


def should_inject_challenge(
    consecutive_safe_questions: int,
    last_challenge_question_num: int,
    current_question_num: int,
    last_score: int = 3,
    session_id: str = "unknown"
) -> bool:
    """
    Determine if we should force inject a challenge question.
    Prevents interviewer from being too "safe" with easy follow-ups.
    
    Args:
        consecutive_safe_questions: Number of safe/easy questions in a row
        last_challenge_question_num: Question number of last challenge
        current_question_num: Current question number in interview
        last_score: Score from previous answer (1-5)
        session_id: Session ID for logging
        
    Returns:
        True if we should inject a challenge
    """
    # DON'T inject challenges in the first 3 questions - let conversation build naturally
    if current_question_num < 3:
        logger.info(
            f"[{session_id}] Skipping challenge - too early (question {current_question_num})"
        )
        return False
    
    # CRITICAL: DON'T inject challenges after weak answers (score ≤2)
    # Candidate is already struggling - give them a chance to recover first
    if last_score <= 2:
        logger.info(
            f"[{session_id}] Skipping challenge - last answer was weak (score {last_score})"
        )
        return False
    
    # Force challenge after 3 consecutive safe questions
    if consecutive_safe_questions >= 3:
        logger.info(
            f"[{session_id}] Forcing challenge injection after {consecutive_safe_questions} safe questions"
        )
        return True
    
    # Force challenge if it's been 5+ questions since last challenge
    if last_challenge_question_num > 0 and (current_question_num - last_challenge_question_num) >= 5:
        logger.info(
            f"[{session_id}] Forcing challenge injection — {current_question_num - last_challenge_question_num} questions since last challenge"
        )
        return True
    
    # Random 20% chance to inject challenge for variety (only after warmup)
    if random.random() < 0.20:
        logger.info(f"[{session_id}] Random challenge injection (20% probability)")
        return True
    
    return False


def get_challenge_question(
    role: str,
    challenge_type: str,
    context: str = "",
    session_id: str = "unknown"
) -> str:
    """
    Get a challenge question template based on role and type.
    
    Args:
        role: Interview role ("technical", "hr", "marketing", "sales")
        challenge_type: Type of challenge ("scenario_flip", "production_reality")
        context: Optional context from previous answer
        session_id: Session ID for logging
        
    Returns:
        Challenge question string
    """
    if challenge_type == "scenario_flip":
        templates = SCENARIO_FLIP_TEMPLATES.get(role, SCENARIO_FLIP_TEMPLATES["technical"])
    elif challenge_type == "production_reality":
        templates = PRODUCTION_REALITY_TEMPLATES.get(role, PRODUCTION_REALITY_TEMPLATES["technical"])
    else:
        templates = SCENARIO_FLIP_TEMPLATES.get(role, SCENARIO_FLIP_TEMPLATES["technical"])
    
    challenge = random.choice(templates)
    logger.info(f"[{session_id}] Selected {challenge_type} challenge: {challenge[:50]}...")
    
    return challenge


def detect_contradictions(
    current_answer: str,
    history: List[Dict],
    session_id: str = "unknown"
) -> Optional[str]:
    """
    Detect contradictions between current answer and previous answers.
    Returns a contradiction prompt if found, None otherwise.
    Uses templates for varied contradiction phrasing.
    
    Args:
        current_answer: The answer just given
        history: List of previous messages ({"role": "human"/"ai", "content": "..."})
        session_id: Session ID for logging
        
    Returns:
        Contradiction prompt string or None
    """
    # Keywords indicating contradictory statements
    positive_stress = ["handle stress well", "manage pressure", "stay calm", "don't get stressed", 
                       "thrive under pressure", "work well under stress"]
    negative_stress = ["overwhelmed", "get stressed", "struggle with", "difficult to manage",
                       "hard to handle", "stressed out", "burned out"]
    
    positive_team = ["work well in teams", "team player", "collaborate", "enjoy teamwork",
                     "strong communicator", "good at collaboration"]
    negative_team = ["prefer working alone", "independent worker", "solo projects",
                     "difficult to work with", "conflict with team"]
    
    positive_leadership = ["led teams", "leadership experience", "took charge", "managed",
                          "coordinated", "organized the team"]
    negative_leadership = ["never led", "no leadership", "avoid leadership", "follower",
                          "support role", "not a leader"]
    
    positive_tech = ["experienced with", "used extensively", "expert in", "proficient", "worked with for years"]
    negative_tech = ["not familiar", "haven't used", "don't know", "limited experience", "only heard of"]
    
    # Extract previous human answers from history
    previous_answers = [msg["content"] for msg in history if msg.get("role") == "human"]
    
    current_lower = current_answer.lower()
    
    # Check each previous answer for contradictions
    for i, prev_answer in enumerate(previous_answers[-5:], 1):  # Check last 5 answers
        prev_lower = prev_answer.lower()
        
        # Stress handling contradiction
        if any(pos in prev_lower for pos in positive_stress) and any(neg in current_lower for neg in negative_stress):
            logger.warning(f"[{session_id}] Detected stress handling contradiction")
            return random.choice(CONTRADICTION_TEMPLATES["stress"])
        
        if any(neg in prev_lower for neg in negative_stress) and any(pos in current_lower for pos in positive_stress):
            logger.warning(f"[{session_id}] Detected stress handling contradiction (reversed)")
            return random.choice(CONTRADICTION_TEMPLATES["stress"])
        
        # Teamwork contradiction
        if any(pos in prev_lower for pos in positive_team) and any(neg in current_lower for neg in negative_team):
            logger.warning(f"[{session_id}] Detected teamwork contradiction")
            return random.choice(CONTRADICTION_TEMPLATES["teamwork"])
        
        # Leadership contradiction
        if any(pos in prev_lower for pos in positive_leadership) and any(neg in current_lower for neg in negative_leadership):
            logger.warning(f"[{session_id}] Detected leadership contradiction")
            return random.choice(CONTRADICTION_TEMPLATES["leadership"])
        
        # Technology contradiction
        if any(pos in prev_lower for pos in positive_tech) and any(neg in current_lower for neg in negative_tech):
            logger.warning(f"[{session_id}] Detected technology experience contradiction")
            return random.choice(CONTRADICTION_TEMPLATES["technology"])
    
    return None


def add_natural_imperfection(base_question: str, session_id: str = "unknown") -> str:
    """
    Occasionally add natural imperfections to make interviewer more realistic.
    Real interviewers sometimes ask vague questions, jump topics, or rephrase.
    
    Apply randomly (10-15% of questions) to avoid over-structuring.
    
    Args:
        base_question: The generated question
        session_id: Session ID for logging
        
    Returns:
        Question with optional natural imperfection added
    """
    import random
    
    # 85% chance of returning question as-is (keep most questions clean)
    if random.random() > 0.15:
        return base_question
    
    imperfection_type = random.choice([
        "open_ended",
        "topic_jump", 
        "rephrase"
    ])
    
    if imperfection_type == "open_ended":
        # Make question more vague/open
        prefixes = [
            "Tell me more about ",
            "Walk me through ",
            "How do you think about ",
            "What's your take on "
        ]
        # Don't modify if question is already detailed
        if len(base_question) > 100:
            return base_question
        logger.info(f"[{session_id}] Added open-ended imperfection")
        return random.choice(prefixes) + base_question.lower()
    
    elif imperfection_type == "topic_jump":
        # Add a slight topic shift
        transitions = [
            "Actually, let me ask something different — ",
            "On a different note, ",
            "Switching gears for a moment — "
        ]
        logger.info(f"[{session_id}] Added topic jump")
        return random.choice(transitions) + base_question
    
    else:  # rephrase
        # Add a clarifying rephrase
        clarifiers = [
            "In other words, ",
            "To put it another way, ",
            "Let me rephrase that — "
        ]
        logger.info(f"[{session_id}] Added rephrase")
        return random.choice(clarifiers) + base_question
    
    return base_question
