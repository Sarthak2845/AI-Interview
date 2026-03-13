# AI Interview Question Generator

Ultra-optimized FastAPI service with **difficulty levels** and **dynamic question count** for generating interview questions from resumes using Groq AI.

## Features
- **3 Difficulty Levels**: Easy, Medium, Hard
- **Dynamic Questions**: 1-50 questions per request
- **Token Optimized**: Smart token allocation based on question count
- **Fast Processing**: Minimal dependencies, direct HTTP calls
- **Smart Parsing**: Extracts skills, projects, experience automatically
- **Swagger Docs**: Interactive API at `/docs`

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# Add your GROQ_API_KEY to .env
python main.py
```

## API

### Generate Questions
```
POST /generate-questions
- file: Resume (PDF/DOCX/TXT)
- num_questions: 1-50 questions (default: 15)
- difficulty: easy|medium|hard (default: medium)
```

### Example Request
```bash
curl -X POST "http://localhost:8000/generate-questions" \
  -F "file=@resume.pdf" \
  -F "num_questions=30" \
  -F "difficulty=hard"
```

### Response
```json
{
  "success": true,
  "questions": "1. Easy question...\n2. Another question...",
  "difficulty": "hard",
  "total_questions": 30,
  "keywords": {
    "skills": ["python", "react"],
    "projects": ["web app", "api"],
    "experience": ["backend", "frontend"]
  }
}
```

## Difficulty Levels

### Easy
- Basic concepts and fundamental knowledge
- Simple technical questions
- Experience-based questions

### Medium (Default)
- Practical application scenarios
- Problem-solving questions
- Intermediate technical depth

### Hard
- Complex system design questions
- Advanced technical concepts
- Architecture and scalability

## Token Optimization
- **Dynamic Allocation**: ~25 tokens per question
- **Context Limit**: 300 chars max
- **Smart Prompts**: Difficulty-specific prompts
- **Efficient Models**: llama-3.1-8b-instant

## Java Integration
```java
// Spring Boot example
MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
body.add("file", new FileSystemResource(resumeFile));
body.add("num_questions", 30);
body.add("difficulty", "hard");

WebClient.create("http://localhost:8000")
    .post()
    .uri("/generate-questions")
    .body(BodyInserters.fromMultipartData(body))
    .retrieve()
    .bodyToMono(String.class);
```

## Files
- `main.py` - FastAPI app with difficulty levels
- `ai_service.py` - Optimized Groq AI client with dynamic prompts
- `parser.py` - Resume text extraction
- `.env` - API key configuration