import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

class OptimizedGroqAI:
    """
    AI service for generating interview questions from resume data.
    Now uses the enhanced parser output to create context-rich prompts.
    """
    
    def __init__(self):
        self.api_key = os.getenv('GROQ_API_KEY')
        if not self.api_key:
            raise ValueError("GROQ_API_KEY required")
        
        self.headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        self.url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "llama-3.1-8b-instant"  # Fast and capable
    
    def generate_questions(self, keywords, num_questions=15, difficulty="medium"):
        """
        Generate interview questions based on parsed resume keywords.
        
        Args:
            keywords: dict returned by extract_keywords() (contains skills, projects_full, experience_full, education_full, etc.)
            num_questions: number of questions to generate (1-50)
            difficulty: "easy", "medium", or "hard"
        
        Returns:
            list of strings (questions)
        """
        # Validate inputs
        if num_questions < 1 or num_questions > 50:
            raise ValueError("num_questions must be between 1 and 50")
        if difficulty not in ["easy", "medium", "hard"]:
            difficulty = "medium"
        
        # Build a comprehensive context from the parsed data
        context_sections = []
        
        # 1. Skills (concise list)
        skills = keywords.get('skills', [])
        if skills:
            context_sections.append(f"SKILLS:\n{', '.join(skills)}")
        
        # 2. Projects – use full descriptions for depth
        projects_full = keywords.get('projects_full', [])
        if projects_full:
            project_texts = []
            for proj in projects_full:
                title = proj.get('title', 'Untitled')
                desc = proj.get('description', '')
                # Truncate description if too long (keep ~200 chars)
                if len(desc) > 300:
                    desc = desc[:300] + "..."
                project_texts.append(f"- {title}: {desc}")
            context_sections.append("PROJECTS:\n" + "\n".join(project_texts))
        else:
            # Fallback to old project_names
            proj_names = keywords.get('project_names', [])
            if proj_names:
                context_sections.append(f"PROJECT NAMES:\n{', '.join(proj_names)}")
        
        # 3. Experience – use full details
        exp_full = keywords.get('experience_full', [])
        if exp_full:
            exp_texts = []
            for exp in exp_full:
                title = exp.get('title', '')
                company = exp.get('company', '')
                dates = f"{exp.get('start_date', '')} - {exp.get('end_date', '')}".strip(' -')
                desc = exp.get('description', '')
                if len(desc) > 200:
                    desc = desc[:200] + "..."
                line = f"- {title} at {company} ({dates}): {desc}" if company else f"- {title}: {desc}"
                exp_texts.append(line)
            context_sections.append("EXPERIENCE:\n" + "\n".join(exp_texts))
        else:
            # Fallback to old experience strings
            exp_old = keywords.get('experience', [])
            if exp_old:
                context_sections.append(f"EXPERIENCE:\n{', '.join(exp_old[:3])}")
        
        # 4. Education – use full details
        edu_full = keywords.get('education_full', [])
        if edu_full:
            edu_texts = []
            for edu in edu_full:
                degree = edu.get('degree', '')
                institution = edu.get('institution', '')
                year = edu.get('graduation_year', '')
                line = f"- {degree}, {institution} ({year})" if institution else f"- {degree}"
                edu_texts.append(line)
            context_sections.append("EDUCATION:\n" + "\n".join(edu_texts))
        else:
            edu_old = keywords.get('education', [])
            if edu_old:
                context_sections.append(f"EDUCATION:\n{', '.join(edu_old)}")
        
        # Combine all sections
        full_context = "\n\n".join(context_sections)
        
        # Difficulty‑specific instructions
        difficulty_instructions = {
            "easy": """
Focus on fundamental concepts:
- Basic understanding of the technologies mentioned
- Simple project overviews (what was built, why)
- Entry‑level problem solving
- Definitions and core principles

Examples of easy questions:
- "What is React and why would you use it?"
- "Explain how you handled state in your TestIntegrity project."
- "Describe your experience with Python in a recent project."
""",
            "medium": """
Focus on practical application and problem‑solving:
- How specific technologies were used to solve real problems
- Technical decisions and trade‑offs
- Implementation details (e.g., how you integrated YOLO/FaceNet)
- Debugging and optimization scenarios

Examples of medium questions:
- "How did you integrate YOLO for real‑time face tracking in TestIntegrity?"
- "Describe the architecture of your BloomBuddy app and why you chose Firebase."
- "What challenges did you face when implementing the AI proctoring system?"
""",
            "hard": """
Focus on advanced concepts, system design, and scalability:
- Design choices and architectural patterns
- Performance optimization, scaling, and security
- Integration of multiple complex systems
- Leadership, mentoring, and future improvements

Examples of hard questions:
- "How would you scale the TestIntegrity platform to handle 10,000 concurrent users?"
- "Discuss the trade‑offs between using YOLO and FaceNet for real‑time proctoring."
- "If you were to redesign StargazeX with a microservices architecture, how would you approach it?"
"""
        }
        
        # Build the final prompt
        prompt = f"""You are an expert technical interviewer. Based on the candidate's resume data below, generate {num_questions} {difficulty}-level interview questions.

Resume data:
{full_context}

{difficulty_instructions[difficulty]}

Return ONLY a JSON array of strings, each string being a question. Do not include any other text, numbering, or markdown.
Example: ["Question 1", "Question 2", ...]
"""
        
        # Determine max tokens (rough estimate)
        max_tokens = min(num_questions * 50, 2048)  # ensure enough space
        
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": max_tokens,
            "top_p": 0.9,
            "response_format": {"type": "json_object"}  # request JSON output
        }
        
        try:
            response = requests.post(self.url, headers=self.headers, json=payload, timeout=60)
            response.raise_for_status()
            result = response.json()
            content = result['choices'][0]['message']['content']
            
            # Attempt to parse JSON
            try:
                questions = json.loads(content)
                if isinstance(questions, list) and all(isinstance(q, str) for q in questions):
                    return questions
                else:
                    # Fallback: try to extract questions from text
                    lines = [line.strip() for line in content.split('\n') if line.strip()]
                    questions = [line.lstrip('0123456789.- ') for line in lines if line]
                    return questions[:num_questions]
            except json.JSONDecodeError:
                # If JSON fails, fallback to splitting by newlines and cleaning
                lines = [line.strip() for line in content.split('\n') if line.strip()]
                questions = [line.lstrip('0123456789.- ') for line in lines if line]
                return questions[:num_questions]
                
        except requests.exceptions.RequestException as e:
            raise Exception(f"Groq API request failed: {str(e)}")
        except KeyError as e:
            raise Exception(f"Unexpected API response format: {str(e)}")