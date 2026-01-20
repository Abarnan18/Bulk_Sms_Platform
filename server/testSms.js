import { sendSms } from "./utils/smsProvider.js";

console.log("Testing SMS provider...");

(async () => {
    try {
        console.log("Sending SMS with originator: SMSHub");
        const result = await sendSms({
            to: "+94771234567",
            message: "Test SMS from Node",
            originator: "SMSHub"
        });
        console.log("SMS Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
})();
