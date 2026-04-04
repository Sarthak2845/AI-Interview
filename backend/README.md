# 🎯 Jankoti Backend - Structured Node.js API

Professional Node.js backend with MVC architecture, designed for team collaboration and scalability.

## 🏗️ Architecture Overview

```
nodejs-backend/
├── config/              # Configuration files
│   └── database.js      # MongoDB connection
├── controllers/         # Business logic
│   ├── interviewController.js
│   └── analysisController.js
├── models/             # Database schemas
│   ├── User.js
│   ├── Session.js
│   ├── Question.js
│   ├── Answer.js
│   ├── Analysis.js
│   └── index.js
├── routes/             # API routes
│   ├── interview.js
│   ├── analysis.js
│   └── index.js
├── middleware/         # Custom middleware
│   ├── errorHandler.js
│   └── upload.js
├── utils/              # Utility functions
│   ├── resumeParser.js
│   └── aiService.js
├── .env               # Environment variables
├── server.js          # Main server file
└── package.json       # Dependencies
```

## ✨ Key Features

### 🔄 **One-Time Analysis**
- Analysis is generated only once per session when user requests it
- Subsequent requests fetch from database (no re-generation)
- Prevents unnecessary AI API calls and ensures consistency

### 📊 **Smart Caching**
- Questions cached per user/difficulty combination
- Analysis results stored permanently
- Session data persisted across requests

### 🏢 **Team-Ready Structure**
- **MVC Architecture**: Clear separation of concerns
- **Modular Design**: Easy to extend and maintain
- **Error Handling**: Comprehensive error management
- **Middleware**: Reusable components
- **Type Safety**: Mongoose schemas with validation

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd nodejs-backend
npm install
```

### 2. Environment Setup
Create `.env` file:
```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/jankoti-interview
GROQ_API_KEY=your_groq_api_key_here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## 📋 API Endpoints

### Interview Management
```
POST   /api/upload-resume        # Upload resume & generate questions
POST   /api/submit-answer        # Submit interview answer
GET    /api/session/:id          # Get session details
GET    /api/session/:id/qa       # Get questions & answers
GET    /api/sessions/all         # Get all user sessions
```

### Analysis Management ✨ **NEW**
```
POST   /api/analyze/:sessionId           # Generate analysis (one-time)
GET    /api/analysis/:sessionId          # Get existing analysis
DELETE /api/analysis/:sessionId          # Delete analysis (admin)
GET    /api/analysis-status/:sessionId   # Check analysis status
```

### Utility
```
GET    /api/health              # Health check
GET    /                        # API info
```

## 🗄️ Database Schema

### Collections

#### Sessions
```javascript
{
  userId: String,           // Default: '1'
  resumeText: String,       // Original filename
  fileName: String,         // File name
  status: String,           // 'ACTIVE', 'COMPLETED', 'ABANDONED'
  difficulty: String,       // 'easy', 'medium', 'hard'
  totalQuestions: Number,   // Total questions generated
  answeredQuestions: Number, // Questions answered
  isAnalyzed: Boolean,      // Analysis generated flag
  createdAt: Date,
  updatedAt: Date
}
```

#### Questions
```javascript
{
  sessionId: ObjectId,      // Reference to Session
  questionText: String,     // Question content
  questionIndex: Number,    // Order in interview
  createdAt: Date,
  updatedAt: Date
}
```

#### Answers
```javascript
{
  sessionId: ObjectId,      // Reference to Session
  questionId: ObjectId,     // Reference to Question
  questionIndex: Number,    // Question order
  answerText: String,       // User's answer
  timeSpent: Number,        // Time in milliseconds
  wordCount: Number,        // Answer word count
  isAutoSave: Boolean,      // Auto-saved flag
  score: Number,            // AI-generated score
  createdAt: Date,
  updatedAt: Date
}
```

#### Analysis ✨ **NEW**
```javascript
{
  sessionId: ObjectId,      // Reference to Session (unique)
  overallScore: Number,     // 0-100 performance score
  strengths: [String],      // List of strengths
  improvements: [String],   // Areas for improvement
  detailedAnalysis: String, // Comprehensive analysis
  recommendations: [String], // Actionable recommendations
  isGenerated: Boolean,     // Generation flag
  createdAt: Date,          // Analysis creation time
  updatedAt: Date
}
```

## 🔧 Controllers

### InterviewController
- **uploadResume**: Process resume and generate questions
- **submitAnswer**: Save user answers with metadata
- **getSessionDetails**: Retrieve session information
- **getSessionQA**: Get questions and answers
- **getAllSessions**: List all user sessions

