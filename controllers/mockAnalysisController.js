const MockAnalysis = require('../models/MockAnalysis');
const MockTracker = require('../models/MockTracker');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Create a new mock analysis entry
 * @route   POST /api/analysis
 * @access  Private
 */
exports.createAnalysis = asyncHandler(async (req, res) => {
    const {
        mockId,
        section,
        questionNo,
        attempted,
        correct,
        errorType,
        whyWrong,
        correctApproach,
        actionItem
    } = req.body;

    // Validate required fields
    if (!mockId || !section || !questionNo) {
        return res.status(400).json({
            success: false,
            message: 'Please provide mockId, section, and questionNo'
        });
    }

    // Verify mock exists and belongs to user
    const mock = await MockTracker.findOne({
        _id: mockId,
        userId: req.user._id
    });

    if (!mock) {
        return res.status(404).json({
            success: false,
            message: 'Mock test not found or does not belong to you'
        });
    }

    // Create analysis entry
    const analysis = await MockAnalysis.create({
        userId: req.user._id,
        mockId,
        section,
        questionNo,
        attempted: attempted !== undefined ? attempted : false,
        correct: correct !== undefined ? correct : false,
        errorType: errorType || '',
        whyWrong: whyWrong || '',
        correctApproach: correctApproach || '',
        actionItem: actionItem || ''
    });

    res.status(201).json({
        success: true,
        message: 'Mock analysis entry created successfully',
        data: analysis
    });
});

/**
 * @desc    Get all analysis entries for a specific mock
 * @route   GET /api/analysis/mock/:mockId
 * @access  Private
 */
exports.getAnalysisByMock = asyncHandler(async (req, res) => {
    const { mockId } = req.params;
    const { section, errorType } = req.query;

    // Verify mock exists and belongs to user
    const mock = await MockTracker.findOne({
        _id: mockId,
        userId: req.user._id
    });

    if (!mock) {
        return res.status(404).json({
            success: false,
            message: 'Mock test not found or does not belong to you'
        });
    }

    // Build query
    const query = {
        userId: req.user._id,
        mockId
    };

    // Add filters
    if (section) {
        query.section = section.toUpperCase();
    }

    if (errorType) {
        query.errorType = errorType;
    }

    // Fetch analysis entries
    const analyses = await MockAnalysis.find(query).sort({ section: 1, questionNo: 1 });

    res.status(200).json({
        success: true,
        count: analyses.length,
        mockName: mock.name,
        data: analyses
    });
});

/**
 * @desc    Get all analysis entries for logged-in user
 * @route   GET /api/analysis
 * @access  Private
 */
exports.getAllAnalysis = asyncHandler(async (req, res) => {
    const { section, errorType, limit = 100 } = req.query;

    // Build query
    const query = { userId: req.user._id };

    // Add filters
    if (section) {
        query.section = section.toUpperCase();
    }

    if (errorType) {
        query.errorType = errorType;
    }

    // Fetch analysis entries
    const analyses = await MockAnalysis.find(query)
        .populate('mockId', 'name date')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

    res.status(200).json({
        success: true,
        count: analyses.length,
        data: analyses
    });
});

/**
 * @desc    Get single analysis entry by ID
 * @route   GET /api/analysis/:id
 * @access  Private
 */
exports.getAnalysisById = asyncHandler(async (req, res) => {
    const analysis = await MockAnalysis.findOne({
        _id: req.params.id,
        userId: req.user._id
    }).populate('mockId', 'name date');

    if (!analysis) {
        return res.status(404).json({
            success: false,
            message: 'Analysis entry not found'
        });
    }

    res.status(200).json({
        success: true,
        data: analysis
    });
});

/**
 * @desc    Update an analysis entry
 * @route   PUT /api/analysis/:id
 * @access  Private
 */
