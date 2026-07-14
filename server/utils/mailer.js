import nodemailer from 'nodemailer';

// Create reusable transporter from env vars
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // TLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send a registration confirmation email with QR code attached.
 * @param {{ name: string, email: string }} user
 * @param {{ title: string, date: Date, venue: string }} event
 * @param {string} qrBase64 - Base64 data URL of the QR image
 * @returns {Promise<void>}
 */
export const sendRegistrationEmail = async (user, event, qrBase64) => {
    const base64Data = qrBase64.replace(/^data:image\/png;base64,/, '');
    const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
        dateStyle: 'full',
    });

    await transporter.sendMail({
        from: `"CampusConnect" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: `✅ You're registered for ${event.title}!`,
        html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#4F46E5">CampusConnect</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>You have successfully registered for <strong>${event.title}</strong>.</p>
        <table style="margin:16px 0;border-collapse:collapse">
          <tr><td style="padding:4px 8px;font-weight:bold">📅 Date</td><td>${eventDate}</td></tr>
          <tr><td style="padding:4px 8px;font-weight:bold">📍 Venue</td><td>${event.venue}</td></tr>
        </table>
        <p>Present the attached QR code at the entrance for check-in.</p>
        <p style="color:#6b7280;font-size:13px">See you there! — The CampusConnect Team</p>
      </div>
    `,
        attachments: [
            {
                filename: 'qr-code.png',
                content: base64Data,
                encoding: 'base64',
                contentType: 'image/png',
            },
        ],
    });
};

/**
 * Send a 24-hour event reminder email.
 * @param {{ name: string, email: string }} user
 * @param {{ title: string, date: Date, venue: string }} event
 * @returns {Promise<void>}
 */
export const sendReminderEmail = async (user, event) => {
    const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
        dateStyle: 'full',
    });
    await transporter.sendMail({
        from: `"CampusConnect" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: `⏰ Reminder: ${event.title} is tomorrow!`,
        html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#4F46E5">CampusConnect</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>This is a reminder that <strong>${event.title}</strong> is happening tomorrow.</p>
        <table style="margin:16px 0;border-collapse:collapse">
          <tr><td style="padding:4px 8px;font-weight:bold">📅 Date</td><td>${eventDate}</td></tr>
          <tr><td style="padding:4px 8px;font-weight:bold">📍 Venue</td><td>${event.venue}</td></tr>
        </table>
        <p>Don't forget to bring your QR code for check-in!</p>
      </div>
    `,
    });
};

/**
 * Send a weekly event digest email to a student.
 * @param {{ name: string, email: string }} user
 * @param {Array<{ title: string, date: Date, venue: string, category: string }>} events
 * @returns {Promise<void>}
 */
export const sendDigestEmail = async (user, events) => {
    const eventRows = events
        .map(
            (e) =>
                `<li style="margin-bottom:8px">
          <strong>${e.title}</strong> — ${new Date(e.date).toLocaleDateString('en-IN')} at ${e.venue}
          <span style="background:#EEF2FF;color:#4F46E5;padding:2px 8px;border-radius:12px;font-size:12px;margin-left:8px">${e.category}</span>
        </li>`
        )
        .join('');

    await transporter.sendMail({
        from: `"CampusConnect" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: `🗓️ Your weekly events digest`,
        html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#4F46E5">CampusConnect — Weekly Digest</h2>
        <p>Hi <strong>${user.name}</strong>, here are events you might like:</p>
        <ul>${eventRows}</ul>
        <p style="color:#6b7280;font-size:13px">Log in to CampusConnect to register!</p>
      </div>
    `,
    });
};
