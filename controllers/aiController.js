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
    try {
        const { message, chatHistory } = req.body;
        const userId = req.user._id;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a message'
            });
        }

        // Check for API Key presence
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is missing in server environment variables');
        }

        // Fetch latest user data for context
        const [latestMocks, recentActivity] = await Promise.all([
            MockTracker.find({ userId }).sort({ date: -1 }).limit(3),
            DailyTracker.find({ userId }).sort({ date: -1 }).limit(5)
        ]);

        // Format context for the AI
        let context = "User Context:\n";
        if (latestMocks && latestMocks.length > 0) {
            context += "- Latest Mock Scores:\n";
            latestMocks.forEach(m => {
                const s = m.scores || {};
                context += `  * Date: ${new Date(m.date).toLocaleDateString()}, Total: ${m.total || 0}, Percentile: ${m.percentile || 0}%, VARC: ${s.varc || 0}, LRDI: ${s.lrdi || 0}, QA: ${s.qa || 0}\n`;
            });
        } else {
            context += "- No mock data logged yet.\n";
        }

        if (recentActivity && recentActivity.length > 0) {
            context += "- Recent Prep Activity:\n";
            recentActivity.forEach(a => {
                const completedTasks = [];
                if (a.quant) completedTasks.push('Quant');
                if (a.lrdi) completedTasks.push('LRDI');
                if (a.varc) completedTasks.push('VARC');
                if (a.softSkill) completedTasks.push('Soft Skills');
                if (a.exercise) completedTasks.push('Exercise');
                if (a.gaming) completedTasks.push('Gaming');

                const tasksString = completedTasks.length > 0 ? completedTasks.join(', ') : 'No tasks logged';
                context += `  * Date: ${new Date(a.date).toLocaleDateString()}, Tasks: ${tasksString}, Mood: ${a.mood || 'Not set'}\n`;
            });
        }

        // System instruction for Gemini 1.5
        const systemInstruction = `You are PrepTrack AI, a specialized mentor for students preparing for the CAT (Common Admission Test) and other MBA entrance exams. 
Your goal is to provide strategic advice, performance analysis, and motivation.
Use the provided User Context to give personalized recommendations. 
Be encouraging, professional, and concise. 
If the user hasn't logged enough data, suggest they use the trackers more consistently.
Keep formatting clean with bullet points where necessary.`;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction
        });

        // Format history for Gemini
        const history = (chatHistory || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content || "" }],
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
        console.error('❌ AI Mentor Error:', error);
        res.status(500).json({
            success: false,
            message: `AI Error: ${error.message || 'Unknown error'}`
        });
    }
});
