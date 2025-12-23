const express = require('express');
const router = express.Router();
const {
    createMock,
    getAllMocks,
    getMockById,
    updateMock,
    deleteMock,
    getMockStats
} = require('../controllers/mockTrackerController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected (require authentication)
router.use(protect);

// Statistics route (must be before /:id route)
router.get('/stats/summary', getMockStats);

// Main mock routes
router.route('/')
    .get(getAllMocks)     // GET /api/mock - Get all mock entries
    .post(createMock);    // POST /api/mock - Create new mock entry

// ID-specific routes
router.route('/:id')
    .get(getMockById)     // GET /api/mock/:id - Get single mock entry
    .put(updateMock)      // PUT /api/mock/:id - Update mock entry
    .delete(deleteMock);  // DELETE /api/mock/:id - Delete mock entry

module.exports = router;
