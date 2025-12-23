const express = require('express');
const router = express.Router();
const {
    createOrUpdateTracker,
    getAllTrackers,
    getTrackerByDate,
    deleteTracker,
    getTrackerStats
} = require('../controllers/dailyTrackerController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected (require authentication)
router.use(protect);

// Main tracker routes
router.route('/')
    .get(getAllTrackers)       // GET /api/tracker - Get all tracker entries
    .post(createOrUpdateTracker); // POST /api/tracker - Create or update tracker

// Statistics route
router.get('/stats/summary', getTrackerStats); // GET /api/tracker/stats/summary

// Date-specific routes
router.route('/:date')
    .get(getTrackerByDate)     // GET /api/tracker/:date - Get entry for specific date
    .delete(deleteTracker);    // DELETE /api/tracker/:date - Delete entry

module.exports = router;
