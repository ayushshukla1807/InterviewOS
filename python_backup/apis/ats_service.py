from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.routing import APIRouter
from pydantic import BaseModel, HttpUrl
import openai
import requests
import PyPDF2
import io
import json
import re
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import os
from enum import Enum
from openai import OpenAI
import os
from dotenv import load_dotenv
load_dotenv()

router = APIRouter()
# Include router
# app.include_router(router)

api_key = os.getenv("OPENAI_API_KEY")


client = OpenAI(api_key=api_key)
# Pydantic Models
class AnalysisRequest(BaseModel):
    pdf_url: HttpUrl

class SectionAnalysis(BaseModel):
    score: int
    issues: List[str]
    suggestions: List[str]

class GrammarAnalysis(BaseModel):
    score: int
    grammar_errors: List[str]
    awkward_phrases: List[str]
    suggestions: List[str]

class FormattingAnalysis(BaseModel):
    score: int
    formatting_issues: List[str]
    structure_issues: List[str]
    suggestions: List[str]

class KeywordAnalysis(BaseModel):
    score: int
    relevant_keywords_found: List[str]
    missing_keywords: List[str]
    keyword_density: str

class ATSCompatibilityAnalysis(BaseModel):
    score: int
    compatibility_issues: List[str]
    suggestions: List[str]

class ATSAnalysisResponse(BaseModel):
    overall_ats_score: int
    analysis_timestamp: str
    section_analysis: Dict[str, SectionAnalysis]
    grammar_and_language: GrammarAnalysis
    formatting_and_structure: FormattingAnalysis
    keyword_optimization: KeywordAnalysis
    ats_compatibility: ATSCompatibilityAnalysis
    strengths: List[str]
    critical_weaknesses: List[str]
    missing_sections: List[str]
    overall_recommendations: List[str]
    score_breakdown: Dict[str, int]

