import streamlit as st
import os
import sys
import uuid
import json
import asyncio
from datetime import datetime
from typing import Dict, List, Optional
from streamlit_chat import message
import PyPDF2
import io

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from langgraphs.generate_plan import generate_plan
from langgraphs.generate_question import generate_question
from langgraphs.schema import InterviewState, UserInput, initial_state
from langgraphs.prompts import extract_candidate_summary
from helpers_functions.model import client_llm2
from helpers_functions.json_parser import parse_summary_json
from apis.jdagent import (
    AssessmentState, JDAnalyzer, AssessmentQuestionGenerator,
    AssessmentScorer, CORE_TRAITS
)

# Page configuration
st.set_page_config(
    page_title="EnergyBae AIcruiter Bot",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Premium Design
st.markdown("""
    <style>
    :root {
        --primary: #00f2fe;
        --secondary: #4facfe;
        --dark: #0f172a;
    }
    
    .stApp {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: #e2e8f0;
    }
    
    .main-title {
        font-family: 'Inter', sans-serif;
        background: linear-gradient(90deg, #00f2fe 0%, #4facfe 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 3rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
    }
    
    .sub-title {
        color: #94a3b8;
        font-size: 1.2rem;
        margin-bottom: 2rem;
    }
    
    .card {
        background: rgba(30, 41, 59, 0.7);
        border-radius: 1rem;
        padding: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        margin-bottom: 1rem;
    }
    
    .stButton>button {
        background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.5rem 2rem;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
    }
    
    .stTextInput>div>div>input {
        background: rgba(15, 23, 42, 0.6);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .stSelectbox>div>div>div {
        background: rgba(15, 23, 42, 0.6);
        color: white;
    }
    
    /* Animation for Neural Scanning effect */
    @keyframes scan {
        0% { transform: translateY(-100%); opacity: 0; }
        50% { opacity: 0.5; }
        100% { transform: translateY(100%); opacity: 0; }
    }
    
    .scanning-line {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 2px;
        background: var(--primary);
        box-shadow: 0 0 15px var(--primary);
        animation: scan 2s linear infinite;
        z-index: 10;
        pointer-events: none;
    }
    </style>
""", unsafe_allow_html=True)

# Helper Functions
def extract_text_from_pdf(pdf_file):
    text = ""
    try:
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
    except Exception as e:
        return f"Error: {e}"
    return text.strip()

# Initialize Session State
if 'session_id' not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())
if 'mode' not in st.session_state:
    st.session_state.mode = "Landing"
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
if 'interview_state' not in st.session_state:
    st.session_state.interview_state = None
if 'assessment_state' not in st.session_state:
    st.session_state.assessment_state = None
if 'qa_data' not in st.session_state:
    st.session_state.qa_data = []
if 'final_summary' not in st.session_state:
    st.session_state.final_summary = None

# Sidebar
with st.sidebar:
    st.image("https://energybae.in/wp-content/uploads/2023/04/EnergyBae-Logo.png", width=200) # Placeholder for logo
    st.markdown("### Navigation")
    if st.button("🏠 Home", use_container_width=True):
        st.session_state.mode = "Landing"
    
    st.markdown("---")
    st.markdown("### AI Interviewer (HYRTE)")
    if st.button("🎙️ Start AI Interview", use_container_width=True):
        st.session_state.mode = "Interviewer"
        st.session_state.chat_history = []
        st.session_state.interview_state = None
        
    st.markdown("---")
    st.markdown("### JD Assessment")
    if st.button("📋 Run JD Analysis", use_container_width=True):
        st.session_state.mode = "Assessment"
        st.session_state.assessment_state = None

    st.markdown("---")
    st.markdown("### Settings")
    st.selectbox("Persona", ["Professional", "Friendly", "Strict", "Casual", "Hinglish"], index=0, key="persona_select")
    st.selectbox("Difficulty", ["Easy", "Medium", "Hard"], index=1, key="difficulty_select")

