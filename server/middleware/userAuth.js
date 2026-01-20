import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized, Login Again" })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (decoded.id) {
            req.user = decoded;
            // Initialize req.body if it doesn't exist
            if (!req.body) req.body = {};
            req.body.userId = decoded.id;
            next();
        } else {
            return res.status(401).json({ success: false, message: "Unauthorized , Login Again" })
        }
    } catch (error) {
        return res.status(401).json({ success: false, message: error.message })
    }
}
