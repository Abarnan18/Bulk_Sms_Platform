import axios from "axios";
import { SMS_CONFIG } from "../config/smsConfig.js";

/**
 * Send SMS using Text.lk HTTP API
 * @param {string} recipient - Recipient phone number
 * @param {string} message - SMS message content
 * @returns {Promise<{success: boolean, status: string, message: string, response?: any, error?: any}>}
 */


export const sendSms = async ({ recipient, message }) => {
    try {
        // Text.lk API configuration
        const payload = {
            api_token: SMS_CONFIG.API_TOKEN,
            recipient: recipient,
            sender_id: SMS_CONFIG.SENDER_ID,
            message: message,
        };

        // Send SMS via Text.lk
        const response = await axios.post(
            SMS_CONFIG.ENDPOINT,
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                timeout: SMS_CONFIG.TIMEOUT || 10000
            }
        );

        // Check if response is successful
        if (response.data && response.data.status === "success") {
            return {
                success: true,
                status: "sent",
                message: "SMS sent successfully",
                response: response.data
            };
        } else {
            return {
                success: false,
                status: "failed",
                message: response.data?.message || "Failed to send SMS",
                error: response.data
            };
        }

    } catch (error) {
    const apiError = error.response?.data || error.message || error;
    console.error("SMS API Error:", apiError);

    return {
      success: false,
      status: "failed",
      message: error.response?.data?.message || error.message || "Unknown error",
      error: apiError
    };
  }
};