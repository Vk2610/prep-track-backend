/**
 * Validation utility functions for backend
 */

/**
 * Validate score range (0-100)
 */
exports.validateScore = (score, fieldName = 'Score') => {
    if (score === undefined || score === null) {
        return { valid: false, message: `${fieldName} is required` };
    }

    const numScore = parseFloat(score);

    if (isNaN(numScore)) {
        return { valid: false, message: `${fieldName} must be a valid number` };
    }

    if (numScore < 0 || numScore > 100) {
        return { valid: false, message: `${fieldName} must be between 0 and 100` };
    }

    return { valid: true, value: numScore };
};

/**
 * Validate percentile (0-100)
 */
exports.validatePercentile = (percentile) => {
    if (percentile === undefined || percentile === null) {
        return { valid: false, message: 'Percentile is required' };
    }

    const numPercentile = parseFloat(percentile);

    if (isNaN(numPercentile)) {
        return { valid: false, message: 'Percentile must be a valid number' };
    }

    if (numPercentile < 0 || numPercentile > 100) {
        return { valid: false, message: 'Percentile must be between 0 and 100' };
    }

    return { valid: true, value: numPercentile };
};

/**
 * Validate enum value
 */
exports.validateEnum = (value, allowedValues, fieldName = 'Field') => {
    if (!allowedValues.includes(value)) {
        return {
            valid: false,
            message: `Invalid ${fieldName}. Must be one of: ${allowedValues.filter(v => v).join(', ')}`
        };
    }
    return { valid: true };
};

/**
 * Validate date
 */
exports.validateDate = (dateString, allowFuture = false) => {
    if (!dateString) {
        return { valid: false, message: 'Date is required' };
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return { valid: false, message: 'Invalid date format' };
    }

    if (!allowFuture) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (date > today) {
            return { valid: false, message: 'Cannot create entries for future dates' };
        }
    }

    return { valid: true, value: date };
};

/**
 * Validate rating (1-5)
 */
exports.validateRating = (rating) => {
    if (rating === undefined || rating === null) {
        return { valid: false, message: 'Rating is required' };
    }

    const numRating = parseInt(rating);

    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return { valid: false, message: 'Rating must be between 1 and 5' };
    }

    return { valid: true, value: numRating };
};

/**
 * Validate duration (1-300 minutes)
 */
exports.validateDuration = (duration) => {
    if (duration === undefined || duration === null) {
        return { valid: false, message: 'Duration is required' };
    }

    const numDuration = parseInt(duration);

    if (isNaN(numDuration) || numDuration < 1 || numDuration > 300) {
        return { valid: false, message: 'Duration must be between 1 and 300 minutes' };
    }

    return { valid: true, value: numDuration };
};

/**
 * Validate string length
 */
exports.validateStringLength = (str, maxLength, fieldName = 'Field') => {
    if (str && str.length > maxLength) {
        return { valid: false, message: `${fieldName} cannot exceed ${maxLength} characters` };
    }
    return { valid: true };
};

/**
 * Validate boolean
 */
exports.validateBoolean = (value, fieldName = 'Field') => {
    if (value !== undefined && typeof value !== 'boolean') {
        return { valid: false, message: `${fieldName} must be a boolean value` };
    }
    return { valid: true };
};
