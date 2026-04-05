const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  addToLeaderboard,
  getGlobalLeaderboard,
  getUserRanking,
  getLeaderboardStats
} = require('../controllers/leaderboardController');

// Add user to leaderboard (auth required)
router.post('/add', authMiddleware, addToLeaderboard);

// Get global leaderboard (public)
router.get('/global', getGlobalLeaderboard);

// Get user ranking (auth required)
router.get('/user/:userId', authMiddleware, getUserRanking);

// Get leaderboard statistics (public)
router.get('/stats', getLeaderboardStats);

module.exports = router;