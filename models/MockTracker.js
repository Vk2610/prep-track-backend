const mongoose = require('mongoose');

const mockTrackerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    name: {
        type: String,
        required: [true, 'Mock test name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        index: true
    },
    slot: {
        type: String,
        required: [true, 'Slot is required'],
        enum: ['morning', 'afternoon', 'evening', 'night'],
        lowercase: true
    },
    scores: {
        varc: {
            type: Number,
            required: [true, 'VARC score is required'],
            min: [0, 'VARC score cannot be negative'],
            max: [100, 'VARC score cannot exceed 100']
        },
        lrdi: {
            type: Number,
            required: [true, 'LRDI score is required'],
            min: [0, 'LRDI score cannot be negative'],
            max: [100, 'LRDI score cannot exceed 100']
        },
        qa: {
            type: Number,
            required: [true, 'QA score is required'],
            min: [0, 'QA score cannot be negative'],
            max: [100, 'QA score cannot exceed 100']
        }
    },
    total: {
        type: Number,
        min: 0,
        max: 300
    },
    percentile: {
        type: Number,
        required: [true, 'Percentile is required'],
        min: [0, 'Percentile cannot be negative'],
        max: [100, 'Percentile cannot exceed 100']
    },
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

// Auto-calculate total score before saving
mockTrackerSchema.pre('save', function (next) {
    if (this.scores && this.scores.varc !== undefined && this.scores.lrdi !== undefined && this.scores.qa !== undefined) {
        this.total = this.scores.varc + this.scores.lrdi + this.scores.qa;
    }
    this.updatedAt = Date.now();
    next();
});

// Before update, recalculate total
mockTrackerSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.scores) {
        const { varc, lrdi, qa } = update.scores;
        if (varc !== undefined && lrdi !== undefined && qa !== undefined) {
            update.total = varc + lrdi + qa;
        }
    }
    update.updatedAt = Date.now();
    next();
});

// Index for efficient querying
mockTrackerSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('MockTracker', mockTrackerSchema);
