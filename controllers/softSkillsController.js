const SoftSkills = require('../models/SoftSkills');
const asyncHandler = require('../utils/asyncHandler');
const { validateEnum, validateDuration, validateRating, validateStringLength, validateDate } = require('../utils/validators');

/**
 * @desc    Create a new soft skill entry
 * @route   POST /api/softskills
 * @access  Private
 */
exports.createSoftSkill = asyncHandler(async (req, res) => {
    const { type, topic, duration, rating, note, date } = req.body;

    // Validate required fields
    if (!type || !topic || !duration || !rating || !date) {
        return res.status(400).json({
            success: false,
            message: 'Please provide all required fields: type, topic, duration, rating, and date'
        });
    }

    // Validate type enum
    const validTypes = ['Essay', 'GD', 'Extempore', 'Interview', 'Presentation', 'Structured Thinking'];
    const typeValidation = validateEnum(type, validTypes, 'type');
    if (!typeValidation.valid) {
        return res.status(400).json({
            success: false,
            message: typeValidation.message
        });
    }

    // Validate topic
    if (typeof topic !== 'string' || topic.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Topic is required and must be a non-empty string'
        });
    }

    const topicLengthValidation = validateStringLength(topic, 200, 'Topic');
    if (!topicLengthValidation.valid) {
        return res.status(400).json({
            success: false,
            message: topicLengthValidation.message
        });
    }

    // Validate duration
    const durationValidation = validateDuration(duration);
    if (!durationValidation.valid) {
        return res.status(400).json({
            success: false,
            message: durationValidation.message
        });
    }

    // Validate rating
    const ratingValidation = validateRating(rating);
    if (!ratingValidation.valid) {
        return res.status(400).json({
            success: false,
            message: ratingValidation.message
        });
    }

    // Validate note if provided
    if (note) {
        const noteLengthValidation = validateStringLength(note, 1000, 'Note');
        if (!noteLengthValidation.valid) {
            return res.status(400).json({
                success: false,
                message: noteLengthValidation.message
            });
        }
    }

    // Validate date
    const dateValidation = validateDate(date, true);
    if (!dateValidation.valid) {
        return res.status(400).json({
            success: false,
            message: dateValidation.message
        });
    }

    // Create soft skill entry
    const softSkill = await SoftSkills.create({
        userId: req.user._id,
        type,
        topic: topic.trim(),
        duration: durationValidation.value,
        rating: ratingValidation.value,
        note: note ? note.trim() : '',
        date: dateValidation.value
    });

    res.status(201).json({
        success: true,
        message: 'Soft skill entry created successfully',
        data: softSkill
    });
});

/**
 * @desc    Get all soft skill entries for logged-in user
 * @route   GET /api/softskills
 * @access  Private
 */
exports.getAllSoftSkills = asyncHandler(async (req, res) => {
    const { startDate, endDate, type, limit = 50 } = req.query;

    // Build query
    const query = { userId: req.user._id };

    // Add type filter if provided
    if (type) {
        query.type = type;
    }

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

    // Fetch soft skills, sorted by date (newest first)
    const softSkills = await SoftSkills.find(query)
        .sort({ date: -1 })
        .limit(parseInt(limit));

    res.status(200).json({
        success: true,
        count: softSkills.length,
        data: softSkills
    });
});

/**
 * @desc    Get a single soft skill entry by ID
 * @route   GET /api/softskills/:id
 * @access  Private
 */
