const express = require('express');
const router = express.Router();
const { getAiResponse } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

/**
 * @route   POST /api/ai/chat
 * @desc    Get AI response for user chat
 * @access  Private
 */
router.post('/chat', getAiResponse);

module.exports = router;
