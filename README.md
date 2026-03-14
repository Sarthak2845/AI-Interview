# 🎯 Jankoti - AI Interview Platform

A complete AI-powered interview platform that processes resumes and generates personalized interview questions.

## 🏗️ Architecture

```
Frontend (React) → Java Backend (Spring Boot) → Python Service (FastAPI)
```

**Workflow:**
1. User uploads resume via React frontend
2. Java backend receives file and forwards to Python service
3. Python service parses resume and generates AI questions
4. Java backend stores questions and returns to frontend
5. Frontend conducts interactive interview

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Maven 3.6+
- Node.js 18+
- Python 3.8+

### 1. Setup Python Service
```bash
cd python-service
pip install -r requirements.txt
```

### 2. Setup Java Backend
```bash
cd backend
mvn clean install
```

### 3. Setup React Frontend
```bash
cd frontend
npm install
```

### 4. Start All Services
Run the startup script:
```bash
start-jankoti.bat
```

Or start manually:
```bash
# Terminal 1 - Python Service
cd python-service
python main.py

# Terminal 2 - Java Backend  
cd backend
mvn spring-boot:run

# Terminal 3 - React Frontend
cd frontend
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Java Backend**: http://localhost:8080
- **Python Service**: http://localhost:8000
- **H2 Database Console**: http://localhost:8080/h2-console

## 📋 Features

### Resume Parser
- Supports PDF, DOCX, TXT files
- Extracts skills, experience, projects
- ATS quality assessment

### AI Question Generation
- Personalized questions based on resume
- 3 difficulty levels (Easy, Medium, Hard)
- 5-20 questions per session

### Interactive Interview
- Real-time question display
- Answer submission and storage
- Progress tracking
- Session management

## 🔧 API Endpoints

### Java Backend (`localhost:8080`)
- `POST /api/upload-resume` - Upload resume and generate questions
- `POST /api/submit-answer` - Submit interview answer
- `GET /api/session/{id}` - Get session details

### Python Service (`localhost:8000`)
- `POST /generate-questions` - Generate AI questions from resume
- `POST /parse-resume` - Parse resume content
- `GET /health` - Service health check

## 🗄️ Database Schema

### Tables
- `INTERVIEW_SESSIONS` - Interview session data
- `QUESTIONS` - Generated questions
- `ANSWERS` - User responses
- `USERS` - User information

## 🛠️ Configuration

### Java Backend
- Port: 8080
- Database: H2 (in-memory)
- File upload limit: 10MB

### Python Service  
- Port: 8000
- AI Model: Groq API
- Supported formats: PDF, DOCX, TXT

### React Frontend
- Port: 5173
- Build tool: Vite
- HTTP client: Axios

## 📁 Project Structure

```
AI-Interview/
├── frontend/           # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ResumeUpload.jsx
│   │   │   └── Interview.jsx
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
├── backend/            # Spring Boot application
│   ├── src/main/java/com/example/ecommerce/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── entity/
│   │   └── repository/
│   └── pom.xml
├── python-service/     # FastAPI service
│   ├── main.py
│   ├── ai_service.py
│   ├── parser.py
│   └── requirements.txt
└── start-jankoti.bat   # Startup script
```

## 🔍 Usage

1. **Upload Resume**: Drag & drop or select resume file
2. **Configure**: Choose difficulty and number of questions
3. **Generate**: Click "Generate Interview Questions"
4. **Interview**: Answer questions one by one
5. **Complete**: Review and finish interview

## 🐛 Troubleshooting

### Common Issues

**Port conflicts:**
- Change ports in application.properties (Java) or main.py (Python)

**CORS errors:**
- Verify frontend URL in Java backend CORS configuration

**File upload fails:**
- Check file size (max 10MB) and format (PDF/DOCX/TXT)

**Python service not responding:**
- Ensure all dependencies installed: `pip install -r requirements.txt`

### Logs
- Java: Console output from Spring Boot
- Python: FastAPI logs in terminal
- React: Browser developer console

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test all services
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details