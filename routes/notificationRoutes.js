const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    readAll
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', readAll);
router.patch('/:id/read', markAsRead);

module.exports = router;