class ATSResumeAnalyzerAPI:
    def __init__(self):
        """Initialize the ATS Resume Analyzer API"""
        self.essential_sections = [
            "contact information", "email", "phone", "education", 
            "experience", "skills", "projects"
        ]
        self.optional_sections = [
            "summary/objective", "certifications", "achievements", 
            "awards", "publications", "languages"
        ]
    
    def extract_text_from_pdf_url(self, url: str) -> str:
        """Extract text from PDF URL"""
        try:
            response = requests.get(str(url), timeout=30)
            response.raise_for_status()
            
            pdf_file = io.BytesIO(response.content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            
            return text.strip()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error extracting PDF text: {str(e)}")
    
    def extract_text_from_pdf_file(self, file: UploadFile) -> str:
        """Extract text from uploaded PDF file"""
        try:
            pdf_content = file.file.read()
            pdf_file = io.BytesIO(pdf_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            
            return text.strip()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading PDF file: {str(e)}")
    
    def analyze_with_gpt(self, resume_text: str) -> Dict[str, Any]:
        
        
        prompt = f"""
        You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the following resume and provide a comprehensive evaluation.

        Resume Text:
        {resume_text}

        Please analyze this resume and provide a JSON response with the following structure:

        {{
            "overall_ats_score": <score out of 100>,
            "section_analysis": {{
                "contact_info": {{
                    "score": <score out of 100>,
                    "issues": ["list of issues found"],
                    "suggestions": ["list of improvement suggestions"]
                }},
                "summary_objective": {{
                    "score": <score out of 100>,
                    "issues": ["list of issues found"],
                    "suggestions": ["list of improvement suggestions"]
                }},
                "education": {{
                    "score": <score out of 100>,
                    "issues": ["list of issues found"],
                    "suggestions": ["list of improvement suggestions"]
                }},
                "experience": {{
                    "score": <score out of 100>,
                    "issues": ["list of issues found"],
                    "suggestions": ["list of improvement suggestions"]
                }},
                "skills": {{
                    "score": <score out of 100>,
                    "issues": ["list of issues found"],
                    "suggestions": ["list of improvement suggestions"]
                }},
                "projects": {{
                    "score": <score out of 100>,
                    "issues": ["list of issues found"],
                    "suggestions": ["list of improvement suggestions"]
                }},
                "achievements": {{
                    "score": <score out of 100>,
                    "issues": ["list of issues found"],
                    "suggestions": ["list of improvement suggestions"]
                }}
            }},
            "grammar_and_language": {{
                "score": <score out of 100>,
                "grammar_errors": ["list of grammar errors found"],
                "awkward_phrases": ["list of awkward phrases"],
                "suggestions": ["list of language improvement suggestions"]
            }},
            "formatting_and_structure": {{
                "score": <score out of 100>,
                "formatting_issues": ["list of formatting issues"],
                "structure_issues": ["list of structure issues"],
                "suggestions": ["list of formatting improvement suggestions"]
            }},
            "keyword_optimization": {{
                "score": <score out of 100>,
                "relevant_keywords_found": ["list of relevant keywords found"],
                "missing_keywords": ["list of suggested keywords to add"],
                "keyword_density": "assessment of keyword usage"
            }},
            "ats_compatibility": {{
                "score": <score out of 100>,
                "compatibility_issues": ["list of ATS compatibility issues"],
                "suggestions": ["list of ATS optimization suggestions"]
            }},
            "strengths": ["list of resume strengths"],
            "critical_weaknesses": ["list of critical weaknesses that need immediate attention"],
            "missing_sections": ["list of important sections that are missing"],
            "overall_recommendations": ["list of top priority recommendations for improvement"]
        }}

        Focus on:
        1. Grammar, spelling, and language clarity
        2. Section completeness and organization  
        3. ATS-friendly formatting
        4. Keyword optimization for the field
        5. Professional presentation
        6. Quantifiable achievements
        7. Action verbs usage
        8. Contact information completeness
        9. Date formatting consistency
        10. Overall professional impression

        Provide specific, actionable feedback that will help improve the ATS score and overall resume effectiveness.
        """
        
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert ATS resume analyzer. Always respond with valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=4000,
                temperature=0.3
            )
            
            response_text = response.choices[0].message.content
            
            # Try to extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start != -1 and json_end != -1:
                json_text = response_text[json_start:json_end]
                return json.loads(json_text)
            else:
                raise HTTPException(status_code=500, detail="No valid JSON found in GPT response")
                
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"Error parsing GPT response as JSON: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error calling GPT API: {str(e)}")
    
    def format_analysis_response(self, analysis_result: Dict[str, Any]) -> ATSAnalysisResponse:
        """Format the analysis result into the response model"""
        try:
            # Parse section analysis
            section_analysis = {}
            for section, data in analysis_result.get('section_analysis', {}).items():
                section_analysis[section] = SectionAnalysis(
                    score=data.get('score', 0),
                    issues=data.get('issues', []),
                    suggestions=data.get('suggestions', [])
                )
            
            # Parse grammar analysis
            grammar_data = analysis_result.get('grammar_and_language', {})
            grammar_analysis = GrammarAnalysis(
                score=grammar_data.get('score', 0),
                grammar_errors=grammar_data.get('grammar_errors', []),
                awkward_phrases=grammar_data.get('awkward_phrases', []),
                suggestions=grammar_data.get('suggestions', [])
            )
            
            # Parse formatting analysis
            formatting_data = analysis_result.get('formatting_and_structure', {})
            formatting_analysis = FormattingAnalysis(
                score=formatting_data.get('score', 0),
                formatting_issues=formatting_data.get('formatting_issues', []),
                structure_issues=formatting_data.get('structure_issues', []),
                suggestions=formatting_data.get('suggestions', [])
            )
            
            # Parse keyword analysis
            keyword_data = analysis_result.get('keyword_optimization', {})
            keyword_analysis = KeywordAnalysis(
                score=keyword_data.get('score', 0),
                relevant_keywords_found=keyword_data.get('relevant_keywords_found', []),
                missing_keywords=keyword_data.get('missing_keywords', []),
                keyword_density=keyword_data.get('keyword_density', 'Not analyzed')
            )
            
            # Parse ATS compatibility
            ats_data = analysis_result.get('ats_compatibility', {})
            ats_compatibility = ATSCompatibilityAnalysis(
                score=ats_data.get('score', 0),
                compatibility_issues=ats_data.get('compatibility_issues', []),
                suggestions=ats_data.get('suggestions', [])
            )
            
            # Calculate score breakdown
            score_breakdown = {
                'overall_ats_score': analysis_result.get('overall_ats_score', 0),
                'grammar_and_language': grammar_analysis.score,
                'formatting_and_structure': formatting_analysis.score,
                'keyword_optimization': keyword_analysis.score,
                'ats_compatibility': ats_compatibility.score
            }
            
            return ATSAnalysisResponse(
                overall_ats_score=analysis_result.get('overall_ats_score', 0),
                analysis_timestamp=datetime.now().isoformat(),
                section_analysis=section_analysis,
                grammar_and_language=grammar_analysis,
                formatting_and_structure=formatting_analysis,
                keyword_optimization=keyword_analysis,
                ats_compatibility=ats_compatibility,
                strengths=analysis_result.get('strengths', []),
                critical_weaknesses=analysis_result.get('critical_weaknesses', []),
                missing_sections=analysis_result.get('missing_sections', []),
                overall_recommendations=analysis_result.get('overall_recommendations', []),
                score_breakdown=score_breakdown
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error formatting analysis response: {str(e)}")

# Initialize the analyzer
analyzer = ATSResumeAnalyzerAPI()


@router.post("/analyze-resume-url", response_model=ATSAnalysisResponse)
async def analyze_resume_from_url(request: AnalysisRequest):
    """
    Analyze resume from PDF URL
    
    Args:
        request: AnalysisRequest containing PDF URL and OpenAI API key
    
    Returns:
        ATSAnalysisResponse: Complete ATS analysis in JSON format
    """
    try:
        # Extract text from PDF URL
        resume_text = analyzer.extract_text_from_pdf_url(request.pdf_url)
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")
        
        # Analyze with GPT
        analysis_result = analyzer.analyze_with_gpt(resume_text)
        
        # Format and return response
        return analyzer.format_analysis_response(analysis_result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error during analysis: {str(e)}")

@router.post("/analyze-resume-file", response_model=ATSAnalysisResponse)
async def analyze_resume_from_file(
    file: UploadFile = File(..., description="PDF file to analyze")
):
    """
    Analyze resume from uploaded PDF file
    
    Args:
        file: Uploaded PDF file
    
    Returns:
        ATSAnalysisResponse: Complete ATS analysis in JSON format
    """
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # Extract text from PDF file
        resume_text = analyzer.extract_text_from_pdf_file(file)
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")
        
        # Analyze with GPT
        analysis_result = analyzer.analyze_with_gpt(resume_text)
        
        # Format and return response
        return analyzer.format_analysis_response(analysis_result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error during analysis: {str(e)}")





