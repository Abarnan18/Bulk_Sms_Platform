import requestModel from "../models/requestModel.js";
import userModel from "../models/userModel.js";

// User: Create a request
export const createRequest = async (req, res) => {
    try {
        const { type, amount, reason } = req.body;
        const userId = req.user.id; // From verifyToken middleware

        const newRequest = await requestModel.create({
            userId,
            type,
            amount,
            reason
        });

        return res.status(201).json({ success: true, message: "Request submitted successfully", request: newRequest });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// User: Get my requests
export const getMyRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const requests = await requestModel.find({ userId }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Admin: Get all pending requests
export const getPendingRequests = async (req, res) => {
    try {
        const requests = await requestModel.find({ status: "pending" }).populate("userId", "email credits").sort({ createdAt: -1 });
        return res.status(200).json({ success: true, requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Admin: Update request status (Approve/Reject)
export const handleRequest = async (req, res) => {
    try {
        const { requestId, status } = req.body; // status: "approved" or "rejected"

        const request = await requestModel.findById(requestId);
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        if (request.status !== "pending") {
            return res.status(400).json({ success: false, message: "Request already processed" });
        }

        request.status = status;
        await request.save();

        // If approved, perform the action
        if (status === "approved") {
            const user = await userModel.findById(request.userId);
            if (user) {
                if (request.type === "unblock") {
                    user.isBlocked = false;
                } else if (request.type === "credit") {
                    user.credits += Number(request.amount);
                }
                await user.save();
            }
        }

        return res.status(200).json({ success: true, message: `Request ${status} successfully` });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
