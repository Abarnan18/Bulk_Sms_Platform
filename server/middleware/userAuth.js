// User Auth Middleware
// Removed JWT/Bearer authentication as project no longer uses it
export const verifyToken = (req, res, next) => {
    // Since we don't use JWT, just allow requests to continue if req.user is already set
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            message: "Unauthorized, Login Again"  //# BearerRemoved corrected
        });
    }
    next();
}