### AnalysisController ✨ **NEW**
- **generateAnalysis**: Create one-time analysis
- **getAnalysis**: Retrieve existing analysis
- **deleteAnalysis**: Remove analysis (admin)
- **getAnalysisStatus**: Check if analysis exists

## 🛠️ Utilities

### ResumeParser
- **extractText**: PDF, DOCX, TXT parsing
- **extractKeywords**: Skills, projects, experience extraction
- **assessATSQuality**: Resume quality scoring

### AIService
- **generateQuestions**: Personalized question generation
- **analyzeAnswers**: Performance analysis generation
- **parseQuestions**: AI response parsing
- **parseAnalysis**: Analysis result parsing

## 🔒 Middleware

### Error Handler
- Mongoose validation errors
- Duplicate key errors
- Cast errors
- File upload errors
- Generic error handling

### Upload Middleware
- File type validation (PDF, DOCX, TXT)
- File size limits (10MB)
- Memory storage configuration

## 🎯 Analysis Workflow

### 1. Interview Completion
```javascript
// User completes interview
POST /api/submit-answer (final question)
// Session status remains 'ACTIVE'
```

### 2. Analysis Request
```javascript
// User clicks "Generate Analysis"
POST /api/analyze/:sessionId
// Creates analysis record
// Marks session as 'COMPLETED' and 'isAnalyzed: true'
```

### 3. Subsequent Requests
```javascript
// User views analysis again
GET /api/analysis/:sessionId
// Returns cached analysis from database
// No AI API calls made
```

## 👥 Team Development

### Adding New Features

#### 1. New Model
```javascript
// models/NewModel.js
const mongoose = require('mongoose');

const newSchema = new mongoose.Schema({
  // Define schema
}, { timestamps: true });

module.exports = mongoose.model('NewModel', newSchema);
```

#### 2. New Controller
```javascript
// controllers/newController.js
const { NewModel } = require('../models');

class NewController {
  async newMethod(req, res, next) {
    try {
      // Business logic
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NewController();
```

#### 3. New Routes
```javascript
// routes/new.js
const express = require('express');
const router = express.Router();
const newController = require('../controllers/newController');

router.get('/new-endpoint', newController.newMethod);

module.exports = router;
```

#### 4. Register Routes
```javascript
// routes/index.js
const newRoutes = require('./new');
router.use('/', newRoutes);
```

### Code Standards

#### Error Handling
```javascript
// Always use try-catch in controllers
try {
  const result = await someAsyncOperation();
  res.json({ success: true, data: result });
} catch (error) {
  next(error); // Pass to error middleware
}
```

#### Response Format
```javascript
// Success response
res.json({
  success: true,
  data: result,
  message: 'Operation successful'
});

// Error response (handled by middleware)
res.status(400).json({
  success: false,
  error: 'Error message'
});
```

#### Database Queries
```javascript
// Use async/await
const sessions = await Session.find({ userId }).sort({ createdAt: -1 });

// Handle not found
const session = await Session.findById(sessionId);
if (!session) {
  return res.status(404).json({ 
    success: false, 
    error: 'Session not found' 
  });
}
```

## 🔍 Testing

### Manual Testing
```bash
# Health check
curl http://localhost:8080/api/health

# Upload resume
curl -X POST http://localhost:8080/api/upload-resume \
  -F "file=@resume.pdf" \
  -F "difficulty=medium" \
  -F "numQuestions=10"

# Generate analysis
curl -X POST http://localhost:8080/api/analyze/SESSION_ID
```

### Database Queries
```javascript
// MongoDB shell
use jankoti-interview

// Check collections
show collections

// View sessions
db.sessions.find().pretty()

// Check analysis
db.analyses.find().pretty()
```

## 🚨 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB is running
mongod --version
# Update MONGODB_URI in .env
```

**File Upload Errors**
```bash
# Check file size (max 10MB)
# Verify file type (PDF, DOCX, TXT)
# Ensure multer middleware is working
```

**Analysis Not Generating**
```bash
# Verify GROQ_API_KEY in .env
# Check if session has answered questions
# Review API rate limits
```

**CORS Issues**
```bash
# Verify FRONTEND_URL in .env
# Check browser console for errors
```

## 📈 Performance Optimizations

- **Database Indexing**: Optimized queries with indexes
- **One-Time Analysis**: Prevents redundant AI calls
- **Question Caching**: Reuses questions for same parameters
- **Connection Pooling**: Efficient MongoDB connections
- **Error Handling**: Prevents server crashes

## 🔐 Security Features

- **Input Validation**: Mongoose schema validation
- **File Upload Security**: Type and size restrictions
- **Error Sanitization**: Safe error messages
- **CORS Configuration**: Controlled access
- **Environment Variables**: Secure configuration

---

**🎯 Ready for Team Development - Scalable, Maintainable, Professional**