# Persona Map for backend
PERSONA_IDS = {"Professional": 0, "Friendly": 1, "Strict": 2, "Casual": 3, "Hinglish": 4}
DIFFICULTY_IDS = {"Easy": 1, "Medium": 2, "Hard": 3}

# --- LANDING PAGE ---
if st.session_state.mode == "Landing":
    st.markdown('<h1 class="main-title">AIcruiter Bot</h1>', unsafe_allow_html=True)
    st.markdown('<p class="sub-title">Premium AI-Driven Recruitment Intelligence by EnergyBae</p>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        <div class="card">
            <h3>🎙️ AI Interviewer (HYRTE)</h3>
            <p>Elevated, India-reliable assessment engine with Hinglish support and track-specific deep dives (JS AI, DSA, FSD).</p>
            <ul>
                <li>Adaptive Difficulty</li>
                <li>Real-time Behavioral Signals</li>
                <li>Newton School Mock Standards</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)
        if st.button("Launch Interviewer", key="btn_interviewer"):
            st.session_state.mode = "Interviewer"
            st.rerun()
            
    with col2:
        st.markdown("""
        <div class="card">
            <h3>📋 JD-Based Assessment</h3>
            <p>Comprehensive personality and skills testing tailored specifically to your Job Description.</p>
            <ul>
                <li>Trait Extraction from JD</li>
                <li>Custom MCQ & Behavioral Scales</li>
                <li>Detailed Recommendation Reports</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)
        if st.button("Launch Assessment", key="btn_assessment"):
            st.session_state.mode = "Assessment"
            st.rerun()

# --- INTERVIEWER MODE ---
elif st.session_state.mode == "Interviewer":
    st.markdown('<h1 class="main-title">HYRTE AI Interviewer</h1>', unsafe_allow_html=True)
    
    if st.session_state.interview_state is None:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown("### Step 1: Upload Resume")
        uploaded_file = st.file_uploader("Upload your resume (PDF)", type=["pdf"])
        
        if uploaded_file is not None:
            if st.button("Start Interview"):
                with st.spinner("Analyzing resume and generating interview plan..."):
                    resume_text = extract_text_from_pdf(uploaded_file)
                    
                    # Initialize LangGraph state
                    from copy import deepcopy
                    state = deepcopy(initial_state)
                    state["resume"] = resume_text
                    state["type"] = 0 # Tech
                    state["persona"] = PERSONA_IDS[st.session_state.persona_select]
                    state["difficulty"] = DIFFICULTY_IDS[st.session_state.difficulty_select]
                    
                    try:
                        state = generate_plan(state)
                        st.session_state.interview_state = state
                        st.session_state.chat_history.append({"role": "assistant", "content": state["current_question"]})
                        st.rerun()
                    except Exception as e:
                        st.error(f"Error initializing interview: {e}")
        st.markdown('</div>', unsafe_allow_html=True)
    
    else:
        # Chat Interface
        chat_container = st.container()
        
        with chat_container:
            for i, msg in enumerate(st.session_state.chat_history):
                message(msg["content"], is_user=(msg["role"]=="user"), key=f"msg_{i}")
        
        # User input at the bottom
        user_input = st.chat_input("Type your answer here...")
        
        if user_input:
            st.session_state.chat_history.append({"role": "user", "content": user_input})
            
            with st.spinner("AI is thinking..."):
                state = st.session_state.interview_state
                state["user_answer"] = user_input
                
                try:
                    # Generate next question
                    state = generate_question(state)
                    st.session_state.interview_state = state
                    st.session_state.chat_history.append({"role": "assistant", "content": state["current_question"]})
                    
                    # Store Q&A pair with critique for summary generation
                    if 'qa_data' not in st.session_state:
                        st.session_state.qa_data = []
                    
                    # Get the critique from the state (this is for the answer just given)
                    # Note: state['critique'] is updated by generate_question for the answer just provided
                    st.session_state.qa_data.append({
                        "question": st.session_state.chat_history[-3]["content"] if len(st.session_state.chat_history) >= 3 else "",
                        "answer": user_input,
                        "critique": state.get("critique", {})
                    })
                    
                    # Check if interview is over
                    if state.get("current_section") == "Conclusion":
                        st.session_state.chat_history.append({"role": "system", "content": "Interview completed! You can now generate the final report."})
                    st.rerun()
                except Exception as e:
                    st.error(f"Error generating question: {e}")

        # Summary Generation Button
        if st.session_state.interview_state and st.session_state.interview_state.get("current_section") == "Conclusion":
            st.markdown("---")
            if st.button("📊 Generate Final Interview Report", use_container_width=True):
                with st.spinner("Analyzing your performance and generating professional report..."):
                    try:
                        prompt = extract_candidate_summary(st.session_state.qa_data)
                        response = client_llm2.invoke(prompt, temperature=0.0)
                        
                        summary_json, success = parse_summary_json(response.content)
                        
                        st.session_state.final_summary = summary_json
                        st.session_state.mode = "Interviewer_Summary"
                        st.rerun()
                    except Exception as e:
                        st.error(f"Error generating report: {e}")

# --- INTERVIEWER SUMMARY MODE ---
elif st.session_state.mode == "Interviewer_Summary":
    st.markdown('<h1 class="main-title">Interview Performance Report</h1>', unsafe_allow_html=True)
    summary = st.session_state.final_summary
    
    col1, col2 = st.columns([1, 2])
    
    with col1:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        # Handle both string and int overall_score
        score_val = summary.get('overall_score', 0)
        st.metric("Overall Score", f"{score_val}/100")
        
        verdict = summary.get('final_verdict', summary.get('fit_summary', 'N/A'))
        st.markdown(f"**Verdict**: {str(verdict).replace('_', ' ').title()}")
        
        if 'percentile_rank' in summary:
            st.markdown(f"**Percentile**: {summary['percentile_rank']}")
        if 'role_match_index' in summary:
            st.markdown(f"**Role Match**: {summary['role_match_index']}")
        st.markdown('</div>', unsafe_allow_html=True)
        
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown("### Performance Metrics")
        
        # Display section scores if available
        scores = summary.get("section_scores", {})
        if scores:
            for section, data in scores.items():
                if isinstance(data, dict):
                    st.write(f"**{section.replace('_', ' ').title()}**: {data.get('score', 0)}/10")
                    st.progress(min(float(data.get('score', 0)) / 10.0, 1.0))
        
        # Display breakdown if available
        breakdown = summary.get("performance_breakdown", {})
        if breakdown:
            for k, v in breakdown.items():
                st.write(f"**{k.replace('_', ' ')}**: {v}")
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown("### Executive Summary")
        st.write(summary.get("precise_summary", summary.get("summary", "N/A")))
        st.markdown('</div>', unsafe_allow_html=True)
        
        tab1, tab2, tab3 = st.tabs(["🌟 Strengths", "🚩 Improvement Areas", "🧠 Deep Insights"])
        
        with tab1:
            strengths = summary.get("genuine_strengths", [])
            if strengths:
                for s in strengths:
                    st.success(s)
            else:
                st.info("No specific strengths highlighted.")
        
        with tab2:
            improvements = summary.get("strict_improvement_areas", [])
            if improvements:
                for imp in improvements:
                    st.warning(imp)
            
            flags = summary.get("critical_flags", {})
            if flags and any(flags.values()):
                st.markdown("#### Critical Flags")
                for flag_type, items in flags.items():
                    if items:
                        for item in items:
                            st.error(f"**{flag_type.replace('_', ' ').title()}**: {item}")
        
        with tab3:
            # Display insight layers (L1-L5)
            layers = summary.get("detailed_insight_layers", {})
            if layers:
                for layer_id, description in layers.items():
                    clean_name = layer_id.replace("L1_", "").replace("L2_", "").replace("L3_", "").replace("L4_", "").replace("L5_", "").replace("_", " ")
                    st.markdown(f"**{clean_name}**")
                    st.info(description)
            
            hyrte = summary.get("hyrte_insight", "")
            if hyrte:
                st.markdown("#### HYRTE Analysis")
                st.write(hyrte)
            
    if st.button("Start New Interview"):
        st.session_state.mode = "Landing"
        st.session_state.interview_state = None
        st.session_state.chat_history = []
        st.session_state.qa_data = []
        st.rerun()

# --- ASSESSMENT MODE ---
elif st.session_state.mode == "Assessment":
    st.markdown('<h1 class="main-title">JD Assessment Agent</h1>', unsafe_allow_html=True)
    
    if st.session_state.assessment_state is None:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown("### Step 1: Input Job Description")
        jd_text = st.text_area("Paste the Job Description here", height=300)
        
        if st.button("Start Assessment"):
            if not jd_text.strip():
                st.warning("Please enter a job description.")
            else:
                with st.spinner("Analyzing JD and generating assessment..."):
                    agent = AssessmentState()
                    analyzer = JDAnalyzer()
                    
                    # Run analysis (using asyncio since analyzer is async)
                    analysis = asyncio.run(analyzer.analyze_jd(jd_text))
                    
                    agent.job_description = jd_text
                    agent.job_title = analysis['job_title']
                    agent.extracted_skills = analysis['required_skills']
                    
                    for trait, priority in analysis['recommended_traits'].items():
                        if priority != "None":
                            agent.selected_traits[trait] = priority
                            agent.trait_characteristics[trait] = CORE_TRAITS.get(trait, [])
                    
                    # Generate personality questions
                    q_gen = AssessmentQuestionGenerator()
                    all_questions = []
                    for trait, priority in agent.selected_traits.items():
                        characteristics = agent.trait_characteristics.get(trait, [])
                        q_count = {"High": 5, "Medium": 3, "Low": 2}.get(priority, 3)
                        
                        questions = asyncio.run(q_gen.generate_personality_questions(
                            trait=trait,
                            characteristics=characteristics,
                            job_context=f"{agent.job_title}: {agent.job_description[:300]}",
                            count=q_count
                        ))
                        all_questions.extend(questions)
                    
                    agent.personality_questions = all_questions
                    agent.total_questions = len(all_questions)
                    agent.current_question_index = 0
                    agent.current_phase = "personality_test"
                    
                    st.session_state.assessment_state = agent
                    st.rerun()
        st.markdown('</div>', unsafe_allow_html=True)
        
    else:
        state = st.session_state.assessment_state
        
        if state.current_phase == "personality_test":
            if state.current_question_index < len(state.personality_questions):
                q = state.personality_questions[state.current_question_index]
                
                st.markdown(f'<div class="card"><h3>Question {state.current_question_index + 1} of {len(state.personality_questions)}</h3>', unsafe_allow_html=True)
                st.markdown(f"**Trait:** {q['trait']} | **Aspect:** {q.get('characteristic', '')}")
                
                q_format = q.get('format', 'behavioral_scale')
                
                response = None
                if q_format == 'situational_mcq':
                    st.write(q['scenario'])
                    response = st.radio("Choose an option:", q['options'], key=f"q_{state.current_question_index}")
                    response = response[0] if response else None # Get 'A', 'B', etc.
                
                elif q_format == 'behavioral_scale':
                    st.write(q['question'])
                    response = st.select_slider("Frequency:", options=["Never", "Rarely", "Sometimes", "Often", "Always"], value="Sometimes", key=f"q_{state.current_question_index}")
                
                elif q_format == 'preference_choice':
                    st.write(q['question'])
                    options = [f"A) {q['option_a']}", f"B) {q['option_b']}"]
                    response = st.radio("Your preference:", options, key=f"q_{state.current_question_index}")
                    response = response[0] if response else None
                
                elif q_format == 'text_response':
                    st.write(q['question'])
                    response = st.text_area("Your answer (2-3 sentences):", key=f"q_{state.current_question_index}")
                
                elif q_format == 'ranking':
                    st.write(q['question'])
                    st.write("Items to rank:")
                    for i, item in enumerate(q['items']):
                        st.write(f"{i+1}. {item}")
                    response = st.text_input("Enter rank order (e.g., 2,1,4,3):", key=f"q_{state.current_question_index}")

                if st.button("Next Question"):
                    if q_format == 'text_response' and len(response.strip()) < 10:
                        st.warning("Please provide a more detailed response.")
                    else:
                        # Score and move on
                        scorer = AssessmentScorer()
                        if q_format == 'text_response':
                            score = scorer.score_text_response(q, response)
                        else:
                            score = scorer.score_personality_response(q, response)
                        
                        trait = q['trait']
                        if trait not in state.trait_scores: state.trait_scores[trait] = []
                        state.trait_scores[trait].append(score)
                        
                        state.current_question_index += 1
                        st.session_state.assessment_state = state
                        st.rerun()
                st.markdown('</div>', unsafe_allow_html=True)
            else:
                # Prepare skills test
                with st.spinner("Preparing skills assessment..."):
                    q_gen = AssessmentQuestionGenerator()
                    for skill in state.extracted_skills[:10]:
                        question = asyncio.run(q_gen.generate_skills_question(
                            skill=skill,
                            job_context=f"{state.job_title}: {state.job_description[:300]}"
                        ))
                        if question:
                            state.skills_questions.append(question)
                    
                    state.current_phase = "skills_test"
                    state.current_question_index = 0
                    st.session_state.assessment_state = state
                    st.rerun()

        elif state.current_phase == "skills_test":
            if state.current_question_index < len(state.skills_questions):
                q = state.skills_questions[state.current_question_index]
                
                st.markdown(f'<div class="card"><h3>Technical Question {state.current_question_index + 1}</h3>', unsafe_allow_html=True)
                st.markdown(f"**Skill:** {q['skill']}")
                st.write(q['question'])
                
                response = st.radio("Choose the correct option:", q['options'], key=f"sq_{state.current_question_index}")
                
                if st.button("Submit Answer"):
                    user_ans = response[0]
                    is_correct = (user_ans == q['correct'])
                    state.skills_scores[q['skill']] = 1 if is_correct else 0
                    
                    state.current_question_index += 1
                    st.session_state.assessment_state = state
                    st.rerun()
                st.markdown('</div>', unsafe_allow_html=True)
            else:
                state.current_phase = "completed"
                st.session_state.assessment_state = state
                st.rerun()

        elif state.current_phase == "completed":
            st.markdown('<div class="card">', unsafe_allow_html=True)
            st.markdown("## Assessment Results")
            
            scorer = AssessmentScorer()
            results = scorer.calculate_overall_fit(state)
            
            col1, col2, col3 = st.columns(3)
            col1.metric("Overall Fit", f"{results['overall_score']}%")
            col2.metric("Personality", f"{results['personality_score']}%")
            col3.metric("Skills", f"{results['skills_score']}%")
            
            st.markdown(f"### Recommendation: **{results['recommendation']}**")
            
            st.markdown("### Trait Breakdown")
            for trait, data in results['trait_breakdown'].items():
                st.write(f"**{trait}**: {data['level']} ({data['percentage']}%)")
                st.progress(data['percentage'] / 100)
            
            st.markdown("### Skills Performance")
            for skill, score in results['skills_breakdown'].items():
                st.write(f"{'✅' if score > 0 else '❌'} {skill}")
            
            if st.button("Back to Home"):
                st.session_state.mode = "Landing"
                st.session_state.assessment_state = None
                st.rerun()
            st.markdown('</div>', unsafe_allow_html=True)

# Footer
st.markdown("---")
st.markdown("<p style='text-align: center; color: #64748b;'>© 2026 EnergyBae | AIcruiter Intelligence</p>", unsafe_allow_html=True)
