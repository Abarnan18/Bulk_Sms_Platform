import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    try {
        let authToken = null;

        // 1️⃣ Check Authorization header (Bearer token)
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            authToken = req.headers.authorization.split(" ")[1];
        }

        // 2️⃣ Fallback to cookie token
        if (!authToken && req.cookies?.token) {
            authToken = req.cookies.token;
        }

        // ❌ No token found
        if (!authToken) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized – token missing"
            });
        }

        // 3️⃣ Verify token
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET);

        // 4️⃣ Attach user safely (DO NOT TOUCH req.body)
        req.user = {
            id: decoded.id,
            role: decoded.role || "user"
        };

        next();

    } catch (error) {
        console.error("JWT verification failed:", error.message);

        return res.status(401).json({
            success: false,
            message: "Unauthorized – token invalid or expired"
        });
    }
};
