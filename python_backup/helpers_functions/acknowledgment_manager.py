"""
Acknowledgment phrase manager to prevent repetition within interview sessions.
Tracks used phrases and provides fresh alternatives based on role, score, and persona.
"""
import logging
import random
from typing import List, Set, Optional

logger = logging.getLogger(__name__)

# Persona-based phrase filtering
# Define phrases that should be excluded for each persona
PERSONA_EXCLUSIONS = {
    0: {  # Professional - exclude casual/slang phrases
        "forbidden_patterns": ["Cool", "Nice", "Love", "Wow", "Killer", "Crushing", "Alright", "Fair enough"],
    },
    1: {  # Friendly - exclude harsh/blunt phrases
        "forbidden_patterns": ["That's vague", "I'm not convinced", "Incomplete", "That doesn't answer"],
    },
    2: {  # Strict - exclude praise and softening
        "forbidden_patterns": ["Good", "Strong", "Solid", "Impressive", "Great", "Excellent", "Nice", "I appreciate", 
                             "That's helpful", "thank", "Thank"],
    },
    3: {  # Casual - exclude formal language
        "forbidden_patterns": ["Understood", "Noted", "I understand"],
    },
}

# Acknowledgment pools by role and score range
# Expanded to 30+ variants per category to prevent repetition
# Types: brief (1-3 words), curiosity, challenge, neutral

TECHNICAL_ACKS = {
    "high": [  # Score 4-5 (strong answers)
        # Brief confirms (1-3 words)
        "Got it.",
        "Makes sense.",
        "Alright.",
        "I see.",
        "Fair enough.",
        "Understood.",
        "Okay.",
        "Right.",
        "Clear.",
        "Noted.",
        "Good.",
        "Solid.",
        # Curiosity variants
        "Interesting — why that approach?",
        "That's solid. Let me dig deeper.",
        "Good thinking. But what about...",
        "I like that. What's the trade-off though?",
        "Strong answer. Here's a challenge:",
        "You're on the right track. Let me test that:",
        # Challenge variants
        "I'm not fully convinced — explain further.",
        "That works, but what's the downside?",
        "Reasonable, but have you considered...",
        "That's one way. Why not approach Y instead?",
        # Neutral transitions
        "I follow.",
        "That makes sense.",
        "Fair point.",
        "You've thought this through.",
        "That's a valid approach.",
        "I appreciate the detail there.",
        "That shows good understanding.",
        "You clearly know this area.",
        # Hinglish variants (New)
        "Sahi hai.",
        "Bilkul.",
        "Theek hai.",
        "Sahi logic hai.",
        "Great point.",
        "Point hai.",
        "Got it, clear hai.",
    ],
    "mid": [  # Score 3 (satisfactory but incomplete)
        # Brief confirms
        "Okay.",
        "I see.",
        "Alright.",
        "Fair enough.",
        "Understood.",
        "Noted.",
        "Got it.",
        "Right.",
        # Curiosity (probing for depth)
        "Can you elaborate on that?",
        "What do you mean specifically?",
        "Give me a concrete example.",
        "How would you explain that to a junior dev?",
        "Walk me through your reasoning.",
        "What led you to that conclusion?",
        "I'm not seeing the full picture — expand.",
        # Challenge (gentle pressure)
        "That's surface-level — go deeper.",
        "I need more specifics here.",
        "You're missing something — what is it?",
        "That's vague. Can you be more precise?",
        "You mentioned X, but didn't address Y.",
        # Neutral
        "I follow you.",
        "That's one approach.",
        "I understand the idea.",
        "That's a start.",
        "I see what you're getting at.",
        "Partially there.",
        "That's reasonable to some extent.",
        # Hinglish variants
        "Theek hai, samjh gaya.",
        "Acha, aur kya?",
        "Sahi hai, but expand karo.",
        "Point hai, but incomplete hai.",
    ],
    "low": [  # Score 1-2 (weak/wrong answers)
        # Brief (supportive, not critical)
        "Okay.",
        "Alright.",
        "I see.",
        "No worries.",
        "That's fine.",
        "All good.",
        "Fair.",
        # Redirecting (move on, don't dwell)
        "Let's try a different angle.",
        "Let me rephrase that.",
        "Let's approach this differently.",
        "We'll come back to that.",
        "Let me ask this instead:",
        "Different question:",
        "Let's shift gears.",
        # Gentle challenge (not harsh)
        "I'm not convinced yet. Try again.",
        "That's not quite it. What else?",
        "Close, but missing the key point.",
        "You're on the wrong track here.",
        "That doesn't add up. Rethink it.",
        # Supportive
        "Don't stress.",
        "That's alright.",
        "Not to worry.",
        "It happens.",
        "That's a tough one.",
        "This trips up a lot of people.",
        "Let's work through this.",
        # Hinglish variants
        "Koi baat nahi.",
        "Chalo, doosra try karte hain.",
        "Theek hai, no worries.",
        "Koi dikat nahi.",
    ],
}

