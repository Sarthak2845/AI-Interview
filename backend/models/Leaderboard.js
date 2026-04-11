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
    required: true,
    unique: true
  },
  totalScore: {
    type: Number,
    required: true,
    min: 0,
    max: 150 // Allow for bonus points
  },
  originalScore: {
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
  sessionDuration: {
    type: Number, // in milliseconds
    default: 0
  },
  averageAnswerLength: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient ranking queries
leaderboardSchema.index({ totalScore: -1, createdAt: -1 });
leaderboardSchema.index({ difficulty: 1, totalScore: -1 });
leaderboardSchema.index({ tags: 1, totalScore: -1 });
leaderboardSchema.index({ userId: 1, totalScore: -1 });
leaderboardSchema.index({ completionPercentage: -1, totalScore: -1 });
leaderboardSchema.index({ sessionDuration: 1, totalScore: -1 });

// Virtual for performance level
leaderboardSchema.virtual('performanceLevel').get(function() {
  if (this.totalScore >= 90) return 'Exceptional';
  if (this.totalScore >= 80) return 'Excellent';
  if (this.totalScore >= 70) return 'Good';
  if (this.totalScore >= 60) return 'Average';
  if (this.totalScore >= 50) return 'Below Average';
  return 'Needs Improvement';
});

// Virtual for badge
leaderboardSchema.virtual('badge').get(function() {
  const badges = {
    easy: { 90: '🥇 Easy Master', 80: '🥈 Easy Expert', 70: '🥉 Easy Pro' },
    medium: { 90: '🏆 Medium Champion', 80: '🥇 Medium Master', 70: '🥈 Medium Expert' },
    hard: { 90: '👑 Hard Legend', 80: '🏆 Hard Champion', 70: '🥇 Hard Master' }
  };
  
  const difficultyBadges = badges[this.difficulty] || {};
  for (const [threshold, badge] of Object.entries(difficultyBadges).sort((a, b) => b[0] - a[0])) {
    if (this.totalScore >= parseInt(threshold)) return badge;
  }
  return null;
});

// Update timestamp on save
leaderboardSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Leaderboard', leaderboardSchema);