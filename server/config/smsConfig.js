// SMS API Configuration

// IMPORTANT: Configure your SMSAPI.LK account settings here

export const SMS_CONFIG = {
    // API Token from Text.lk dashboard
    API_TOKEN: "3022|KL4guPIF7uyxCb2ehFfSqNQl5AnyGLsK0CAQnme7d9d8bfd7",
    
    // Endpoint URL
    ENDPOINT: "https://app.text.lk/api/http/sms/send",
    
    // Default originator (Sender ID) - MUST be authorized in your Text.lk account dashboard
    // Login to https://app.text.lk/ and add/configure our sender IDs
    // Common formats:
    // - Alphanumeric: "SMSHub", "BulkSMS", "YourCompany" (max 11 characters)
    // - Numeric: "94123456789"
    SENDER_ID: "TextLKDemo",
    
    // Request timeout in milliseconds
    TIMEOUT: 10000
};
