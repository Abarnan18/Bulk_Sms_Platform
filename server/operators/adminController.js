import userModel from "../models/userModel.js";
import smsModel from "../models/smsModel.js";

// Add Credits to a specific user
export const addCredits = async (req, res) => {
    try {
        const { credits } = req.body;
        const userId = req.params.userId;

        if (credits === undefined || credits === null || isNaN(credits) || Number(credits) <= 0) {
            return res.status(400).json({ success: false, message: "Invalid credit amount." });
        }

        let user;
        if (userId.match(/^[0-9a-fA-F]{24}$/)) {
            user = await userModel.findById(userId);
        } else {
            user = await userModel.findOne({ email: userId });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.credits += Number(credits);
        await user.save();

        return res.status(200).json({
            success: true,
            message: `Successfully added ${credits} credits to ${user.email}`,
            user: {
                id: user._id,
                email: user.email,
                credits: user.credits
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Block a user (Support ID or Email)
export const blockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        let user;

        if (userId.match(/^[0-9a-fA-F]{24}$/)) {
            user = await userModel.findById(userId);
        } else {
            user = await userModel.findOne({ email: userId });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.isBlocked = true;
        await user.save();
        return res.status(200).json({ success: true, message: `User ${user.email} blocked successfully` });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Unblock a user (Support ID or Email)
export const unBlockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        let user;

        if (userId.match(/^[0-9a-fA-F]{24}$/)) {
            user = await userModel.findById(userId);
        } else {
            user = await userModel.findOne({ email: userId });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.isBlocked = false;
        await user.save();
        return res.status(200).json({ success: true, message: `User ${user.email} unblocked successfully` });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// View all users with search/filter
export const getAllUsers = async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : undefined }
            ].filter(Boolean);
        }

        if (status) {
            query.isBlocked = status === 'blocked';
        }

        const users = await userModel.find(query).select("-password").sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// View a specific user by userId or email
export const singleUser = async (req, res) => {
    try {
        const { identifier } = req.params;
        let user;

        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            user = await userModel.findById(identifier).select("-password");
        } else {
            user = await userModel.findOne({ email: identifier }).select("-password");
        }

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// View all messages with advanced filtering
export const viewAllSms = async (req, res) => {
    try {
        const { status, userId, email, startDate, endDate } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        if (userId) {
            query.userId = userId.trim();
        } else if (email) {
            // Robust case-insensitive search
            const user = await userModel.findOne({ email: { $regex: new RegExp(`^${email.trim()}$`, "i") } });
            if (user) {
                query.userId = user._id.toString();
            } else {
                return res.status(200).json({ success: true, count: 0, sms: [] });
            }
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const sms = await smsModel.find(query).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: sms.length,
            sms
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
