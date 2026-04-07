"""
Conversational Patterns for Natural Interview Flow
This module provides varied responses to reduce robotic repetition
Organized by role and formality level for appropriate context
"""
import random
from typing import List

# ========== ROLE DEFINITIONS ==========
ROLE_TECHNICAL = "technical"
ROLE_HR = "hr"
ROLE_MARKETING = "marketing"
ROLE_SALES = "sales"

# ========== FORMALITY LEVELS ==========
FORMALITY_CASUAL = "casual"
FORMALITY_PROFESSIONAL = "professional"
FORMALITY_FORMAL = "formal"

# ========== ACKNOWLEDGMENTS BY FORMALITY ==========

ACKNOWLEDGMENTS_CASUAL = [
    "Alright, got it.",
    "Okay, cool.",
    "Gotcha.",
    "Yeah, I understand.",
    "Okay, yeah.",
    "Sure, sure.",
]

ACKNOWLEDGMENTS_PROFESSIONAL = [
    "I see what you mean.",
    "Fair enough.",
    "That makes sense.",
    "Understood.",
    "Good to know.",
    "Noted.",
    "Makes sense.",
    "I hear you.",
]

ACKNOWLEDGMENTS_FORMAL = [
    "I understand.",
    "That's clear.",
    "Understood, thank you.",
    "I appreciate that context.",
    "That's helpful to know.",
    "Thank you for clarifying.",
]

# ========== POSITIVE ACKNOWLEDGMENTS BY QUALITY ==========

POSITIVE_STRONG = [
    "Excellent! That's exactly what I was hoping to hear.",
    "Perfect! That shows strong understanding.",
    "Impressive! You clearly know your stuff.",
    "Outstanding response.",
    "That's a really solid answer.",
]

POSITIVE_SATISFACTORY = [
    "Good answer.",
    "Nice work.",
    "That's a reasonable approach.",
    "Solid thinking there.",
    "I like that perspective.",
]

# ========== ENCOURAGING ACKNOWLEDGMENTS ==========

ENCOURAGING_NEEDS_ELABORATION = [
    "I see where you're going with that.",
    "Let's think about that differently.",
    "That's one way to look at it.",
    "Let me help clarify that.",
    "Fair enough, let's explore that more.",
]

# ========== ROLE-SPECIFIC PATTERNS ==========

# Technical Interview
TECHNICAL_ACKNOWLEDGMENTS = {
    FORMALITY_CASUAL: [
        "Nice!",
        "Cool, cool.",
        "Gotcha.",
        "Yeah, that works.",
        "Alright, makes sense.",
    ],
    FORMALITY_PROFESSIONAL: [
        "That's a solid approach.",
        "Good technical thinking.",
        "I see your reasoning.",
        "That demonstrates good understanding.",
    ],
    FORMALITY_FORMAL: [
        "That's a well-reasoned answer.",
        "Your technical understanding is clear.",
        "That demonstrates strong fundamentals.",
    ]
}

TECHNICAL_FILLERS = ["you know", "actually", "basically", "I mean", "essentially"]

# HR Interview
HR_ACKNOWLEDGMENTS = {
    FORMALITY_CASUAL: [
        "I appreciate that.",
        "That's great to hear.",
        "I like your honesty.",
    ],
    FORMALITY_PROFESSIONAL: [
        "I appreciate you sharing that.",
        "That's very insightful.",
        "That demonstrates good self-awareness.",
        "I value your perspective on that.",
    ],
    FORMALITY_FORMAL: [
        "I appreciate your candor.",
        "That demonstrates excellent self-awareness.",
        "Your perspective is valuable.",
        "Thank you for that thoughtful response.",
    ]
}

HR_EMPATHY_PHRASES = [
    "I can imagine that was challenging.",
    "That must have been a valuable learning experience.",
    "It sounds like you grew from that situation.",
    "I appreciate you being open about that.",
]

# Marketing Interview
MARKETING_ACKNOWLEDGMENTS = {
    FORMALITY_CASUAL: [
        "Love it!",
        "That's creative!",
        "Nice work!",
        "Cool campaign!",
    ],
    FORMALITY_PROFESSIONAL: [
        "That's an interesting strategy.",
        "Good use of data.",
        "Strong ROI focus.",
        "Well-executed campaign.",
    ],
    FORMALITY_FORMAL: [
        "That demonstrates strategic thinking.",
        "Excellent data-driven approach.",
        "Well-planned execution.",
    ]
}

MARKETING_ENTHUSIASM = [
    "Those metrics are impressive!",
    "Strong conversion rates!",
    "Excellent ROI!",
    "Great campaign performance!",
]

