import cron from 'node-cron';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { sendReminderEmail, sendDigestEmail } from '../utils/mailer.js';

/**
 * Daily at 8am — send 24-hour reminder emails to event registrants
 */
cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running 24h reminder job...');
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const start = new Date(tomorrow.setHours(0, 0, 0, 0));
        const end = new Date(tomorrow.setHours(23, 59, 59, 999));

        const events = await Event.find({ date: { $gte: start, $lte: end } });

        for (const event of events) {
            const registrations = await Registration.find({ event: event._id }).populate('user');
            for (const reg of registrations) {
                if (reg.user?.email) {
                    await sendReminderEmail(reg.user, event).catch(console.error);
                }
            }
        }
        console.log(`✅ Sent reminders for ${events.length} event(s)`);
    } catch (err) {
        console.error('Reminder job error:', err.message);
    }
});

/**
 * Every Monday at 8am — send weekly event digest to students based on their interests
 */
cron.schedule('0 8 * * 1', async () => {
    console.log('📧 Running weekly digest job...');
    try {
        const now = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);

        const upcomingEvents = await Event.find({
            status: 'upcoming',
            date: { $gte: now, $lte: nextMonth },
        });

        const students = await User.find({ role: 'student' });

        for (const student of students) {
            // Match events by interests (tags overlap)
            const interests = student.interests || [];
            const matched = upcomingEvents.filter((e) =>
                e.tags?.some((tag) => interests.includes(tag.toLowerCase()))
            );

            if (matched.length > 0 && student.email) {
                await sendDigestEmail(student, matched).catch(console.error);
            }
        }
        console.log(`✅ Digest sent to eligible students`);
    } catch (err) {
        console.error('Digest job error:', err.message);
    }
});

console.log('✅ Cron jobs scheduled (daily reminder + weekly digest)');
