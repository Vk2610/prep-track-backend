const MockTracker = require('../models/MockTracker');
const asyncHandler = require('../utils/asyncHandler');
const { validateScore, validatePercentile, validateEnum, validateDate } = require('../utils/validators');

/**
 * @desc    Create a new mock test entry
 * @route   POST /api/mock
 * @access  Private
 */
exports.createMock = asyncHandler(async (req, res) => {
    const { name, date, slot, scores, percentile, mood } = req.body;

    // Validate required fields
    if (!name || !date || !slot || !scores || percentile === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Please provide all required fields: name, date, slot, scores, and percentile'
        });
    }

    // Validate name
    if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Mock test name is required and must be a non-empty string'
        });
    }

    if (name.length > 100) {
        return res.status(400).json({
            success: false,
            message: 'Mock test name cannot exceed 100 characters'
        });
    }

    // Validate date
    const dateValidation = validateDate(date, true);
    if (!dateValidation.valid) {
        return res.status(400).json({
            success: false,
            message: dateValidation.message
        });
    }

    // Validate slot enum
    const validSlots = ['morning', 'afternoon', 'evening', 'night'];
    const slotValidation = validateEnum(slot.toLowerCase(), validSlots, 'slot');
    if (!slotValidation.valid) {
        return res.status(400).json({
            success: false,
            message: slotValidation.message
        });
    }

    // Validate scores object
    if (!scores || typeof scores !== 'object') {
        return res.status(400).json({
            success: false,
            message: 'Scores must be an object containing varc, lrdi, and qa'
        });
    }

    // Validate individual scores
    const varcValidation = validateScore(scores.varc, 'VARC score');
    if (!varcValidation.valid) {
        return res.status(400).json({ success: false, message: varcValidation.message });
    }

    const lrdiValidation = validateScore(scores.lrdi, 'LRDI score');
    if (!lrdiValidation.valid) {
        return res.status(400).json({ success: false, message: lrdiValidation.message });
    }

    const qaValidation = validateScore(scores.qa, 'QA score');
    if (!qaValidation.valid) {
        return res.status(400).json({ success: false, message: qaValidation.message });
    }

    // Validate percentile
    const percentileValidation = validatePercentile(percentile);
    if (!percentileValidation.valid) {
        return res.status(400).json({ success: false, message: percentileValidation.message });
    }

    // Validate mood if provided
    const validMoods = ['excellent', 'good', 'okay', 'bad', 'terrible', ''];
    if (mood !== undefined) {
        const moodValidation = validateEnum(mood, validMoods, 'mood');
        if (!moodValidation.valid) {
            return res.status(400).json({ success: false, message: moodValidation.message });
        }
    }

    // Create mock entry
    const mock = await MockTracker.create({
        userId: req.user._id,
        name: name.trim(),
        date: dateValidation.value,
        slot: slot.toLowerCase(),
        scores: {
            varc: varcValidation.value,
            lrdi: lrdiValidation.value,
            qa: qaValidation.value
        },
        percentile: percentileValidation.value,
        mood: mood || ''
    });

    res.status(201).json({
        success: true,
        message: 'Mock test entry created successfully',
        data: mock
    });
});

/**
 * @desc    Get all mock test entries for logged-in user
 * @route   GET /api/mock
 * @access  Private
 */
exports.getAllMocks = asyncHandler(async (req, res) => {
    const { startDate, endDate, limit = 50, sort = '-date' } = req.query;

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

    // Fetch mocks, sorted by date (newest first by default)
    const mocks = await MockTracker.find(query)
        .sort(sort)
        .limit(parseInt(limit));

    res.status(200).json({
        success: true,
        count: mocks.length,
        data: mocks
    });
});

/**
 * @desc    Get a single mock test entry by ID
 * @route   GET /api/mock/:id
 * @access  Private
 */
