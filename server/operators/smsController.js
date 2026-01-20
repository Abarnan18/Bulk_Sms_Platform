import smsModel from "../models/smsModel.js";
import User from "../models/userModel.js";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { sendSms } from "../utils/smsProvider.js";
import { SMS_CONFIG } from "../config/smsConfig.js";

// Configure multer for CSV file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = "./uploads";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// File filter to accept only CSV files
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "text/csv" || path.extname(file.originalname).toLowerCase() === ".csv") {
        cb(null, true);
    } else {
        cb(new Error("Only CSV files are allowed"), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});


/**
 * Send Single SMS
 * Users can only type numbers manually (NO CSV upload allowed)
 */
export const sendSingleSms = async (req, res) => {
    try {
        const { recipient, message } = req.body;
        const user = req.user; // Set by apiKeyAuth middleware

        // Validation
        if (!recipient || !message) {
            return res.status(400).json({
                success: false,
                message: "Phone number and message are required"
            });
        }

        // Validate phone number format.It must be like 94771234567
        const phoneRegex = /^947[01245678]\d{7}$/;
        if (!phoneRegex.test(recipient)) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number format"
            });
        }

        // Check if user has sufficient credits (1 credit needed for single SMS)
        if (user.credits === 0) {
            return res.status(400).json({
                success: false,
                message: `Insufficient credits. You need 1 credit but only have ${user.credits} credits available.`
            });
        }

        // Send SMS via provider
        const smsResult = await sendSms({
            recipient: recipient,
            message: message
        });

        // Create SMS record in database
        const smsRecord = new smsModel({
            to: recipient,
            message: message,
            status: smsResult.status,
            userId: user._id,
            sender_id: SMS_CONFIG.SENDER_ID,
            createdAt: Date.now()
        });

        await smsRecord.save();

        // If SMS sent successfully, deduct credits
        if (smsResult.success && smsResult.status === "sent") {
            await User.findByIdAndUpdate(
                user._id,
                { $inc: { credits: -1 } }, // Decrement credits by 1
                { new: true }
            );

            return res.status(200).json({
                success: true,
                message: "SMS sent successfully",
                data: {
                    smsId: smsRecord._id,
                    phoneNumber: recipient,
                    status: smsResult.status,
                    creditsRemaining: user.credits - 1
                }
            });
        } else {
            // SMS failed, don't deduct credits
            return res.status(500).json({
                success: false,
                message: "Failed to send SMS",
                data: {
                    smsId: smsRecord._id,
                    phoneNumber: recipient,
                    status: smsResult.status,
                    creditsRemaining: user.credits
                }
            });
        }

    } catch (error) {
        console.error("Error in sendSingleSms:", error);
        return res.status(500).json({
            success: false,
            message: "Server error: " + error.message
        });
    }
};





/**
 * Helper function to parse CSV file and extract phone numbers
 */
const parseCSVFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const numbers = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => {
                // Look for phone number in common column names
                const number = row.phone || row.phoneNumber || row.number ||
                    row.Phone || row.PhoneNumber || row.Number ||
                    row.mobile || row.Mobile;

                if (number) {
                    numbers.push(number.trim());
                }
            })
            .on("end", () => {
                resolve(numbers);
            })
            .on("error", (error) => {
                reject(error);
            });
    });
};





/**
 * Send Bulk SMS
 * Users can upload CSV file OR type numbers manually
 */