HR_ACKS = {
    "high": [
        "I see.",
        "Noted.",
        "Alright.",
        "Understood.",
        "Good example.",
        "That's clear.",
        "Helpful context.",
        "I see what you mean.",
        "That makes sense.",
        "Fair point.",
        "I follow.",
        "Got it.",
        "Okay.",
        "I hear you.",
        "Right.",
        "That's insightful.",
        "Strong self-awareness there.",
        "I appreciate the honesty.",
        "That shows reflection.",
        "Tell me more about that.",
        "What made you realize that?",
        "How did that change you?",
        "Interesting perspective.",
        "That's authentic.",
        "I value that transparency.",
    ],
    "mid": [
        "I see.",
        "That makes sense.",
        "Understood.",
        "Fair enough.",
        "Got it.",
        "I follow.",
        "That's clear.",
        "Noted.",
        "I understand.",
        "That's helpful.",
        "I hear you.",
        "Okay.",
        "Reasonable.",
        "That's fair.",
        "Can you elaborate?",
        "Give me an example.",
        "What specifically happened?",
        "Walk me through that.",
        "I need more detail.",
        "What was the outcome?",
    ],
    "low": [
        "I see.",
        "Noted.",
        "That's a start.",
        "Alright.",
        "Let's explore that more.",
        "No wrong answers here.",
        "Understood.",
        "Let's think about that.",
        "I understand.",
        "That's okay.",
        "No worries.",
        "Let's dig deeper.",
        "Fair enough.",
        "Got it.",
        "Okay.",
        "Let's try another angle.",
        "Different question:",
        "Let me rephrase.",
    ]
}

MARKETING_ACKS = {
    "high": [
        "I see.",
        "Noted.",
        "Strong campaign.",
        "Good metrics.",
        "Understood.",
        "Solid performance.",
        "Strong numbers.",
        "Got it.",
        "Alright.",
        "Fair enough.",
        "That works.",
        "I follow.",
        "Makes sense.",
        "Clear.",
        "Impressive ROI.",
        "Data-driven approach.",
        "What was the attribution model?",
        "How did you validate that?",
        "What about the control group?",
        "Strong creative execution.",
    ],
    "mid": [
        "I see.",
        "Okay.",
        "That's an approach.",
        "Interesting.",
        "Got it.",
        "Understood.",
        "Fair enough.",
        "Noted.",
        "I follow.",
        "What were the actual numbers?",
        "How did you measure that?",
        "What was the baseline?",
        "Can you quantify the impact?",
    ],
    "low": [
        "Okay.",
        "I see.",
        "Let's dig into the data.",
        "What metrics did you track?",
        "How did you know it worked?",
        "Let's try a different example.",
        "Tell me about a different campaign.",
    ]
}

SALES_ACKS = {
    "high": [
        "Strong numbers.",
        "Impressive close rate.",
        "Good quota attainment.",
        "Solid pipeline.",
        "I see.",
        "Got it.",
        "Understood.",
        "That's a big deal.",
        "Strong performance.",
        "Noted.",
        "Alright.",
        "What was your closing strategy?",
        "How did you handle objections?",
        "What was the deal cycle?",
        "Who were the stakeholders?",
    ],
    "mid": [
        "Okay.",
        "I see.",
        "Got it.",
        "What was your close rate?",
        "How many touches before close?",
        "What objections came up?",
        "Walk me through the deal.",
    ],
    "low": [
        "Alright.",
        "Let's talk about a win instead.",
        "Different question:",
        "Tell me about your best deal.",
    ]
}

