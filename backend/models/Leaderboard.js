const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  totalScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  questionsAnswered: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  completionPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient ranking queries
leaderboardSchema.index({ totalScore: -1, createdAt: -1 });
leaderboardSchema.index({ difficulty: 1, totalScore: -1 });
leaderboardSchema.index({ tags: 1, totalScore: -1 });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);