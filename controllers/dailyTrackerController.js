const DailyTracker = require('../models/DailyTracker');
const asyncHandler = require('../utils/asyncHandler');
const { validateDate, validateEnum, validateBoolean } = require('../utils/validators');

/**
 * @desc    Create or update daily tracker entry
 * @route   POST /api/tracker
 * @access  Private
 */
exports.createOrUpdateTracker = asyncHandler(async (req, res) => {
    const { date, quant, lrdi, varc, softSkill, exercise, gaming, mood } = req.body;

    // Validate date
    const dateValidation = validateDate(date, false);
    if (!dateValidation.valid) {
        return res.status(400).json({
            success: false,
            message: dateValidation.message
        });
    }

    // Validate boolean fields
    const boolFields = { quant, lrdi, varc, softSkill, exercise, gaming };
    for (const [field, value] of Object.entries(boolFields)) {
        const validation = validateBoolean(value, field);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }
    }

    // Validate mood enum
    const validMoods = ['excellent', 'good', 'okay', 'bad', 'terrible', ''];
    if (mood !== undefined) {
        const moodValidation = validateEnum(mood, validMoods, 'mood');
        if (!moodValidation.valid) {
            return res.status(400).json({
                success: false,
                message: moodValidation.message
            });
        }
    }

    // Normalize date to midnight UTC
    const trackerDate = dateValidation.value;
    trackerDate.setUTCHours(0, 0, 0, 0);

    // Check if entry already exists for this user and date
    let tracker = await DailyTracker.findOne({
        userId: req.user._id,
        date: trackerDate
    });

    if (tracker) {
        // Update existing entry
        tracker.quant = quant !== undefined ? quant : tracker.quant;
        tracker.lrdi = lrdi !== undefined ? lrdi : tracker.lrdi;
        tracker.varc = varc !== undefined ? varc : tracker.varc;
        tracker.softSkill = softSkill !== undefined ? softSkill : tracker.softSkill;
        tracker.exercise = exercise !== undefined ? exercise : tracker.exercise;
        tracker.gaming = gaming !== undefined ? gaming : tracker.gaming;
        tracker.mood = mood !== undefined ? mood : tracker.mood;

        await tracker.save();

        return res.status(200).json({
            success: true,
            message: 'Daily tracker updated successfully',
            data: tracker
        });
    }

    // Create new entry
    tracker = await DailyTracker.create({
        userId: req.user._id,
        date: trackerDate,
        quant: quant || false,
        lrdi: lrdi || false,
        varc: varc || false,
        softSkill: softSkill || false,
        exercise: exercise || false,
        gaming: gaming || false,
        mood: mood || ''
    });

    res.status(201).json({
        success: true,
        message: 'Daily tracker created successfully',
        data: tracker
    });
});

/**
 * @desc    Get all tracker entries for logged-in user
 * @route   GET /api/tracker
 * @access  Private
 */
exports.getAllTrackers = asyncHandler(async (req, res) => {
    const { startDate, endDate, limit = 30 } = req.query;

    // Build query
    const query = { userId: req.user._id };

    // Add date range filter if provided
    if (startDate || endDate) {
        query.date = {};
        if (startDate) {
            query.date.$gte = new Date(startDate);
        }
        if (endDate) {
            query.date.$lte = new Date(endDate);
        }
    }

    // Fetch trackers, sorted by date (newest first)
    const trackers = await DailyTracker.find(query)
        .sort({ date: -1 })
        .limit(parseInt(limit));

    res.status(200).json({
        success: true,
        count: trackers.length,
        data: trackers
    });
});

/**
 * @desc    Get tracker entry for a specific date
 * @route   GET /api/tracker/:date
 * @access  Private
 */
exports.getTrackerByDate = asyncHandler(async (req, res) => {
    const { date } = req.params;

    // Parse and normalize date
    const trackerDate = new Date(date);
    trackerDate.setUTCHours(0, 0, 0, 0);

    const tracker = await DailyTracker.findOne({
        userId: req.user._id,
        date: trackerDate
    });

    if (!tracker) {
        return res.status(404).json({
            success: false,
            message: 'No tracker entry found for this date'
        });
    }

    res.status(200).json({
        success: true,
        data: tracker
    });
});

/**
 * @desc    Delete tracker entry for a specific date
 * @route   DELETE /api/tracker/:date
 * @access  Private
 */
exports.deleteTracker = asyncHandler(async (req, res) => {
    const { date } = req.params;

    // Parse and normalize date
    const trackerDate = new Date(date);
    trackerDate.setUTCHours(0, 0, 0, 0);

    const tracker = await DailyTracker.findOneAndDelete({
        userId: req.user._id,
        date: trackerDate
    });

    if (!tracker) {
        return res.status(404).json({
            success: false,
            message: 'No tracker entry found for this date'
        });
    }

    res.status(200).json({
        success: true,
        message: 'Tracker entry deleted successfully',
        data: tracker
    });
});

/**
 * @desc    Get tracker statistics for logged-in user
 * @route   GET /api/tracker/stats/summary
 * @access  Private
 */
exports.getTrackerStats = asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;

    // Calculate date range (last N days)
    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setUTCHours(0, 0, 0, 0);

    // Fetch trackers in date range
    const trackers = await DailyTracker.find({
        userId: req.user._id,
        date: { $gte: startDate, $lte: endDate }
    });

    // Calculate statistics
    const stats = {
        totalEntries: trackers.length,
        quant: trackers.filter(t => t.quant).length,
        lrdi: trackers.filter(t => t.lrdi).length,
        varc: trackers.filter(t => t.varc).length,
        softSkill: trackers.filter(t => t.softSkill).length,
        exercise: trackers.filter(t => t.exercise).length,
        gaming: trackers.filter(t => t.gaming).length,
        moodDistribution: {
            excellent: trackers.filter(t => t.mood === 'excellent').length,
            good: trackers.filter(t => t.mood === 'good').length,
            okay: trackers.filter(t => t.mood === 'okay').length,
            bad: trackers.filter(t => t.mood === 'bad').length,
            terrible: trackers.filter(t => t.mood === 'terrible').length
        }
    };

    res.status(200).json({
        success: true,
        period: `Last ${days} days`,
        data: stats
    });
});
