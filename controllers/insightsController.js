const MockTracker = require('../models/MockTracker');
const MockAnalysis = require('../models/MockAnalysis');
const DailyTracker = require('../models/DailyTracker');
const SoftSkills = require('../models/SoftSkills');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get comprehensive dashboard insights
 * @route   GET /api/insights/dashboard
 * @access  Private
 */
exports.getDashboardInsights = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { days = 30 } = req.query;

    // Calculate date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    // Fetch data in parallel
    const [mocks, mockAnalyses, dailyTrackers, softSkills] = await Promise.all([
        MockTracker.find({
            userId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: -1 }),
        MockAnalysis.find({ userId }),
        DailyTracker.find({
            userId,
            date: { $gte: startDate, $lte: endDate }
        }),
        SoftSkills.find({
            userId,
            date: { $gte: startDate, $lte: endDate }
        })
    ]);

    // Calculate insights
    const insights = {
        overview: calculateOverview(mocks, dailyTrackers, softSkills),
        weakestSection: calculateWeakestSection(mocks),
        mostCommonError: calculateMostCommonError(mockAnalyses),
        accuracyTrend: calculateAccuracyTrend(mockAnalyses, mocks),
        performancePatterns: calculatePerformancePatterns(mocks),
        recommendations: generateRecommendations(mocks, dailyTrackers, mockAnalyses)
    };

    res.status(200).json({
        success: true,
        period: `Last ${days} days`,
        data: insights
    });
});

/**
 * Calculate overview statistics
 */
const calculateOverview = (mocks, dailyTrackers, softSkills) => {
    const totalMocks = mocks.length;
    const totalDailyEntries = dailyTrackers.length;
    const totalSoftSkills = softSkills.length;

    const avgPercentile = totalMocks > 0
        ? (mocks.reduce((sum, m) => sum + m.percentile, 0) / totalMocks).toFixed(2)
        : 0;

    const avgTotal = totalMocks > 0
        ? (mocks.reduce((sum, m) => sum + m.total, 0) / totalMocks).toFixed(2)
        : 0;

    return {
        totalMocks,
        totalDailyEntries,
        totalSoftSkills,
        averagePercentile: parseFloat(avgPercentile),
        averageTotal: parseFloat(avgTotal)
    };
};

/**
 * Calculate weakest section from last 5 mocks
 */
const calculateWeakestSection = (mocks) => {
    if (mocks.length === 0) {
        return {
            section: null,
            averageScore: 0,
            message: 'No mock data available'
        };
    }

    const last5Mocks = mocks.slice(0, 5);

    const sectionAverages = {
        VARC: last5Mocks.reduce((sum, m) => sum + m.scores.varc, 0) / last5Mocks.length,
        LRDI: last5Mocks.reduce((sum, m) => sum + m.scores.lrdi, 0) / last5Mocks.length,
        QA: last5Mocks.reduce((sum, m) => sum + m.scores.qa, 0) / last5Mocks.length
    };

    const weakestSection = Object.entries(sectionAverages)
        .sort((a, b) => a[1] - b[1])[0];

    return {
        section: weakestSection[0],
        averageScore: parseFloat(weakestSection[1].toFixed(2)),
        allSectionAverages: {
            VARC: parseFloat(sectionAverages.VARC.toFixed(2)),
            LRDI: parseFloat(sectionAverages.LRDI.toFixed(2)),
            QA: parseFloat(sectionAverages.QA.toFixed(2))
        },
        message: `${weakestSection[0]} needs attention with an average score of ${weakestSection[1].toFixed(2)}`
    };
};

/**
 * Calculate most common error type
 */
const calculateMostCommonError = (mockAnalyses) => {
    if (mockAnalyses.length === 0) {
        return {
            errorType: null,
            count: 0,
            percentage: 0,
            message: 'No analysis data available'
        };
    }

    // Filter only incorrect answers with error types
    const incorrectAnswers = mockAnalyses.filter(
        a => !a.correct && a.errorType && a.errorType !== ''
    );

    if (incorrectAnswers.length === 0) {
        return {
            errorType: null,
            count: 0,
            percentage: 0,
            message: 'All answers are correct or no error types logged'
        };
    }

    // Count error types
    const errorCounts = incorrectAnswers.reduce((acc, analysis) => {
        acc[analysis.errorType] = (acc[analysis.errorType] || 0) + 1;
        return acc;
    }, {});

    // Find most common
    const mostCommon = Object.entries(errorCounts)
        .sort((a, b) => b[1] - a[1])[0];

    const percentage = ((mostCommon[1] / incorrectAnswers.length) * 100).toFixed(1);

    return {
        errorType: mostCommon[0],
        count: mostCommon[1],
        percentage: parseFloat(percentage),
        totalErrors: incorrectAnswers.length,
        distribution: errorCounts,
        message: `${mostCommon[0]} errors are most common (${percentage}% of mistakes)`
    };
};

/**
 * Calculate accuracy trend over time
 */
