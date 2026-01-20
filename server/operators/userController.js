import userModel from "../models/userModel.js";

export const getUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }
        res.json({
            success: true,
            user: {
                _id: user._id,
                email: user.email,
                isVerified: user.isVerified,
                credits: user.credits,
                role: user.role,
                isBlocked: user.isBlocked,
                apiKey: user.apiKey
            }
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

