const { Session, Question, Answer, Analysis } = require('../models');
const AIService = require('../utils/aiService');
const { addToLeaderboard } = require('./leaderboardController');

const aiService = new AIService();

class AnalysisController {
  // Generate analysis (only once per session)
  async generateAnalysis(req, res, next) {
    try {
      const { sessionId } = req.params;
      
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ 
          success: false, 
          error: 'Session not found' 
        });
      }

      // Check if analysis already exists
      let analysis = await Analysis.findOne({ sessionId });
      if (analysis) {
        return res.json({
          success: true,
          analysis: {
            overallScore: analysis.overallScore,
            individualScores: analysis.individualScores,
            strengths: analysis.strengths,
            criticalIssues: analysis.criticalIssues,
            improvements: analysis.improvements,
            detailedAnalysis: analysis.detailedAnalysis,
            recommendations: analysis.recommendations,
            hiringRecommendation: analysis.hiringRecommendation,
            createdAt: analysis.createdAt
          },
          isExisting: true,
          message: 'Analysis already exists for this session'
        });
      }

      const questions = await Question.find({ sessionId }).sort({ questionIndex: 1 });
      const answers = await Answer.find({ sessionId }).sort({ questionIndex: 1 });

      if (answers.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No answers found to analyze. Complete the interview first.' 
        });
      }

      console.log(`Generating analysis for session ${sessionId} with ${answers.length} answers`);

      // Generate analysis using AI
      const analysisResult = await aiService.analyzeAnswers(questions, answers);

      // Save analysis to database
      analysis = new Analysis({
        sessionId,
        overallScore: analysisResult.overallScore,
        individualScores: analysisResult.individualScores || [],
        strengths: analysisResult.strengths,
        criticalIssues: analysisResult.criticalIssues || [],
        improvements: analysisResult.improvements,
        detailedAnalysis: analysisResult.detailedAnalysis,
        recommendations: analysisResult.recommendations,
        hiringRecommendation: analysisResult.hiringRecommendation || 'MAYBE'
      });
      await analysis.save();

      // Mark session as analyzed
      await Session.findByIdAndUpdate(sessionId, { 
        isAnalyzed: true,
        status: 'COMPLETED'
      });

      // Add to leaderboard automatically
      try {
        const questions = await Question.find({ sessionId });
        const allTags = [...new Set(questions.flatMap(q => q.tags || []))];
        
        // Generate dummy user data (replace with real user data when auth is implemented)
        const dummyUser = {
          userId: `user_${sessionId.toString().slice(-6)}`,
          userName: `User ${Math.floor(Math.random() * 1000)}`,
          userEmail: `user${Math.floor(Math.random() * 1000)}@example.com`,
          profilePicture: null
        };
        
        const leaderboardData = {
          ...dummyUser,
          sessionId,
          totalScore: analysisResult.overallScore,
          difficulty: session.difficulty,
          questionsAnswered: answers.length,
          totalQuestions: questions.length,
          completionPercentage: Math.round((answers.length / questions.length) * 100),
          tags: allTags
        };
        
        // Add to leaderboard
        const Leaderboard = require('../models/Leaderboard');
        await Leaderboard.create(leaderboardData);
        
        console.log(`Added user to leaderboard with score: ${analysisResult.overallScore}%`);
      } catch (leaderboardError) {
        console.error('Error adding to leaderboard:', leaderboardError);
        // Don't fail the analysis if leaderboard fails
      }

      console.log(`Analysis completed and saved for session ${sessionId}`);

      res.json({
        success: true,
        analysis: {
          overallScore: analysis.overallScore,
          individualScores: analysis.individualScores,
          strengths: analysis.strengths,
          criticalIssues: analysis.criticalIssues,
          improvements: analysis.improvements,
          detailedAnalysis: analysis.detailedAnalysis,
          recommendations: analysis.recommendations,
          hiringRecommendation: analysis.hiringRecommendation,
          createdAt: analysis.createdAt
        },
        message: 'Analysis generated successfully'
      });

    } catch (error) {
      console.error('Analysis generation error:', error);
      next(error);
    }
  }

  // Get existing analysis
  async getAnalysis(req, res, next) {
    try {
      const { sessionId } = req.params;
      
      const analysis = await Analysis.findOne({ sessionId });
      if (!analysis) {
        return res.status(404).json({ 
          success: false, 
          error: 'Analysis not found. Generate analysis first.' 
        });
      }

      res.json({
        success: true,
        analysis: {
          overallScore: analysis.overallScore,
          individualScores: analysis.individualScores,
          strengths: analysis.strengths,
          criticalIssues: analysis.criticalIssues,
          improvements: analysis.improvements,
          detailedAnalysis: analysis.detailedAnalysis,
          recommendations: analysis.recommendations,
          hiringRecommendation: analysis.hiringRecommendation,
          createdAt: analysis.createdAt
        }
      });

    } catch (error) {
      console.error('Get analysis error:', error);
      next(error);
    }
  }

  // Delete analysis (for regeneration if needed)
  async deleteAnalysis(req, res, next) {
    try {
      const { sessionId } = req.params;
      
      const analysis = await Analysis.findOneAndDelete({ sessionId });
      if (!analysis) {
        return res.status(404).json({ 
          success: false, 
          error: 'Analysis not found' 
        });
      }

      // Mark session as not analyzed
      await Session.findByIdAndUpdate(sessionId, { 
        isAnalyzed: false 
      });

      res.json({
        success: true,
        message: 'Analysis deleted successfully. You can now generate a new analysis.'
      });

    } catch (error) {
      console.error('Delete analysis error:', error);
      next(error);
    }
  }

  // Get analysis status for a session
  async getAnalysisStatus(req, res, next) {
    try {
      const { sessionId } = req.params;
      
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ 
          success: false, 
          error: 'Session not found' 
        });
      }

      const analysis = await Analysis.findOne({ sessionId });
      const answeredQuestions = await Answer.countDocuments({ sessionId });

      res.json({
        success: true,
        sessionId: session._id,
        isAnalyzed: session.isAnalyzed,
        hasAnalysis: !!analysis,
        answeredQuestions,
        totalQuestions: session.totalQuestions,
        canAnalyze: answeredQuestions > 0,
        analysisCreatedAt: analysis ? analysis.createdAt : null
      });

    } catch (error) {
      console.error('Get analysis status error:', error);
      next(error);
    }
  }
}

module.exports = new AnalysisController();