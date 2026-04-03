const express = require('express');
const router = express.Router();
const {
  addToLeaderboard,
  getGlobalLeaderboard,
  getUserRanking,
  getLeaderboardStats
} = require('../controllers/leaderboardController');

// Add user to leaderboard
router.post('/add', addToLeaderboard);

// Get global leaderboard
router.get('/global', getGlobalLeaderboard);

// Get user ranking
router.get('/user/:userId', getUserRanking);

// Get leaderboard statistics
router.get('/stats', getLeaderboardStats);

module.exports = router;