# Sales Interview
SALES_ACKNOWLEDGMENTS = {
    FORMALITY_CASUAL: [
        "Love it!",
        "Nice close!",
        "Great numbers!",
        "Solid!",
    ],
    FORMALITY_PROFESSIONAL: [
        "Strong performance.",
        "Excellent results.",
        "Well-executed strategy.",
        "Impressive achievement.",
    ],
    FORMALITY_FORMAL: [
        "Outstanding performance.",
        "Exemplary results.",
        "That demonstrates exceptional sales acumen.",
    ]
}

SALES_ENERGY = [
    "That's impressive!",
    "Strong close!",
    "Excellent quota attainment!",
    "Great pipeline management!",
]

# ========== TRANSITIONS BY ROLE ==========

TRANSITIONS_GENERAL = [
    "Building on that,",
    "Now I'm curious about",
    "Let me ask about",
    "Speaking of which,",
    "That leads me to",
]

TRANSITIONS_FORMAL = [
    "Following up on that,",
    "I'd like to explore",
    "Let's discuss",
    "Moving forward,",
]

# ========== QUESTION STARTERS ==========

QUESTION_STARTERS_CASUAL = [
    "Tell me about",
    "Walk me through",
    "How did you",
    "What was it like",
]

QUESTION_STARTERS_PROFESSIONAL = [
    "Could you describe",
    "I'd like to understand",
    "Please explain",
    "Help me understand",
]

QUESTION_STARTERS_FORMAL = [
    "Could you please elaborate on",
    "I would appreciate your perspective on",
    "Please describe",
]

# ========== PII SAFETY INSTRUCTION ==========
PII_SAFETY_INSTRUCTION = """
**CRITICAL PII SAFETY**: 
- Do NOT repeat candidate-provided emails, phone numbers, addresses, or SSNs
- If referencing their data, use placeholders: [candidate_project], [previous_company], [the_tool_mentioned]
- Paraphrase instead of quoting personal information directly
"""

# ========== HELPER FUNCTIONS ==========

def get_acknowledgment(
    role: str,
    formality: str = FORMALITY_PROFESSIONAL,
    quality: str = "Satisfactory"
) -> str:
    """
    Get role-appropriate acknowledgment based on formality and answer quality.
    
    Args:
        role: technical, hr, marketing, or sales
        formality: casual, professional, or formal
        quality: Strong, Satisfactory, or Needs Elaboration
    
    Returns:
        Randomly selected appropriate acknowledgment
    """
    role_map = {
        ROLE_TECHNICAL: TECHNICAL_ACKNOWLEDGMENTS,
        ROLE_HR: HR_ACKNOWLEDGMENTS,
        ROLE_MARKETING: MARKETING_ACKNOWLEDGMENTS,
        ROLE_SALES: SALES_ACKNOWLEDGMENTS,
    }
    
    # Get quality-based acknowledgment if applicable
    if quality == "Strong" and random.random() > 0.5:
        return random.choice(POSITIVE_STRONG)
    elif quality == "Needs Elaboration" and random.random() > 0.5:
        return random.choice(ENCOURAGING_NEEDS_ELABORATION)
    
    # Get role-specific acknowledgment
    role_acks = role_map.get(role, TECHNICAL_ACKNOWLEDGMENTS)
    formality_acks = role_acks.get(formality, role_acks.get(FORMALITY_PROFESSIONAL, []))
    
    if formality_acks:
        return random.choice(formality_acks)
    
    # Fallback to general professional
    return random.choice(ACKNOWLEDGMENTS_PROFESSIONAL)


def get_transition(formality: str = FORMALITY_PROFESSIONAL) -> str:
    """Get appropriate transition phrase."""
    if formality == FORMALITY_FORMAL:
        return random.choice(TRANSITIONS_FORMAL)
    return random.choice(TRANSITIONS_GENERAL)


def get_question_starter(formality: str = FORMALITY_PROFESSIONAL) -> str:
    """Get appropriate question starter."""
    if formality == FORMALITY_CASUAL:
        return random.choice(QUESTION_STARTERS_CASUAL)
    elif formality == FORMALITY_FORMAL:
        return random.choice(QUESTION_STARTERS_FORMAL)
    return random.choice(QUESTION_STARTERS_PROFESSIONAL)


def get_role_specific_filler(role: str) -> str:
    """Get casual filler word appropriate for role."""
    if role == ROLE_TECHNICAL:
        return random.choice(TECHNICAL_FILLERS)
    return ""  # Other roles use minimal fillers for professionalism
