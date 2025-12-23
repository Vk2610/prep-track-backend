const express = require('express');
const router = express.Router();
const {
    createSoftSkill,
    getAllSoftSkills,
    getSoftSkillById,
    updateSoftSkill,
    deleteSoftSkill,
    getSoftSkillsStats
} = require('../controllers/softSkillsController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected (require authentication)
router.use(protect);

// Statistics route (must be before /:id route)
router.get('/stats/summary', getSoftSkillsStats);

// Main soft skills routes
router.route('/')
    .get(getAllSoftSkills)      // GET /api/softskills - Get all entries
    .post(createSoftSkill);     // POST /api/softskills - Create new entry

// ID-specific routes
router.route('/:id')
    .get(getSoftSkillById)      // GET /api/softskills/:id - Get single entry
    .put(updateSoftSkill)       // PUT /api/softskills/:id - Update entry
    .delete(deleteSoftSkill);   // DELETE /api/softskills/:id - Delete entry

module.exports = router;
