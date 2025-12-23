const { GoogleGenerativeAI } = require("@google/generative-ai");
const MockTracker = require('../models/MockTracker');
const DailyTracker = require('../models/DailyTracker');
const asyncHandler = require('../utils/asyncHandler');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * @desc    Get AI Response based on user performance
 * @route   POST /api/ai/chat
 * @access  Private
 */
exports.getAiResponse = asyncHandler(async (req, res) => {
    const { message, chatHistory } = req.body;
    const userId = req.user._id;

    if (!message) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a message'
        });
    }

    // Fetch latest user data for context
    const [latestMocks, recentActivity] = await Promise.all([
        MockTracker.find({ userId }).sort({ date: -1 }).limit(3),
        DailyTracker.find({ userId }).sort({ date: -1 }).limit(5)
    ]);

    // Format context for the AI
    let context = "User Context:\n";
    if (latestMocks.length > 0) {
        context += "- Latest Mock Scores:\n";
        latestMocks.forEach(m => {
            context += `  * Date: ${new Date(m.date).toLocaleDateString()}, Total: ${m.total}, Percentile: ${m.percentile}%, VARC: ${m.scores.varc}, LRDI: ${m.scores.lrdi}, QA: ${m.scores.qa}\n`;
        });
    } else {
        context += "- No mock data logged yet.\n";
    }

    if (recentActivity.length > 0) {
        context += "- Recent Prep Activity:\n";
        recentActivity.forEach(a => {
            context += `  * Date: ${new Date(a.date).toLocaleDateString()}, Subjects: ${a.subjects.join(', ')}, Mood: ${a.mood}\n`;
        });
    }

    // System instruction for Gemini 1.5
    const systemInstruction = `You are PrepTrack AI, a specialized mentor for students preparing for the CAT (Common Admission Test) and other MBA entrance exams. 
Your goal is to provide strategic advice, performance analysis, and motivation.
Use the provided User Context to give personalized recommendations. 
Be encouraging, professional, and concise. 
If the user hasn't logged enough data, suggest they use the trackers more consistently.
Keep formatting clean with bullet points where necessary.`;

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            systemInstruction: systemInstruction
        });

        // Format history for Gemini
        const history = (chatHistory || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        // Prompt now only contains context and the new message
        const finalPrompt = `${context}\n\nUser Question: ${message}`;

        const result = await chat.sendMessage(finalPrompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({
            success: true,
            data: text
        });
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({
            success: false,
            message: 'AI Mentor is currently unavailable. Please try again later.'
        });
    }
});
