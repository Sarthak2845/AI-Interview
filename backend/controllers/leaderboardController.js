const Leaderboard = require('../models/Leaderboard');
const Session = require('../models/Session');
const Analysis = require('../models/Analysis');
const Answer = require('../models/Answer');

// Calculate comprehensive score based on multiple factors
const calculateComprehensiveScore = (session, analysis, answers) => {
  let baseScore = analysis.overallScore || 0;
  
  // Completion bonus (up to 10 points)
  const completionBonus = (session.answeredQuestions / session.totalQuestions) * 10;
  
  // Difficulty multiplier
  const difficultyMultiplier = {
    'easy': 1.0,
    'medium': 1.2,
    'hard': 1.5
  }[session.difficulty] || 1.0;
  
  // Answer quality bonus (based on answer length and detail)
  let qualityBonus = 0;
  if (answers && answers.length > 0) {
    const avgAnswerLength = answers.reduce((sum, ans) => sum + (ans.answer?.length || 0), 0) / answers.length;
    qualityBonus = Math.min(avgAnswerLength / 100, 5); // Up to 5 points for detailed answers
  }
  
  // Speed bonus (if completed quickly)
  const sessionDuration = session.updatedAt - session.createdAt;
  const avgTimePerQuestion = sessionDuration / session.answeredQuestions;
  const speedBonus = avgTimePerQuestion < 120000 ? 3 : 0; // 3 points if under 2 minutes per question
  
  const finalScore = Math.min(100, (baseScore + completionBonus + qualityBonus + speedBonus) * difficultyMultiplier);
  return Math.round(finalScore * 100) / 100;
};

// Add user to leaderboard after analysis
const addToLeaderboard = async (req, res) => {
  try {
    const { sessionId, userId, userName, userEmail, profilePicture } = req.body;

    // Get session and analysis data
    const session = await Session.findById(sessionId);
    const analysis = await Analysis.findOne({ sessionId });
    const answers = await Answer.find({ sessionId });

    if (!session || !analysis) {
      return res.status(404).json({
        success: false,
        message: 'Session or analysis not found'
      });
    }

    // Extract tags from session questions
    const questions = await require('../models/Question').find({ sessionId });
    const allTags = [...new Set(questions.flatMap(q => q.tags || []))];

    // Calculate comprehensive score
    const comprehensiveScore = calculateComprehensiveScore(session, analysis, answers);

    // Check if user already has an entry for this session
    const existingEntry = await Leaderboard.findOne({ sessionId });
    if (existingEntry) {
      // Update existing entry with better score if applicable
      if (comprehensiveScore > existingEntry.totalScore) {
        existingEntry.totalScore = comprehensiveScore;
        existingEntry.updatedAt = new Date();
        await existingEntry.save();
      }
      return res.json({
        success: true,
        message: 'Leaderboard entry updated',
        leaderboardEntry: existingEntry
      });
    }

    // Create new leaderboard entry
    const leaderboardEntry = new Leaderboard({
      userId,
      userName,
      userEmail,
      profilePicture,
      sessionId,
      totalScore: comprehensiveScore,
      originalScore: analysis.overallScore,
      difficulty: session.difficulty,
      questionsAnswered: session.answeredQuestions,
      totalQuestions: session.totalQuestions,
      completionPercentage: Math.round((session.answeredQuestions / session.totalQuestions) * 100),
      tags: allTags,
      sessionDuration: session.updatedAt - session.createdAt,
      averageAnswerLength: answers.length > 0 ? Math.round(answers.reduce((sum, ans) => sum + (ans.answer?.length || 0), 0) / answers.length) : 0
    });

    await leaderboardEntry.save();

    res.json({
      success: true,
      message: 'Added to leaderboard successfully',
      leaderboardEntry
    });
  } catch (error) {
    console.error('Error adding to leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to leaderboard',
      error: error.message
    });
  }
};

