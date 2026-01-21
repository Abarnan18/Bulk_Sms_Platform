import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
    const { token } = req.cookies;

    // Check for token in cookie or Authorization header
    let authToken = token;
    if (!authToken && req.headers.authorization) {
        authToken = req.headers.authorization.split(' ')[1];
    }

    if (!authToken) {
        return res.status(401).json({ success: false, message: "Unauthorized, please login again" });
    }

    try {
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET);

        if (decoded.id) {
            req.user = {
                id: decoded.id,
                role: decoded.role
            };
            req.body.userId = decoded.id; // Many controllers expect userId in body
            next();
        } else {
            return res.status(401).json({ success: false, message: "Invalid session, please login again" });
        }
    } catch (error) {
        return res.status(401).json({ success: false, message: error.message });
    }
}