exports.updateAnalysis = asyncHandler(async (req, res) => {
    let analysis = await MockAnalysis.findOne({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!analysis) {
        return res.status(404).json({
            success: false,
            message: 'Analysis entry not found'
        });
    }

    // Update fields
    const {
        section,
        questionNo,
        attempted,
        correct,
        errorType,
        whyWrong,
        correctApproach,
        actionItem
    } = req.body;

    if (section !== undefined) analysis.section = section;
    if (questionNo !== undefined) analysis.questionNo = questionNo;
    if (attempted !== undefined) analysis.attempted = attempted;
    if (correct !== undefined) analysis.correct = correct;
    if (errorType !== undefined) analysis.errorType = errorType;
    if (whyWrong !== undefined) analysis.whyWrong = whyWrong;
    if (correctApproach !== undefined) analysis.correctApproach = correctApproach;
    if (actionItem !== undefined) analysis.actionItem = actionItem;

    await analysis.save();

    res.status(200).json({
        success: true,
        message: 'Analysis entry updated successfully',
        data: analysis
    });
});

/**
 * @desc    Delete an analysis entry
 * @route   DELETE /api/analysis/:id
 * @access  Private
 */
exports.deleteAnalysis = asyncHandler(async (req, res) => {
    const analysis = await MockAnalysis.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!analysis) {
        return res.status(404).json({
            success: false,
            message: 'Analysis entry not found'
        });
    }

    res.status(200).json({
        success: true,
        message: 'Analysis entry deleted successfully',
        data: analysis
    });
});

/**
 * @desc    Delete all analysis entries for a specific mock
 * @route   DELETE /api/analysis/mock/:mockId
 * @access  Private
 */
exports.deleteAnalysisByMock = asyncHandler(async (req, res) => {
    const { mockId } = req.params;

    // Verify mock belongs to user
    const mock = await MockTracker.findOne({
        _id: mockId,
        userId: req.user._id
    });

    if (!mock) {
        return res.status(404).json({
            success: false,
            message: 'Mock test not found or does not belong to you'
        });
    }

    // Delete all analysis entries for this mock
    const result = await MockAnalysis.deleteMany({
        mockId,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        message: `Deleted ${result.deletedCount} analysis entries`,
        deletedCount: result.deletedCount
    });
});

/**
 * @desc    Get analysis statistics for a specific mock
 * @route   GET /api/analysis/mock/:mockId/stats
 * @access  Private
 */
exports.getMockAnalysisStats = asyncHandler(async (req, res) => {
    const { mockId } = req.params;

    // Verify mock belongs to user
    const mock = await MockTracker.findOne({
        _id: mockId,
        userId: req.user._id
    });

    if (!mock) {
        return res.status(404).json({
            success: false,
            message: 'Mock test not found or does not belong to you'
        });
    }

    // Fetch all analysis entries for this mock
    const analyses = await MockAnalysis.find({
        mockId,
        userId: req.user._id
    });

    // Calculate statistics by section
    const sectionStats = {};
    ['VARC', 'LRDI', 'QA'].forEach(section => {
        const sectionData = analyses.filter(a => a.section === section);
        const attempted = sectionData.filter(a => a.attempted).length;
        const correct = sectionData.filter(a => a.correct).length;

        sectionStats[section] = {
            total: sectionData.length,
            attempted,
            correct,
            incorrect: attempted - correct,
            accuracy: attempted > 0 ? ((correct / attempted) * 100).toFixed(2) : 0
        };
    });

    // Error type distribution
    const errorDistribution = {};
    ['Concept', 'Calculation', 'Selection', 'Panic', 'Time'].forEach(type => {
        errorDistribution[type] = analyses.filter(a => a.errorType === type).length;
    });

    // Overall stats
    const totalQuestions = analyses.length;
    const totalAttempted = analyses.filter(a => a.attempted).length;
    const totalCorrect = analyses.filter(a => a.correct).length;

    res.status(200).json({
        success: true,
        mockName: mock.name,
        data: {
            overall: {
                total: totalQuestions,
                attempted: totalAttempted,
                correct: totalCorrect,
                incorrect: totalAttempted - totalCorrect,
                accuracy: totalAttempted > 0 ? ((totalCorrect / totalAttempted) * 100).toFixed(2) : 0
            },
            bySection: sectionStats,
            errorDistribution
        }
    });
});