export const sendBulkSms = async (req, res) => {
    try {
        const { numbers, message } = req.body;
        const user = req.user; // Set by apiKeyAuth middleware
        const csvFile = req.file; // Set by multer middleware if file uploaded
        
        //Define phone number regex
        const phoneRegex = /^947[01245678]\d{7}$/;

        let recipientList = [];

        // Validation - message is required
        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        // Case 1: CSV file uploaded
        if (csvFile) {
            try {
                recipientList = await parseCSVFile(csvFile.path);

                // Clean up the uploaded file after parsing
                fs.unlinkSync(csvFile.path);

                if (recipientList.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "No valid phone numbers found in CSV file. Please ensure the CSV has a column named 'phone', 'phoneNumber', 'number', or 'mobile'"
                    });
                }
            } catch (error) {
                // Clean up the uploaded file in case of error
                if (fs.existsSync(csvFile.path)) {
                    fs.unlinkSync(csvFile.path);
                }
                return res.status(400).json({
                    success: false,
                    message: "Error parsing CSV file: " + error.message
                });
            }
        }
        // Case 2: Manual phone numbers provided
        else if (numbers) {
            // phoneNumbers can be a string (comma-separated) or an array
            if (typeof numbers === "string") {
                recipientList = numbers.split(",").map(num => num.trim()).filter(num => num.length > 0);
            } else if (Array.isArray(numbers)) {
                recipientList = numbers.map(num => num.trim()).filter(num => num.length > 0);
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid phone numbers format"
                });
            }
        }
        // Case 3: Neither CSV nor manual numbers provided
        else {
            return res.status(400).json({
                success: false,
                message: "Please provide either a CSV file or phone numbers"
            });
        }

        // Validate that we have recipients
        if (recipientList.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid phone numbers provided"
            });
        }

        // Separate valid and invalid phone numbers

        const validNumbers = [];
        const invalidNumbers = [];

        recipientList.forEach((number, index) => {
            number = number.trim();
            if (phoneRegex.test(number)) {
                validNumbers.push(number);
            } else {
                invalidNumbers.push({
                    index: index + 1,
                    number: number,
                    reason: "Invalid phone number format"
                });
            }
        });



        // Validate that we have at least some valid recipients
        if (validNumbers.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid phone numbers found to send messages",
                invalidNumbers: invalidNumbers,
                hint: "The phone number Must Start with 947 and be 11 digits long.Example: 9471234567"
            });
        }

        // Check if user has sufficient credits for valid numbers only
        const creditsNeeded = validNumbers.length;

        if (user.credits < creditsNeeded) {
            return res.status(400).json({
                success: false,
                message: `Insufficient credits. You need ${creditsNeeded} credits to send to valid numbers but only have ${user.credits} credits available.`,
                required: creditsNeeded,
                available: user.credits,
                shortage: creditsNeeded - user.credits,
                validRecipientCount: validNumbers.length,
                invalidRecipientCount: invalidNumbers.length
            });
        }

        // Send SMS to valid recipients and track results
        const results = {
            totalAttempted: recipientList.length,
            validCount: validNumbers.length,
            invalidCount: invalidNumbers.length,
            sent: 0,
            failed: 0,
            details: []
        };

        const smsRecords = [];

        for (const number of validNumbers) {
            try {
                // Send SMS via provider
                const smsResult = await sendSms({
                    recipient: number,
                    message: message
                });

                // Create SMS record
                const smsRecord = new smsModel({
                    to: number,
                    message: message,
                    status: smsResult.status,
                    userId: user._id,
                    sender_id: SMS_CONFIG.SENDER_ID

                });

                await smsRecord.save();
                smsRecords.push(smsRecord);

                // Track results
                if (smsResult.success && smsResult.status === "sent") {
                    results.sent++;
                } else {
                    results.failed++;
                }

                results.details.push({
                    number: number,
                    status: smsResult.status,
                    smsId: smsRecord._id
                });

            } catch (error) {
                console.error(`Error sending SMS to ${number}:`, error);
                results.failed++;
                results.details.push({
                    number: number,
                    status: "failed",
                    error: error.message
                });
            }
        }

        // Deduct credits based on successfully sent messages
        const creditsToDeduct = results.sent;

        if (creditsToDeduct > 0) {
            await User.findByIdAndUpdate(
                user._id,
                { $inc: { credits: -creditsToDeduct } },
                { new: true }
            );
        }

        // Return response
        return res.status(200).json({
            success: true,
            message: `Bulk SMS processing completed. ${results.sent} sent, ${results.failed} failed, ${invalidNumbers.length} skipped due to invalid format.`,
            data: {
                summary: {
                    totalAttempted: results.totalAttempted,
                    sent: results.sent,
                    failed: results.failed,
                    invalid: invalidNumbers.length,
                    creditsDeducted: creditsToDeduct,
                    creditsRemaining: user.credits - creditsToDeduct
                },
                sentList: results.details,
                invalidList: invalidNumbers
            }
        });

    } catch (error) {
        console.error("Error in sendBulkSms:", error);

        // Clean up uploaded file if exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({
            success: false,
            message: "Server error: " + error.message
        });
    }
};

export const getSmsHistory = async (req, res) => {
    try {
        const user = req.user;
        const history = await smsModel.find({ userId: user._id }).sort({ createdAt: -1 });

        return res.json({
            success: true,
            history
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching history: " + error.message
        });
    }
};
