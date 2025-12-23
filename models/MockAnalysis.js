const mongoose = require('mongoose');

const mockAnalysisSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    mockId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MockTracker',
        required: [true, 'Mock ID is required'],
        index: true
    },
    section: {
        type: String,
        required: [true, 'Section is required'],
        enum: ['VARC', 'LRDI', 'QA'],
        uppercase: true
    },
    questionNo: {
        type: Number,
        required: [true, 'Question number is required'],
        min: [1, 'Question number must be at least 1']
    },
    attempted: {
        type: Boolean,
        required: true,
        default: false
    },
    correct: {
        type: Boolean,
        required: true,
        default: false
    },
    errorType: {
        type: String,
        enum: ['Concept', 'Calculation', 'Selection', 'Panic', 'Time', ''],
        default: ''
    },
    whyWrong: {
        type: String,
        trim: true,
        maxlength: [500, 'Why wrong explanation cannot exceed 500 characters']
    },
    correctApproach: {
        type: String,
        trim: true,
        maxlength: [500, 'Correct approach cannot exceed 500 characters']
    },
    actionItem: {
        type: String,
        trim: true,
        maxlength: [200, 'Action item cannot exceed 200 characters']
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
mockAnalysisSchema.index({ userId: 1, mockId: 1 });
mockAnalysisSchema.index({ mockId: 1, section: 1 });

// Ensure unique question per mock and section
mockAnalysisSchema.index({ mockId: 1, section: 1, questionNo: 1 }, { unique: true });

// Update timestamp before saving
mockAnalysisSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Validation: If correct is true, errorType should be empty
mockAnalysisSchema.pre('save', function (next) {
    if (this.correct && this.errorType) {
        this.errorType = '';
    }
    next();
});

module.exports = mongoose.model('MockAnalysis', mockAnalysisSchema);
