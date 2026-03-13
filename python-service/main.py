from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
from enum import Enum

from ai_service import OptimizedGroqAI
from parser import extract_text, extract_keywords

class DifficultyLevel(str, Enum):
    easy = "easy"
    medium = "medium" 
    hard = "hard"

app = FastAPI(
    title="AI Interview Question Generator",
    description="Optimized resume parsing and AI question generation with difficulty levels",
    version="2.0.0"
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def root():
    return {
        "service": "AI Interview Generator", 
        "status": "running", 
        "docs": "/docs",
        "endpoints": {
            "parse_resume": "/parse-resume - Test parser accuracy (now includes ATS score)",
            "generate_questions": "/generate-questions - Generate interview questions"
        },
        "difficulty_levels": ["easy", "medium", "hard"],
        "max_questions": 50
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    """Parse resume and show extracted information (includes ATS quality assessment)"""
    
    # Validate file
    if not file.filename or not file.filename.lower().endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(status_code=400, detail="Upload PDF, DOCX, or TXT file")
    
    try:
        # Extract text
        content = await file.read()
        file_type = file.filename.split('.')[-1].lower()
        text = extract_text(BytesIO(content), file_type)
        
        if not text or len(text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Resume content too short or empty")
        
        # Extract all keywords and structured data
        keywords = extract_keywords(text)
        sections = keywords['sections']
        
        # Build preview for each section (first 2 non-empty lines)
        sections_preview = {}
        for section_name, lines in sections.items():
            non_empty = [ln for ln in lines if ln.strip()]
            preview = non_empty[:2] if non_empty else []
            sections_preview[section_name] = {
                "lines_count": len(lines),
                "preview": preview
            }
        
        return {
            "success": True,
            "filename": file.filename,
            "text_length": len(text),
            "sections_found": sections_preview,
            "extracted_data": {
                "skills": {
                    "count": len(keywords['skills']),
                    "items": keywords['skills']
                },
                "project_names": {
                    "count": len(keywords['project_names']),
                    "items": keywords['project_names']
                },
                "project_keywords": {
                    "count": len(keywords['project_keywords']),
                    "items": keywords['project_keywords']
                },
                "experience": {
                    "count": len(keywords['experience']),
                    "items": keywords['experience']
                },
                "education": {
                    "count": len(keywords['education']),
                    "items": keywords['education']
                },
                # New detailed fields
                "projects_full": keywords.get('projects_full', []),
                "education_full": keywords.get('education_full', []),
                "experience_full": keywords.get('experience_full', [])
            },
            "ats_quality": keywords.get('ats_quality', {
                "score": 0,
                "rating": "Unknown",
                "suggestions": []
            }),
            "parser_stats": {
                "total_sections": len(sections),
                "total_skills": len(keywords['skills']),
                "total_project_names": len(keywords['project_names']),
                "total_project_keywords": len(keywords['project_keywords']),
                "total_experience": len(keywords['experience']),
                "total_education": len(keywords['education'])
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing failed: {str(e)}")

@app.post("/generate-questions")
async def generate_questions(
    file: UploadFile = File(...), 
    num_questions: int = Form(15),
    difficulty: DifficultyLevel = Form(DifficultyLevel.medium)
):
    """Generate interview questions from resume with difficulty level"""
    
    # Validate inputs
    if not file.filename or not file.filename.lower().endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(status_code=400, detail="Upload PDF, DOCX, or TXT file")
    
    if num_questions < 1 or num_questions > 50:
        raise HTTPException(status_code=400, detail="Number of questions must be between 1 and 50")
    
    try:
        # Extract text
        content = await file.read()
        file_type = file.filename.split('.')[-1].lower()
        text = extract_text(BytesIO(content), file_type)
        
        if not text or len(text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Resume content too short or empty")
        
        # Extract all keywords (including full details)
        keywords = extract_keywords(text)
        
        # Generate questions with difficulty level using the full keywords
        ai_service = OptimizedGroqAI()
        questions = ai_service.generate_questions(
            keywords=keywords,
            num_questions=num_questions,
            difficulty=difficulty.value
        )
        
        return {
            "success": True,
            "questions": questions,
            "difficulty": difficulty.value,
            "total_questions": len(questions),
            "ats_quality": keywords.get('ats_quality')
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)