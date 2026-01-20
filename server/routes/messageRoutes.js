import express from "express";
import { sendBulkSms, sendSingleSms, getSmsHistory, upload } from "../operators/smsController.js";
import { apiKeyAuth } from "../middleware/apiKeyAuth.js";

const messageRouter = express.Router();

// Single SMS - No CSV upload allowed, only manual number entry
messageRouter.post("/send-single-sms", apiKeyAuth, sendSingleSms);

// Bulk SMS - CSV upload OR manual number entry allowed
// The upload.single("csvFile") middleware handles optional CSV file upload
messageRouter.post("/send-bulk-sms", apiKeyAuth, upload.single("csvFile"), sendBulkSms);

// History
messageRouter.get("/history", apiKeyAuth, getSmsHistory);

export default messageRouter;
