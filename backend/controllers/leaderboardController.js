const Leaderboard = require('../models/Leaderboard');
const Session = require('../models/Session');
const Analysis = require('../models/Analysis');

// Add user to leaderboard after analysis
const addToLeaderboard = async (req, res) => {
  try {
    const { sessionId, userId, userName, userEmail, profilePicture } = req.body;

    // Get session and analysis data
    const session = await Session.findById(sessionId);
    const analysis = await Analysis.findOne({ sessionId });

    if (!session || !analysis) {
      return res.status(404).json({
        success: false,
        message: 'Session or analysis not found'
      });
    }

    // Extract tags from session questions
    const questions = await require('../models/Question').find({ sessionId });
    const allTags = [...new Set(questions.flatMap(q => q.tags || []))];

    // Create leaderboard entry
    const leaderboardEntry = new Leaderboard({
      userId,
      userName,
      userEmail,
      profilePicture,
      sessionId,
      totalScore: analysis.overallScore,
      difficulty: session.difficulty,
      questionsAnswered: session.answeredQuestions,
      totalQuestions: session.totalQuestions,
      completionPercentage: (session.answeredQuestions / session.totalQuestions) * 100,
      tags: allTags
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

// Get global leaderboard
const getGlobalLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 20, difficulty, tags } = req.query;
    
    let filter = {};
    if (difficulty) filter.difficulty = difficulty;
    if (tags) filter.tags = { $in: tags.split(',') };

    const leaderboard = await Leaderboard.find(filter)
      .sort({ totalScore: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Leaderboard.countDocuments(filter);

    // Add ranking
    const startRank = (page - 1) * limit + 1;
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry.toObject(),
      rank: startRank + index
    }));

    res.json({
      success: true,
      leaderboard: rankedLeaderboard,
      pagination: {
        currentPage: page,
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

// Get user ranking
const getUserRanking = async (req, res) => {
  try {
    const { userId } = req.params;
    const { difficulty, tags } = req.query;

    let filter = {};
    if (difficulty) filter.difficulty = difficulty;
    if (tags) filter.tags = { $in: tags.split(',') };

    // Get user's best score
    const userEntry = await Leaderboard.findOne({ 
      userId, 
      ...filter 
    }).sort({ totalScore: -1 });

    if (!userEntry) {
      return res.status(404).json({
        success: false,
        message: 'User not found in leaderboard'
      });
    }

    // Calculate rank
    const betterScores = await Leaderboard.countDocuments({
      ...filter,
      $or: [
        { totalScore: { $gt: userEntry.totalScore } },
        { 
          totalScore: userEntry.totalScore, 
          createdAt: { $lt: userEntry.createdAt } 
        }
      ]
    });

    const rank = betterScores + 1;

    res.json({
      success: true,
      userRanking: {
        ...userEntry.toObject(),
        rank
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

// Get leaderboard statistics
const getLeaderboardStats = async (req, res) => {
  try {
    const stats = await Leaderboard.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $addToSet: '$userId' },
          averageScore: { $avg: '$totalScore' },
          highestScore: { $max: '$totalScore' },
          totalSessions: { $sum: 1 }
        }
      },
      {
        $project: {
          totalUsers: { $size: '$totalUsers' },
          averageScore: { $round: ['$averageScore', 2] },
          highestScore: 1,
          totalSessions: 1
        }
      }
    ]);

    const difficultyStats = await Leaderboard.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
          averageScore: { $avg: '$totalScore' }
        }
      }
    ]);

    const topTags = await Leaderboard.aggregate([
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          averageScore: { $avg: '$totalScore' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      stats: {
        overall: stats[0] || {},
        byDifficulty: difficultyStats,
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