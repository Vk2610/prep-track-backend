const express = require('express');
const router = express.Router();
const { getDashboardInsights } = require('../controllers/insightsController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

/**
 * @route   GET /api/insights/dashboard
 * @desc    Get comprehensive dashboard insights
 * @access  Private
 */
router.get('/dashboard', getDashboardInsights);

module.exports = router;
