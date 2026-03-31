const { Session, Question, Answer } = require('../models');
const ResumeParser = require('../utils/resumeParser');
const AIService = require('../utils/aiService');

const resumeParser = new ResumeParser();
const aiService = new AIService();

class InterviewController {
  // Upload resume and generate questions
  async uploadResume(req, res, next) {
    try {
      const { difficulty = 'medium', numQuestions = 10 } = req.body;
      const userId = '1'; // Default user ID
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'No file uploaded' 
        });
      }

      console.log(`Processing resume: ${req.file.originalname}, Size: ${req.file.size} bytes`);

      // Extract text from resume
      const fileType = req.file.originalname.split('.').pop();
      const resumeText = await resumeParser.extractText(req.file.buffer, fileType);
      
      if (!resumeText || resumeText.length < 50) {
        return res.status(400).json({ 
          success: false, 
          error: 'Resume content too short or empty' 
        });
      }

      // Extract keywords
      const keywords = resumeParser.extractKeywords(resumeText);

      // Check if user already has questions for similar resume
      const existingSession = await Session.findOne({ 
        userId, 
        fileName: req.file.originalname,
        difficulty 
      }).sort({ createdAt: -1 });

      if (existingSession) {
        const existingQuestions = await Question.find({ 
          sessionId: existingSession._id 
        }).sort({ questionIndex: 1 });
        
        if (existingQuestions.length > 0) {
          console.log(`Returning existing questions for user ${userId}`);
          return res.json({
            success: true,
            sessionId: existingSession._id,
            questions: existingQuestions.map(q => ({ question: q.questionText })),
            difficulty,
            totalQuestions: existingQuestions.length,
            isExisting: true,
            atsQuality: keywords.atsQuality
          });
        }
      }

      // Generate new questions
      const questions = await aiService.generateQuestions(keywords, parseInt(numQuestions), difficulty);

      // Create new session
      const session = new Session({
        userId,
        resumeText: req.file.originalname,
        fileName: req.file.originalname,
        status: 'ACTIVE',
        difficulty,
        totalQuestions: questions.length
      });
      await session.save();

      // Save questions
      const savedQuestions = [];
      for (let i = 0; i < questions.length; i++) {
        const question = new Question({
          sessionId: session._id,
          questionText: questions[i].question,
          questionIndex: i
        });
        await question.save();
        savedQuestions.push(question);
      }

      console.log(`Generated ${questions.length} questions for session ${session._id}`);

      res.json({
        success: true,
        sessionId: session._id,
        questions: questions,
        difficulty,
        totalQuestions: questions.length,
        atsQuality: keywords.atsQuality
      });

    } catch (error) {
      console.error('Resume processing error:', error);
      next(error);
    }
  }

  // Submit answer
  async submitAnswer(req, res, next) {
    try {
      const { sessionId, questionIndex, answer, timeSpent, wordCount, isAutoSave = false } = req.body;

      if (!sessionId || questionIndex === undefined || !answer) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      // Find session and question
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ 
          success: false, 
          error: 'Session not found' 
        });
      }

      const question = await Question.findOne({ sessionId, questionIndex });
      if (!question) {
        return res.status(404).json({ 
          success: false, 
          error: 'Question not found' 
        });
      }

      // Check if answer already exists
      let answerDoc = await Answer.findOne({ sessionId, questionIndex });
      
      if (answerDoc) {
        // Update existing answer
        answerDoc.answerText = answer;
        answerDoc.timeSpent = timeSpent;
        answerDoc.wordCount = wordCount;
        answerDoc.isAutoSave = isAutoSave;
        await answerDoc.save();
      } else {
        // Create new answer
        answerDoc = new Answer({
          sessionId,
          questionId: question._id,
          questionIndex,
          answerText: answer,
          timeSpent,
          wordCount,
          isAutoSave
        });
        await answerDoc.save();

        // Update session answered count
        const answeredCount = await Answer.countDocuments({ sessionId });
        await Session.findByIdAndUpdate(sessionId, { 
          answeredQuestions: answeredCount 
        });
      }

      console.log(`Answer ${answerDoc.isNew ? 'submitted' : 'updated'} for question ${questionIndex}`);

      res.json({
        success: true,
        message: isAutoSave ? 'Answer auto-saved successfully' : 'Answer submitted successfully',
        questionIndex,
        isAutoSave
      });

    } catch (error) {
      console.error('Submit answer error:', error);
      next(error);
    }
  }

  // Get session details
  async getSessionDetails(req, res, next) {
    try {
      const { sessionId } = req.params;
      
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ 
          success: false, 
          error: 'Session not found' 
        });
      }

      const questions = await Question.find({ sessionId }).sort({ questionIndex: 1 });
      const answers = await Answer.find({ sessionId });

      res.json({
        success: true,
        sessionId: session._id,
        status: session.status,
        difficulty: session.difficulty,
        totalQuestions: questions.length,
        answeredQuestions: answers.length,
        createdAt: session.createdAt,
        isAnalyzed: session.isAnalyzed
      });

    } catch (error) {
      console.error('Get session error:', error);
      next(error);
    }
  }

  // Get session questions and answers
  async getSessionQA(req, res, next) {
    try {
      const { sessionId } = req.params;
      
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ 
          success: false, 
          error: 'Session not found' 
        });
      }

      const questions = await Question.find({ sessionId }).sort({ questionIndex: 1 });
      const answers = await Answer.find({ sessionId });

      const qaList = questions.map((question, index) => {
        const answer = answers.find(a => a.questionIndex === index);
        return {
          questionIndex: index + 1,
          questionText: question.questionText,
          questionId: question._id,
          answerText: answer ? answer.answerText : null,
          answerId: answer ? answer._id : null,
          answerScore: answer ? answer.score : null,
          hasAnswer: !!answer,
          timeSpent: answer ? answer.timeSpent : null,
          wordCount: answer ? answer.wordCount : null
        };
      });

      res.json({
        success: true,
        sessionId: session._id,
        resumeText: session.resumeText,
        status: session.status,
        difficulty: session.difficulty,
        totalQuestions: questions.length,
        answeredQuestions: answers.length,
        questionsAndAnswers: qaList,
        createdAt: session.createdAt,
        isAnalyzed: session.isAnalyzed
      });

    } catch (error) {
      console.error('Get session Q&A error:', error);
      next(error);
    }
  }

  // Get all sessions
  async getAllSessions(req, res, next) {
    try {
      const userId = '1'; // Default user ID
      
      const sessions = await Session.find({ userId }).sort({ createdAt: -1 });
      const sessionList = [];

      for (const session of sessions) {
        const totalQuestions = await Question.countDocuments({ sessionId: session._id });
        const answeredQuestions = await Answer.countDocuments({ sessionId: session._id });
        
        sessionList.push({
          sessionId: session._id,
          resumeText: session.resumeText,
          fileName: session.fileName,
          status: session.status,
          difficulty: session.difficulty,
          totalQuestions,
          answeredQuestions,
          completionPercentage: totalQuestions > 0 ? Math.round((answeredQuestions * 100) / totalQuestions) : 0,
          createdAt: session.createdAt,
          isAnalyzed: session.isAnalyzed
        });
      }

      res.json({
        success: true,
        totalSessions: sessions.length,
        sessions: sessionList
      });

    } catch (error) {
      console.error('Get all sessions error:', error);
      next(error);
    }
  }
}

module.exports = new InterviewController();