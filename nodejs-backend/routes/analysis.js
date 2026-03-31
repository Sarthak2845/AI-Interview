const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

// Generate analysis (only once per session)
router.post('/analyze/:sessionId', analysisController.generateAnalysis);

// Get existing analysis
router.get('/analysis/:sessionId', analysisController.getAnalysis);

// Delete analysis (for regeneration)
router.delete('/analysis/:sessionId', analysisController.deleteAnalysis);

// Get analysis status
router.get('/analysis-status/:sessionId', analysisController.getAnalysisStatus);

module.exports = router;