# Map role strings to acknowledgment pools
ROLE_ACK_MAP = {
    "technical": TECHNICAL_ACKS,
    "hr": HR_ACKS,
    "marketing": MARKETING_ACKS,
    "sales": SALES_ACKS,
}


def get_score_category(score: int) -> str:
    """
    Map numeric score to category for acknowledgment selection.
    
    Args:
        score: Numeric score 1-5
    
    Returns:
        Category string: "high", "mid", or "low"
    """
    if score >= 4:
        return "high"
    elif score == 3:
        return "mid"
    else:
        return "low"


def select_acknowledgment(
    role: str,
    score: int,
    used_phrases: List[str],
    session_id: str = "unknown",
    followup_intensity: str = None,
    persona_id: int = 0
) -> str:
    """
    Select a fresh acknowledgment phrase not used in this session.
    Uses dynamic probability to skip acknowledgments based on followup intensity.
    Filters phrases based on persona (language style only - no score/difficulty impact).
    
    Args:
        role: Interview role ("technical", "hr", "marketing", "sales")
        score: Numeric score 1-5
        used_phrases: List of phrases already used in this session
        session_id: Session ID for logging
        followup_intensity: Intensity level ("CLARIFY", "CHALLENGE", "STRONG") to control probability
        persona_id: Persona ID (0=Professional, 1=Friendly, 2=Strict, 3=Casual)
    
    Returns:
        Fresh acknowledgment phrase or empty string if skipped
    """
    # Dynamic probability - skip acknowledgment based on intensity
    skip_probabilities = {
        "CLARIFY": 0.60,  # 60% chance to skip (use 40% of time)
        "CHALLENGE": 0.80,  # 80% chance to skip (use 20% of time)
        "STRONG": 0.50,  # 50% chance to skip (use 50% of time)
    }
    
    skip_chance = skip_probabilities.get(followup_intensity, 0.35)  # Default 35% skip (65% use)
    
    if random.random() < skip_chance:
        logger.info(
            f"[{session_id}] Skipping acknowledgment (intensity={followup_intensity}, "
            f"skip_chance={skip_chance:.0%})"
        )
        return ""  # No acknowledgment - jump straight to question
    
    # Get appropriate pool for role and score
    role_pools = ROLE_ACK_MAP.get(role, TECHNICAL_ACKS)
    category = get_score_category(score)
    phrase_pool = role_pools.get(category, role_pools["mid"])
    
    # PERSONA FILTERING: Remove forbidden phrases based on persona
    forbidden_patterns = PERSONA_EXCLUSIONS.get(persona_id, {}).get("forbidden_patterns", [])
    if forbidden_patterns:
        # Filter out phrases containing forbidden patterns
        filtered_pool = [
            phrase for phrase in phrase_pool
            if not any(pattern in phrase for pattern in forbidden_patterns)
        ]
        
        # If filtering removed all phrases, fall back to original pool with warning
        if filtered_pool:
            phrase_pool = filtered_pool
            logger.info(
                f"[{session_id}] Persona {persona_id} filtering: "
                f"{len(phrase_pool)} phrases allowed (excluded {len(phrase_pool) - len(filtered_pool)} forbidden)"
            )
        else:
            logger.warning(
                f"[{session_id}] Persona {persona_id} filtering removed all phrases, using unfiltered pool"
            )
    
    # Convert used_phrases to set for faster lookup
    used_set = set(used_phrases) if used_phrases else set()
    
    # Find unused phrases
    unused_phrases = [p for p in phrase_pool if p not in used_set]
    
    # If all phrases used, reset and use any phrase (with warning)
    if not unused_phrases:
        logger.warning(
            f"[{session_id}] ⚠️  All {len(phrase_pool)} acknowledgments exhausted for "
            f"{role}/{category}. Resetting pool."
        )
        unused_phrases = phrase_pool
    
    # Select random phrase from unused
    selected = random.choice(unused_phrases)
    
    logger.info(
        f"[{session_id}] Selected acknowledgment: '{selected}' "
        f"({len(unused_phrases)} unused / {len(phrase_pool)} total in {role}/{category} pool)"
    )
    
    return selected


