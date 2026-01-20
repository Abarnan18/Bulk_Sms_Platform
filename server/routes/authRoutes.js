import express from "express"
import { loginUser, logoutUser, registerUser, sendOtp, verifyOtp } from "../operators/authController.js";
import { verifyToken } from "../middleware/userAuth.js";
const router = express.Router();


router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/send-otp", verifyToken, sendOtp)
router.post("/verify-otp", verifyToken, verifyOtp)

export default router;


