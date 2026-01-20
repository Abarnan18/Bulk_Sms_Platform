import User from "../models/userModel.js";
export const apiKeyAuth = async (req, res, next) => {
    try {
        // get api key from headers
        const apiKey = req.headers["x-api-key"];

        // checks if api key is present
        if (!apiKey) {
            return res.status(401).json({ success: false, message: `Unauthorized users can't send SMS` })
        }

        // get user by api key
        const user = await User.findOne({ apiKey })

        // checks if there is a user available to the api key
        if (!user) {
            return res.status(401).json({ success: false, message: `Unauthorized users can't send SMS` })
        }

        //checks the user isVerified
        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: "Please verify your account with your email to send sms" })
        }

        //checks if the userBlocked
        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: "User is Blocked by the Admin. Kindly request admin to unblock" })
        }
        //if everything is fine

        //Attach user to req object
        req.user = user;
        next();

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}