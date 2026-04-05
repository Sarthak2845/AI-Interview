const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/authMiddleware');

// Upload resume and generate questions
router.post('/upload-resume', authMiddleware, upload.single('file'), interviewController.uploadResume);

// Submit answer
router.post('/submit-answer', authMiddleware, interviewController.submitAnswer);

// Get session details
router.get('/session/:sessionId', authMiddleware, interviewController.getSessionDetails);

// Get session questions and answers
router.get('/session/:sessionId/qa', authMiddleware, interviewController.getSessionQA);

// Get all sessions
router.get('/sessions/all', authMiddleware, interviewController.getAllSessions);

module.exports = router;