def update_used_acknowledgments(
    state_used_acks: Optional[List[str]],
    new_phrase: str
) -> List[str]:
    """
    Update the list of used acknowledgments with the newly used phrase.
    
    Args:
        state_used_acks: Current list of used phrases from state (or None)
        new_phrase: Newly used phrase to add
    
    Returns:
        Updated list of used phrases
    """
    if state_used_acks is None:
        state_used_acks = []
    
    updated = state_used_acks.copy()
    updated.append(new_phrase)
    
    return updated


# ===== FOLLOW-UP QUESTION TEMPLATES =====
# Expanded to 50+ variants to prevent repetition and robotic patterns

FOLLOWUP_TEMPLATES = [
    # Direct - No fluff (10%)
    "{question}",
    
    # Reference-based - Connect to what they said (15%)
    "You mentioned that earlier — {question}",
    "Earlier you said something interesting — {question}",
    "When you talked about that, {question}",
    "Can you elaborate on that point — {question}",
    "Regarding what you mentioned, {question}",
    "Building on what you just said, {question}",
    "That's relevant here — {question}",
    "Going back to what you described, {question}",
    
    # Probing - Dig deeper (15%)
    "What specifically made you approach it that way — {question}",
    "Can you walk me through {question}",
    "Help me understand: {question}",
    "Let's explore that: {question}",
    "Tell me more about {question}",
    "Break that down for me — {question}",
    "What's the reasoning behind {question}",
    "Dive deeper into {question}",
    
    # Hypothetical - Test thinking (10%)
    "How would you approach {question}",
    "If you had to do this again, {question}",
    "In a different scenario, {question}",
    "Imagine if {question}",
    "Suppose {question}",
    "What if {question}",
    
    # Reflective - Learn from experience (10%)
    "Looking back, {question}",
    "In hindsight, {question}",
    "What would you change about {question}",
    "What did you learn from {question}",
    "How did that experience shape {question}",
    "Thinking back on it, {question}",
    
    # Contrasting - Different perspective (8%)
    "What about the opposite — {question}",
    "On the other hand, {question}",
    "Compare that to {question}",
    "How does that contrast with {question}",
    "From a different angle, {question}",
    
    # STAR deep dive - Behavioral detail (8%)
    "Walk me through the Action step — {question}",
    "What was the Result specifically — {question}",
    "Describe the Situation in more detail — {question}",
    "Tell me about the Task you faced — {question}",
    
    # Clarifying - Get specifics (10%)
    "To clarify, {question}",
    "Just to be clear, {question}",
    "Can you be more specific about {question}",
    "Define what you mean by {question}",
    "What exactly do you mean when you say {question}",
    
    # Challenge framing - Gentle pushback (8%)
    "I'm curious about one thing — {question}",
    "That raises a question for me — {question}",
    "I want to understand better — {question}",
    "Something doesn't quite add up — {question}",
    
    # Practical grounding - Real-world application (6%)
    "In practice, {question}",
    "How does that work day-to-day — {question}",
    "What does that look like operationally — {question}",
    
    # Follow the thread - Logical progression (5%)
    "That makes me wonder — {question}",
    "Following that logic, {question}",
    "So then {question}",
    
    # Abbreviated/casual - More human (5%)
    "And {question}",
    "So {question}",
    "But {question}",
]


def get_followup_template(used_templates: Optional[List[str]] = None) -> str:
    """
    Get a varied follow-up question template.
    Prevents consecutive reuse by tracking last 10 templates.
    
    Args:
        used_templates: List of recently used templates (last 10)
    
    Returns:
        Template string with {question} placeholder
    """
    # Only track last 10 templates to avoid exhausting the pool
    recent_used = used_templates[-10:] if used_templates and len(used_templates) > 0 else []
    used_set = set(recent_used)
    
    # Find unused templates from the full pool
    unused = [t for t in FOLLOWUP_TEMPLATES if t not in used_set]
    
    # If somehow all 50+ templates were used in last 10 turns (impossible), reset
    if not unused:
        logger.warning("All follow-up templates exhausted in last 10 uses - resetting pool")
        unused = FOLLOWUP_TEMPLATES
    
    selected = random.choice(unused)
    
    # Log variety stats
    logger.info(
        f"Selected follow-up template ({len(unused)} unused / {len(FOLLOWUP_TEMPLATES)} total): "
        f"{selected[:40]}..."
    )
    
    return selected