const calculateAccuracyTrend = (mockAnalyses, mocks) => {
    if (mocks.length === 0 || mockAnalyses.length === 0) {
        return {
            trend: 'stable',
            currentAccuracy: 0,
            previousAccuracy: 0,
            change: 0,
            message: 'Not enough data to calculate trend'
        };
    }

    // Group analyses by mock
    const mockAccuracies = mocks.map(mock => {
        const mockQuestions = mockAnalyses.filter(
            a => a.mockId.toString() === mock._id.toString()
        );

        if (mockQuestions.length === 0) return null;

        const attempted = mockQuestions.filter(q => q.attempted).length;
        const correct = mockQuestions.filter(q => q.correct).length;

        return {
            mockId: mock._id,
            date: mock.date,
            accuracy: attempted > 0 ? (correct / attempted) * 100 : 0,
            attempted,
            correct
        };
    }).filter(Boolean).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (mockAccuracies.length < 2) {
        return {
            trend: 'stable',
            currentAccuracy: mockAccuracies[0]?.accuracy.toFixed(2) || 0,
            previousAccuracy: 0,
            change: 0,
            message: 'Need at least 2 mocks with analysis data for trend'
        };
    }

    // Calculate trend (last 3 vs previous 3)
    const recentMocks = mockAccuracies.slice(-3);
    const previousMocks = mockAccuracies.slice(-6, -3);

    const recentAvg = recentMocks.reduce((sum, m) => sum + m.accuracy, 0) / recentMocks.length;
    const previousAvg = previousMocks.length > 0
        ? previousMocks.reduce((sum, m) => sum + m.accuracy, 0) / previousMocks.length
        : recentAvg;

    const change = recentAvg - previousAvg;
    let trend = 'stable';
    if (change > 2) trend = 'improving';
    else if (change < -2) trend = 'declining';

    return {
        trend,
        currentAccuracy: parseFloat(recentAvg.toFixed(2)),
        previousAccuracy: parseFloat(previousAvg.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        mockAccuracies: mockAccuracies.map(m => ({
            date: m.date,
            accuracy: parseFloat(m.accuracy.toFixed(2))
        })),
        message: trend === 'improving'
            ? `Great! Accuracy improved by ${Math.abs(change).toFixed(1)}%`
            : trend === 'declining'
                ? `Accuracy declined by ${Math.abs(change).toFixed(1)}%. Review weak areas.`
                : 'Accuracy is stable. Keep practicing!'
    };
};

/**
 * Calculate performance patterns
 */
const calculatePerformancePatterns = (mocks) => {
    if (mocks.length < 3) {
        return {
            bestSlot: null,
            worstSlot: null,
            patterns: []
        };
    }

    // Group by slot
    const slotPerformance = mocks.reduce((acc, mock) => {
        if (!acc[mock.slot]) {
            acc[mock.slot] = { total: 0, count: 0, percentiles: [] };
        }
        acc[mock.slot].total += mock.total;
        acc[mock.slot].count += 1;
        acc[mock.slot].percentiles.push(mock.percentile);
        return acc;
    }, {});

    const slotAverages = Object.entries(slotPerformance).map(([slot, data]) => ({
        slot,
        averageScore: data.total / data.count,
        averagePercentile: data.percentiles.reduce((a, b) => a + b, 0) / data.percentiles.length,
        count: data.count
    })).sort((a, b) => b.averagePercentile - a.averagePercentile);

    return {
        bestSlot: slotAverages[0]?.slot || null,
        worstSlot: slotAverages[slotAverages.length - 1]?.slot || null,
        slotPerformance: slotAverages.map(s => ({
            slot: s.slot,
            averagePercentile: parseFloat(s.averagePercentile.toFixed(2)),
            mockCount: s.count
        }))
    };
};

/**
 * Generate personalized recommendations
 */
const generateRecommendations = (mocks, dailyTrackers, mockAnalyses) => {
    const recommendations = [];

    // Mock frequency recommendation
    if (mocks.length < 2) {
        recommendations.push({
            type: 'mock_frequency',
            priority: 'high',
            message: 'Take more mock tests to track progress effectively. Aim for at least 2-3 mocks per week.'
        });
    }

    // Daily practice recommendation
    const last7Days = dailyTrackers.slice(-7);
    const practiceRate = last7Days.length / 7;
    if (practiceRate < 0.5) {
        recommendations.push({
            type: 'daily_practice',
            priority: 'high',
            message: 'Increase daily practice consistency. You practiced only ${last7Days.length} out of 7 days.'
        });
    }

    // Section-specific recommendation
    if (mocks.length >= 5) {
        const last5 = mocks.slice(0, 5);
        const sectionAvg = {
            VARC: last5.reduce((sum, m) => sum + m.scores.varc, 0) / 5,
            LRDI: last5.reduce((sum, m) => sum + m.scores.lrdi, 0) / 5,
            QA: last5.reduce((sum, m) => sum + m.scores.qa, 0) / 5
        };

        const weak = Object.entries(sectionAvg).find(([_, score]) => score < 50);
        if (weak) {
            recommendations.push({
                type: 'weak_section',
                priority: 'high',
                message: `Focus on ${weak[0]}. Your average score is ${weak[1].toFixed(1)}, which needs improvement.`
            });
        }
    }

    // Error analysis recommendation
    const incorrectWithErrors = mockAnalyses.filter(a => !a.correct && a.errorType);
    if (incorrectWithErrors.length > 10 && incorrectWithErrors.length < mockAnalyses.length * 0.5) {
        recommendations.push({
            type: 'analysis_completion',
            priority: 'medium',
            message: 'Complete error analysis for more questions to get better insights.'
        });
    }

    return recommendations;
};
