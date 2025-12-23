const mongoose = require('mongoose');

const softSkillsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    type: {
        type: String,
        required: [true, 'Soft skill type is required'],
        enum: ['Essay', 'GD', 'Extempore', 'Interview', 'Presentation', 'Structured Thinking']
    },
    topic: {
        type: String,
        required: [true, 'Topic is required'],
        trim: true,
        maxlength: [200, 'Topic cannot exceed 200 characters']
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: [1, 'Duration must be at least 1 minute'],
        max: [300, 'Duration cannot exceed 300 minutes']
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be between 1 and 5'],
        max: [5, 'Rating must be between 1 and 5']
    },
    note: {
        type: String,
        trim: true,
        maxlength: [1000, 'Note cannot exceed 1000 characters']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        index: true
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

// Compound index for efficient querying
softSkillsSchema.index({ userId: 1, date: -1 });
softSkillsSchema.index({ userId: 1, type: 1 });

// Update timestamp before saving
softSkillsSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('SoftSkills', softSkillsSchema);
