const express = require('express');
const router = express.Router();
const {
    createAnalysis,
    getAnalysisByMock,
    getAllAnalysis,
    getAnalysisById,
    updateAnalysis,
    deleteAnalysis,
    deleteAnalysisByMock,
    getMockAnalysisStats
} = require('../controllers/mockAnalysisController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected (require authentication)
router.use(protect);

// Main analysis routes
router.route('/')
    .get(getAllAnalysis)      // GET /api/analysis - Get all analysis entries
    .post(createAnalysis);    // POST /api/analysis - Create new analysis entry

// Mock-specific routes (must be before /:id routes)
router.get('/mock/:mockId', getAnalysisByMock);                    // GET /api/analysis/mock/:mockId
router.delete('/mock/:mockId', deleteAnalysisByMock);              // DELETE /api/analysis/mock/:mockId
router.get('/mock/:mockId/stats', getMockAnalysisStats);           // GET /api/analysis/mock/:mockId/stats

// ID-specific routes
router.route('/:id')
    .get(getAnalysisById)     // GET /api/analysis/:id - Get single analysis entry
    .put(updateAnalysis)      // PUT /api/analysis/:id - Update analysis entry
    .delete(deleteAnalysis);  // DELETE /api/analysis/:id - Delete analysis entry

module.exports = router;
