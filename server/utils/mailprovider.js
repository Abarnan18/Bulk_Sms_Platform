import axios from "axios";

/**
 * Send email using Brevo Transactional API
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - Email HTML content
 * @param {object} [params] - Optional dynamic params for templates
 */
export const sendBrevoEmail = async (to, subject, htmlContent, params = {}) => {
  try {
    const data = {
      sender: { name: "MsgBulkHUB", email: process.env.SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent,
    };

    // If using dynamic template variables
    if (Object.keys(params).length) {
      data.params = params;
    }

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      data,
      {
        headers: {
          "accept": "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
      }
    );

    console.log(`📧 Email sent to ${to}, messageId: ${response.data.messageId}`);
    return { success: true, messageId: response.data.messageId };
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
};