// Get global leaderboard with advanced ranking
const getGlobalLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 20, difficulty, tags, sortBy = 'score' } = req.query;
    
    let filter = {};
    if (difficulty) filter.difficulty = difficulty;
    if (tags) filter.tags = { $in: tags.split(',') };

    // Define sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'completion':
        sortOptions = { completionPercentage: -1, totalScore: -1 };
        break;
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      case 'speed':
        sortOptions = { sessionDuration: 1, totalScore: -1 };
        break;
      default:
        sortOptions = { totalScore: -1, completionPercentage: -1, createdAt: -1 };
    }

    // Get unique users with their best scores
    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: '$userId',
          bestEntry: { $first: '$$ROOT' },
          maxScore: { $max: '$totalScore' },
          totalAttempts: { $sum: 1 }
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$bestEntry',
              { totalAttempts: '$totalAttempts' }
            ]
          }
        }
      },
      { $sort: sortOptions },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ];

    const leaderboard = await Leaderboard.aggregate(pipeline);
    const totalPipeline = [
      { $match: filter },
      { $group: { _id: '$userId' } },
      { $count: 'total' }
    ];
    const totalResult = await Leaderboard.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    // Add ranking
    const startRank = (page - 1) * limit + 1;
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: startRank + index,
      performanceLevel: getPerformanceLevel(entry.totalScore),
      badge: getBadge(entry.totalScore, entry.difficulty)
    }));

    res.json({
      success: true,
      leaderboard: rankedLeaderboard,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalEntries: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
};

// Helper functions for performance evaluation
const getPerformanceLevel = (score) => {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Average';
  if (score >= 50) return 'Below Average';
  return 'Needs Improvement';
};

const getBadge = (score, difficulty) => {
  const badges = {
    easy: { 90: '🥇 Easy Master', 80: '🥈 Easy Expert', 70: '🥉 Easy Pro' },
    medium: { 90: '🏆 Medium Champion', 80: '🥇 Medium Master', 70: '🥈 Medium Expert' },
    hard: { 90: '👑 Hard Legend', 80: '🏆 Hard Champion', 70: '🥇 Hard Master' }
  };
  
  const difficultyBadges = badges[difficulty] || {};
  for (const [threshold, badge] of Object.entries(difficultyBadges).sort((a, b) => b[0] - a[0])) {
    if (score >= parseInt(threshold)) return badge;
  }
  return null;
};

// Get user ranking with detailed analytics
const getUserRanking = async (req, res) => {
  try {
    const { userId } = req.params;
    const { difficulty, tags } = req.query;

    let filter = { userId };
    if (difficulty) filter.difficulty = difficulty;
    if (tags) filter.tags = { $in: tags.split(',') };

    // Get user's best entry
    const userEntry = await Leaderboard.findOne(filter).sort({ totalScore: -1 });

    if (!userEntry) {
      return res.status(404).json({
        success: false,
        message: 'User not found in leaderboard'
      });
    }

    // Calculate rank among all users
    const globalFilter = {};
    if (difficulty) globalFilter.difficulty = difficulty;
    if (tags) globalFilter.tags = { $in: tags.split(',') };

    const betterUsers = await Leaderboard.aggregate([
      { $match: globalFilter },
      {
        $group: {
          _id: '$userId',
          maxScore: { $max: '$totalScore' }
        }
      },
      {
        $match: {
          maxScore: { $gt: userEntry.totalScore }
        }
      },
      { $count: 'count' }
    ]);

    const rank = (betterUsers[0]?.count || 0) + 1;

    // Get user's improvement over time
    const userHistory = await Leaderboard.find({ userId })
      .sort({ createdAt: 1 })
      .select('totalScore createdAt difficulty');

    res.json({
      success: true,
      userRanking: {
        ...userEntry.toObject(),
        rank,
        performanceLevel: getPerformanceLevel(userEntry.totalScore),
        badge: getBadge(userEntry.totalScore, userEntry.difficulty),
        improvement: userHistory.length > 1 ? 
          userHistory[userHistory.length - 1].totalScore - userHistory[0].totalScore : 0,
        totalAttempts: userHistory.length,
        history: userHistory
      }
    });
  } catch (error) {
    console.error('Error fetching user ranking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user ranking',
      error: error.message
    });
  }
};

// Get comprehensive leaderboard statistics
const getLeaderboardStats = async (req, res) => {
  try {
    // Overall statistics
    const overallStats = await Leaderboard.aggregate([
      {
        $group: {
          _id: '$userId',
          maxScore: { $max: '$totalScore' },
          attempts: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          averageScore: { $avg: '$maxScore' },
          highestScore: { $max: '$maxScore' },
          totalAttempts: { $sum: '$attempts' }
        }
      },
      {
        $project: {
          totalUsers: 1,
          averageScore: { $round: ['$averageScore', 1] },
          highestScore: 1,
          totalSessions: '$totalAttempts'
        }
      }
    ]);

    // Difficulty-wise statistics
    const difficultyStats = await Leaderboard.aggregate([
      {
        $group: {
          _id: { userId: '$userId', difficulty: '$difficulty' },
          maxScore: { $max: '$totalScore' }
        }
      },
      {
        $group: {
          _id: '$_id.difficulty',
          count: { $sum: 1 },
          averageScore: { $avg: '$maxScore' },
          highestScore: { $max: '$maxScore' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Performance distribution
    const performanceDistribution = await Leaderboard.aggregate([
      {
        $group: {
          _id: '$userId',
          maxScore: { $max: '$totalScore' }
        }
      },
      {
        $bucket: {
          groupBy: '$maxScore',
          boundaries: [0, 50, 60, 70, 80, 90, 100],
          default: 'other',
          output: {
            count: { $sum: 1 },
            averageScore: { $avg: '$maxScore' }
          }
        }
      }
    ]);

    // Top performing tags
    const topTags = await Leaderboard.aggregate([
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          averageScore: { $avg: '$totalScore' },
          maxScore: { $max: '$totalScore' }
        }
      },
      { $sort: { averageScore: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      stats: {
        overall: overallStats[0] || { totalUsers: 0, averageScore: 0, highestScore: 0, totalSessions: 0 },
        byDifficulty: difficultyStats,
        performanceDistribution,
        topTags
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard statistics',
      error: error.message
    });
  }
};

module.exports = {
  addToLeaderboard,
  getGlobalLeaderboard,
  getUserRanking,
  getLeaderboardStats
};