exports.getMockById = asyncHandler(async (req, res) => {
    const mock = await MockTracker.findOne({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!mock) {
        return res.status(404).json({
            success: false,
            message: 'Mock test entry not found'
        });
    }

    res.status(200).json({
        success: true,
        data: mock
    });
});

/**
 * @desc    Update a mock test entry
 * @route   PUT /api/mock/:id
 * @access  Private
 */
exports.updateMock = asyncHandler(async (req, res) => {
    let mock = await MockTracker.findOne({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!mock) {
        return res.status(404).json({
            success: false,
            message: 'Mock test entry not found'
        });
    }

    const { name, date, slot, scores, percentile, mood } = req.body;

    // Validate and update fields
    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Mock test name must be a non-empty string and cannot exceed 100 characters'
            });
        }
        mock.name = name.trim();
    }

    if (date !== undefined) {
        const dateValidation = validateDate(date, true);
        if (!dateValidation.valid) {
            return res.status(400).json({ success: false, message: dateValidation.message });
        }
        mock.date = dateValidation.value;
    }

    if (slot !== undefined) {
        const validSlots = ['morning', 'afternoon', 'evening', 'night'];
        const slotValidation = validateEnum(slot.toLowerCase(), validSlots, 'slot');
        if (!slotValidation.valid) {
            return res.status(400).json({ success: false, message: slotValidation.message });
        }
        mock.slot = slot.toLowerCase();
    }

    if (percentile !== undefined) {
        const percentileValidation = validatePercentile(percentile);
        if (!percentileValidation.valid) {
            return res.status(400).json({ success: false, message: percentileValidation.message });
        }
        mock.percentile = percentileValidation.value;
    }

    if (mood !== undefined) {
        const validMoods = ['excellent', 'good', 'okay', 'bad', 'terrible', ''];
        const moodValidation = validateEnum(mood, validMoods, 'mood');
        if (!moodValidation.valid) {
            return res.status(400).json({ success: false, message: moodValidation.message });
        }
        mock.mood = mood;
    }

    // Update scores if provided
    if (scores) {
        if (scores.varc !== undefined) {
            const varcValidation = validateScore(scores.varc, 'VARC score');
            if (!varcValidation.valid) {
                return res.status(400).json({ success: false, message: varcValidation.message });
            }
            mock.scores.varc = varcValidation.value;
        }
        if (scores.lrdi !== undefined) {
            const lrdiValidation = validateScore(scores.lrdi, 'LRDI score');
            if (!lrdiValidation.valid) {
                return res.status(400).json({ success: false, message: lrdiValidation.message });
            }
            mock.scores.lrdi = lrdiValidation.value;
        }
        if (scores.qa !== undefined) {
            const qaValidation = validateScore(scores.qa, 'QA score');
            if (!qaValidation.valid) {
                return res.status(400).json({ success: false, message: qaValidation.message });
            }
            mock.scores.qa = qaValidation.value;
        }
    }

    await mock.save();

    res.status(200).json({
        success: true,
        message: 'Mock test entry updated successfully',
        data: mock
    });
});

/**
 * @desc    Delete a mock test entry
 * @route   DELETE /api/mock/:id
 * @access  Private
 */
exports.deleteMock = asyncHandler(async (req, res) => {
    const mock = await MockTracker.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!mock) {
        return res.status(404).json({
            success: false,
            message: 'Mock test entry not found'
        });
    }

    res.status(200).json({
        success: true,
        message: 'Mock test entry deleted successfully',
        data: mock
    });
});

/**
 * @desc    Get mock test statistics
 * @route   GET /api/mock/stats/summary
 * @access  Private
 */
exports.getMockStats = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    // Fetch recent mocks
    const mocks = await MockTracker.find({ userId: req.user._id })
        .sort({ date: -1 })
        .limit(parseInt(limit));

    if (mocks.length === 0) {
        return res.status(200).json({
            success: true,
            message: 'No mock tests found',
            data: {
                totalMocks: 0,
                averageTotal: 0,
                averagePercentile: 0,
                averageScores: { varc: 0, lrdi: 0, qa: 0 },
                highestScore: 0,
                lowestScore: 0,
                highestPercentile: 0,
                lowestPercentile: 0
            }
        });
    }

    // Calculate statistics
    const totalMocks = mocks.length;
    const totalSum = mocks.reduce((sum, mock) => sum + mock.total, 0);
    const percentileSum = mocks.reduce((sum, mock) => sum + mock.percentile, 0);

    const varcSum = mocks.reduce((sum, mock) => sum + mock.scores.varc, 0);
    const lrdiSum = mocks.reduce((sum, mock) => sum + mock.scores.lrdi, 0);
    const qaSum = mocks.reduce((sum, mock) => sum + mock.scores.qa, 0);

    const stats = {
        totalMocks,
        averageTotal: (totalSum / totalMocks).toFixed(2),
        averagePercentile: (percentileSum / totalMocks).toFixed(2),
        averageScores: {
            varc: (varcSum / totalMocks).toFixed(2),
            lrdi: (lrdiSum / totalMocks).toFixed(2),
            qa: (qaSum / totalMocks).toFixed(2)
        },
        highestScore: Math.max(...mocks.map(m => m.total)),
        lowestScore: Math.min(...mocks.map(m => m.total)),
        highestPercentile: Math.max(...mocks.map(m => m.percentile)),
        lowestPercentile: Math.min(...mocks.map(m => m.percentile)),
        recentMocks: mocks.slice(0, 5).map(m => ({
            name: m.name,
            date: m.date,
            total: m.total,
            percentile: m.percentile
        }))
    };

    res.status(200).json({
        success: true,
        period: `Last ${limit} mocks`,
        data: stats
    });
});
