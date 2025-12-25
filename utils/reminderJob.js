const cron = require('node-cron');
const User = require('../models/User');
const DailyTracker = require('../models/DailyTracker');
const SoftSkills = require('../models/SoftSkills');
const Notification = require('../models/Notification');

const initReminderJob = () => {
    // Schedule for 9 PM every day
    // 0 21 * * * means minute 0, hour 21 (9 PM)
    cron.schedule('0 21 * * *', async () => {
        console.log('🔔 Running daily reminder job at 9 PM...');

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // 1. Get all users with notifications enabled
            const users = await User.find({ notificationsEnabled: true });

            for (const user of users) {
                // 2. Check if user has an entry for today in BOTH trackers
                const [dailyEntry, softSkillEntry] = await Promise.all([
                    DailyTracker.findOne({
                        userId: user._id,
                        date: { $gte: today, $lt: tomorrow }
                    }),
                    SoftSkills.findOne({
                        userId: user._id,
                        date: { $gte: today, $lt: tomorrow }
                    })
                ]);

                // 3. If either is missing, send a notification
                if (!dailyEntry || !softSkillEntry) {
                    let missing = [];
                    if (!dailyEntry) missing.push('Daily Tracker');
                    if (!softSkillEntry) missing.push('Soft Skill Tracker');

                    const message = `You haven't completed your ${missing.join(' and ')} for today. Stay consistent with your prep!`;

                    // Create notification in DB
                    await Notification.create({
                        userId: user._id,
                        title: 'Daily Goal Reminder 🎯',
                        message: message,
                        type: 'reminder'
                    });

                    console.log(`✅ Notification sent to ${user.name} for missing: ${missing.join(', ')}`);
                }
            }
        } catch (error) {
            console.error('❌ Error in reminder job:', error);
        }
    });

    console.log('⏰ Reminder job scheduled for 9 PM daily');
};

module.exports = initReminderJob;
