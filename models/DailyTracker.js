const mongoose = require('mongoose');

const dailyTrackerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        index: true
    },
    // CAT Preparation Subjects
    quant: {
        type: Boolean,
        default: false
    },
    lrdi: {
        type: Boolean,
        default: false
    },
    varc: {
        type: Boolean,
        default: false
    },
    // Personal Development
    softSkill: {
        type: Boolean,
        default: false
    },
    // Wellness
    exercise: {
        type: Boolean,
        default: false
    },
    gaming: {
        type: Boolean,
        default: false
    },
    // Mood Tracking
    mood: {
        type: String,
        enum: ['excellent', 'good', 'okay', 'bad', 'terrible', ''],
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure one entry per user per day
dailyTrackerSchema.index({ userId: 1, date: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
dailyTrackerSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Helper method to get formatted date (YYYY-MM-DD)
dailyTrackerSchema.methods.getFormattedDate = function () {
    return this.date.toISOString().split('T')[0];
};

module.exports = mongoose.model('DailyTracker', dailyTrackerSchema);
