import axios from "axios";

/**
 * Send Email using Brevo SMTP API
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Email plain text content
 */
export const sendEmail = async (to, subject, text) => {
    try {
        await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
                sender: { name: "MsgBulkHUB", email: process.env.SENDER_EMAIL },
                to: [{ email: to }],
                subject,
                textContent: text
            },
            {
                headers: { "api-key": process.env.BREVO_API_KEY }
            }
        );

        console.log(`📧 Email sent to ${to}`);
    } catch (err) {
        console.error(`❌ Failed to send email to ${to}:`, err.response?.data || err.message);
    }
};
