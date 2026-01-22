import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";

/* ==========================
   UTILS
========================== */

const sendEmail = async ({ to, subject, text }) => {
    try {
        console.log(`📡 Attempting to send email to ${to}...`);
        const info = await transporter.sendMail({
            from: `MsgBulkHUB <${process.env.SENDER_EMAIL}>`,
            to,
            subject,
            text
        });
        console.log(`✅ Email sent successfully: ${info.messageId}`);
    } catch (error) {
        console.error("❌ Email transmission failed:", error.message);
        // Special log for authenticated user mismatch
        if (error.message.includes('Authenticated sender')) {
            console.error("💡 Check if SENDER_EMAIL matches Brevo verified sender.");
        }
        throw new Error(`Email service failed: ${error.message}`);
    }
};

/* ==========================
   REGISTER
========================== */
export const registerUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ success: false, message: "All fields required" });

    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser)
            return res.status(400).json({ success: false, message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            email,
            password: hashedPassword,
            isVerified: false
        });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        // ✅ Respond immediately
        res.status(201).json({
            success: true,
            message: "Registered successfully",
            userId: user._id,
            token
        });

        // ✅ Welcome email (non-blocking)
        sendEmail({
            to: email,
            subject: "Welcome to MsgBulkHUB 🎉",
            text: "Thank you for registering to MsgBulkHUB. Verify your email to start sending SMS."
        });

    } catch (error) {
        console.error("❌ Register error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ==========================
   LOGIN
========================== */
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ success: false, message: "Missing credentials" });

    try {
        const user = await userModel.findOne({ email });
        if (!user)
            return res.status(400).json({ success: false, message: "User not found" });

        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(400).json({ success: false, message: "Invalid credentials" });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            token
        });

    } catch (error) {
        console.error("❌ Login error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ==========================
   LOGOUT
========================== */
export const logoutUser = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    });

    res.status(200).json({ success: true, message: "Logged out" });
};

/* ==========================
   SEND / RESEND OTP
========================== */
export const sendOtp = async (req, res) => {
    const { userId } = req.body;

    if (!userId)
        return res.status(400).json({ success: false, message: "User ID required" });

    try {
        const user = await userModel.findById(userId);
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        if (user.isVerified)
            return res.status(400).json({ success: false, message: "User already verified" });

        // ⏱ 30 sec resend limit
        if (user.lastOtpSentAt && Date.now() - user.lastOtpSentAt < 30000) {
            return res.status(429).json({
                success: false,
                message: "Please wait before requesting another OTP"
            });
        }

        const otp = Math.floor(1000 + Math.random() * 9000);

        user.otp = otp;
        user.otpExpiry = Date.now() + 10 * 60 * 1000;
        user.lastOtpSentAt = Date.now();
        await user.save();

        // 🔴 OTP email MUST be awaited
        await sendEmail({
            to: user.email,
            subject: "Email Verification - MsgBulkHUB",
            text: `Your OTP is ${otp}. It expires in 10 minutes.`
        });

        res.status(200).json({ success: true, message: "OTP sent successfully" });

    } catch (error) {
        console.error("❌ Send OTP error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* ==========================
   VERIFY OTP
========================== */
export const verifyOtp = async (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !otp)
        return res.status(400).json({ success: false, message: "Missing data" });

    try {
        const user = await userModel.findById(userId);
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        if (!user.otp || user.otpExpiry < Date.now())
            return res.status(400).json({ success: false, message: "OTP expired" });

        if (String(user.otp) !== String(otp))
            return res.status(400).json({ success: false, message: "Invalid OTP" });

        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        user.apiKey = Math.floor(10000 + Math.random() * 90000);
        user.credits = 10;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            apiKey: user.apiKey
        });

    } catch (error) {
        console.error("❌ Verify OTP error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
