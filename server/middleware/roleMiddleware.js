import userModel from "../models/userModel.js";
export const authRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }
        next();
    }
}