exports.getSoftSkillById = asyncHandler(async (req, res) => {
    const softSkill = await SoftSkills.findOne({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!softSkill) {
        return res.status(404).json({
            success: false,
            message: 'Soft skill entry not found'
        });
    }

    res.status(200).json({
        success: true,
        data: softSkill
    });
});

/**
 * @desc    Update a soft skill entry
 * @route   PUT /api/softskills/:id
 * @access  Private
 */
exports.updateSoftSkill = asyncHandler(async (req, res) => {
    let softSkill = await SoftSkills.findOne({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!softSkill) {
        return res.status(404).json({
            success: false,
            message: 'Soft skill entry not found'
        });
    }

    const { type, topic, duration, rating, note, date } = req.body;

    // Validate and update fields
    if (type !== undefined) {
        const validTypes = ['Essay', 'GD', 'Extempore', 'Interview', 'Presentation', 'Structured Thinking'];
        const typeValidation = validateEnum(type, validTypes, 'type');
        if (!typeValidation.valid) {
            return res.status(400).json({ success: false, message: typeValidation.message });
        }
        softSkill.type = type;
    }

    if (topic !== undefined) {
        if (typeof topic !== 'string' || topic.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Topic must be a non-empty string'
            });
        }
        const topicLengthValidation = validateStringLength(topic, 200, 'Topic');
        if (!topicLengthValidation.valid) {
            return res.status(400).json({ success: false, message: topicLengthValidation.message });
        }
        softSkill.topic = topic.trim();
    }

    if (duration !== undefined) {
        const durationValidation = validateDuration(duration);
        if (!durationValidation.valid) {
            return res.status(400).json({ success: false, message: durationValidation.message });
        }
        softSkill.duration = durationValidation.value;
    }

    if (rating !== undefined) {
        const ratingValidation = validateRating(rating);
        if (!ratingValidation.valid) {
            return res.status(400).json({ success: false, message: ratingValidation.message });
        }
        softSkill.rating = ratingValidation.value;
    }

    if (note !== undefined) {
        const noteLengthValidation = validateStringLength(note, 1000, 'Note');
        if (!noteLengthValidation.valid) {
            return res.status(400).json({ success: false, message: noteLengthValidation.message });
        }
        softSkill.note = note.trim();
    }

    if (date !== undefined) {
        const dateValidation = validateDate(date, true);
        if (!dateValidation.valid) {
            return res.status(400).json({ success: false, message: dateValidation.message });
        }
        softSkill.date = dateValidation.value;
    }

    await softSkill.save();

    res.status(200).json({
        success: true,
        message: 'Soft skill entry updated successfully',
        data: softSkill
    });
});

/**
 * @desc    Delete a soft skill entry
 * @route   DELETE /api/softskills/:id
 * @access  Private
 */
exports.deleteSoftSkill = asyncHandler(async (req, res) => {
    const softSkill = await SoftSkills.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!softSkill) {
        return res.status(404).json({
            success: false,
            message: 'Soft skill entry not found'
        });
    }

    res.status(200).json({
        success: true,
        message: 'Soft skill entry deleted successfully',
        data: softSkill
    });
});

/**
 * @desc    Get soft skill statistics
 * @route   GET /api/softskills/stats/summary
 * @access  Private
 */
exports.getSoftSkillsStats = asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;

    // Calculate date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    // Fetch soft skills in date range
    const softSkills = await SoftSkills.find({
        userId: req.user._id,
        date: { $gte: startDate, $lte: endDate }
    });

    // Calculate statistics
    const totalEntries = softSkills.length;

    // Count by type
    const typeDistribution = {
        Essay: softSkills.filter(s => s.type === 'Essay').length,
        GD: softSkills.filter(s => s.type === 'GD').length,
        Extempore: softSkills.filter(s => s.type === 'Extempore').length,
        Interview: softSkills.filter(s => s.type === 'Interview').length,
        Presentation: softSkills.filter(s => s.type === 'Presentation').length,
        'Structured Thinking': softSkills.filter(s => s.type === 'Structured Thinking').length
    };

    // Average rating
    const avgRating = totalEntries > 0
        ? (softSkills.reduce((sum, s) => sum + s.rating, 0) / totalEntries).toFixed(2)
        : 0;

    // Total practice time in minutes
    const totalMinutes = softSkills.reduce((sum, s) => sum + s.duration, 0);

    const stats = {
        totalEntries,
        typeDistribution,
        averageRating: parseFloat(avgRating),
        totalPracticeMinutes: totalMinutes,
        totalPracticeHours: (totalMinutes / 60).toFixed(2)
    };

    res.status(200).json({
        success: true,
        period: `Last ${days} days`,
        data: stats
    });
});
