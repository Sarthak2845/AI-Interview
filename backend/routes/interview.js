const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const upload = require('../middleware/upload');

// Upload resume and generate questions
router.post('/upload-resume', upload.single('file'), interviewController.uploadResume);

// Submit answer
router.post('/submit-answer', interviewController.submitAnswer);

// Get session details
router.get('/session/:sessionId', interviewController.getSessionDetails);

// Get session questions and answers
router.get('/session/:sessionId/qa', interviewController.getSessionQA);

// Get all sessions
router.get('/sessions/all', interviewController.getAllSessions);

module.exports = router;