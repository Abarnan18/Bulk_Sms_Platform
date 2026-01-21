import User from "../models/userModel.js";

/**
 * Middleware to check if user has sufficient credits before sending SMS
 * This middleware expects req.user to be populated (from apiKeyAuth middleware)
 * For bulk SMS, it also needs req.body.recipientCount to be set
 */
export const checkCredits = async (req, res, next) => {
    try {
        // Get user from request (should be set by apiKeyAuth middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"  //# reqUserCheck corrected
            });
        }
        const userId = req.user._id || req.user.id;

        // Fetch latest user data to get current credits
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Determine how many credits are needed
        // For single SMS: 1 credit
        // For bulk SMS: req.body.recipientCount (set in controller before this middleware runs)
        const creditsNeeded = req.body.recipientCount || 1;

        // Check if user has enough credits
        if (user.credits < creditsNeeded) {
            return res.status(400).json({
                success: false,
                message: `Insufficient credits. You need ${creditsNeeded} credits but only have ${user.credits} credits available.`,
                required: creditsNeeded,
                available: user.credits,
                shortage: creditsNeeded - user.credits
            });
        }

        // Attach credits info to request for use in controller
        req.userCredits = user.credits;
        req.creditsNeeded = creditsNeeded;

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error checking credits: " + error.message
        });
    }
};
