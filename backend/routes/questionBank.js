const express = require('express');
const router = express.Router();
const {
  getQuestionsFromBank,
  getAvailableTags
} = require('../controllers/questionBankController');

// Get questions from bank
router.get('/questions', getQuestionsFromBank);

// Get available tags and categories
router.get('/tags', getAvailableTags);

module.exports = router;