const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const authMiddleware = require('../middleware/authMiddleware');

// Generate analysis (only once per session)
router.post('/analyze/:sessionId', authMiddleware, analysisController.generateAnalysis);

// Get existing analysis
router.get('/analysis/:sessionId', authMiddleware, analysisController.getAnalysis);

// Delete analysis (for regeneration)
router.delete('/analysis/:sessionId', authMiddleware, analysisController.deleteAnalysis);

// Get analysis status
router.get('/analysis-status/:sessionId', authMiddleware, analysisController.getAnalysisStatus);

module.exports = router;