













import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";

//Registering New User
export const registerUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" })
    }

    try {
        const existingUser = await userModel.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" })
        }
        const hashedPassword = await bcrypt.hash(password, 10);//hashing the password
        const user = await userModel.create({ email, password: hashedPassword })
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Welcome to MsgBulkHUB-send A LOT....",
            text: `Thank you for registering to the MsgBulkHUB. You can now Send Bulk sms within minutes`
        }

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: "User registered successfully" })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

//Login User
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" })
    }
    try {
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" })
        }
        const isPasswordMatched = await bcrypt.compare(password, user.password)
        if (!isPasswordMatched) {
            return res.status(400).json({ success: false, message: "Invalid credentials" })
        }
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })

        if (user.role === "admin") {
            return res.status(200).json({ success: true, message: "Admin logged in successfully", token })
        } else {
            return res.status(200).json({ success: true, message: "User logged in successfully", token })
        }
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

//Logout User and Clear Cookies when user logs out
export const logoutUser = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        return res.status(200).json({ success: true, message: "User logged out successfully" })
    }
    catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

//Send OTP
export const sendOtp = async (req, res) => {
    try {
        const { userId, resend } = req.body;
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: "User is already verified" })
        }

        // Check for existing valid OTP if NOT a resend request
        if (!resend && user.otp && user.otpExpiry > Date.now()) {
            return res.status(200).json({
                success: true,
                message: "A valid verification code already exists. Please use that or wait to resend.",
                reusing: true
            });
        }

        // Check 30s limit for resend
        if (user.lastOtpSentAt && (Date.now() - new Date(user.lastOtpSentAt).getTime() < 30000)) {
            const timeLeft = Math.ceil((30000 - (Date.now() - new Date(user.lastOtpSentAt).getTime())) / 1000);
            return res.status(400).json({
                success: false,
                message: `Please wait ${timeLeft} seconds before requesting a new code.`
            });
        }

        const otp = Math.floor(1000 + Math.random() * 9000);
        user.otp = otp;
        user.otpExpiry = Date.now() + 10 * 60 * 1000;
        user.lastOtpSentAt = Date.now();
        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "E-Mail Verification",
            text: `Your OTP is ${otp}. It will expire in 10 minutes.`
        }

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: `Verification code sent to ${user.email}` })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

//Verify OTP
export const verifyOtp = async (req, res) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
        return res.status(400).json({ success: false, message: "Missing Credintials" })
    }
    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" })
        }
        if (String(user.otp) !== String(otp) || user.otp === "" || user.otpExpiry < Date.now()) {
            return res.status(400).json({ success: false, message: "Invalid OTP or OTP expired" })
        }
        user.isVerified = true;
        user.otp = "";
        user.otpExpiry = null;
        user.apiKey = Math.floor(10000 + Math.random() * 90000);
        user.credits = 10;
        await user.save();
        return res.status(200).json({ success: true, message: `Verified succesfully.Congratulations! You get 10 credits for free!! The Api key is ${user.apiKey}` })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}













//this the old code below




// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import userModel from "../models/userModel.js";
// import transporter from "../config/nodemailer.js";

// // ==========================
// // REGISTER USER
// // ==========================


// export const registerUser = async (req, res) => {
//     const { email, password } = req.body;

//     if (!email || !password) {
//         return res.status(400).json({
//             success: false,
//             message: "All fields are required"
//         });
//     }

//     try {
//         const existingUser = await userModel.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({
//                 success: false,
//                 message: "User already exists"
//             });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         const user = await userModel.create({
//             email,
//             password: hashedPassword
//         });

//         // Generate JWT token
//         const token = jwt.sign(
//             { id: user._id, role: user.role },
//             process.env.JWT_SECRET,
//             { expiresIn: process.env.JWT_EXPIRY }
//         );

//         // Set cookie immediately
//         res.cookie("token", token, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production", // secure only in production
//             sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//             maxAge: 24 * 60 * 60 * 1000
//         });

//         // ✅ Respond to client immediately
//         res.status(200).json({
//             success: true,
//             message: "User registered successfully",
//             token
//         });

//         // Send welcome email asynchronously (doesn't block response)
//         transporter.sendMail({
//             from: process.env.SENDER_EMAIL,
//             to: email,
//             subject: "Welcome to MsgBulkHUB",
//             text: "Thank you for registering to MsgBulkHUB. You can now send bulk SMS within minutes."
//         })
//         .then(() => console.log(`📧 Welcome email sent to ${email}`))
//         .catch(err => console.error(`❌ Failed to send email to ${email}:`, err));

//     } catch (error) {
//         console.error("❌ Registration error:", error.message, error);
//         return res.status(500).json({
//             success: false,
//             message: "Registration failed: " + error.message
//         });
//     }
// };




// // export const registerUser = async (req, res) => {
// //     const { email, password } = req.body;

// //     if (!email || !password) {
// //         return res.status(400).json({
// //             success: false,
// //             message: "All fields are required"
// //         });
// //     }

// //     try {
// //         const existingUser = await userModel.findOne({ email });
// //         if (existingUser) {
// //             return res.status(400).json({
// //                 success: false,
// //                 message: "User already exists"
// //             });
// //         }

// //         const hashedPassword = await bcrypt.hash(password, 10);

// //         const user = await userModel.create({
// //             email,
// //             password: hashedPassword,
// //             role: "user",
// //             isVerified: false
// //         });

// //         const token = jwt.sign(
// //             { id: user._id, role: user.role },
// //             process.env.JWT_SECRET,
// //             { expiresIn: process.env.JWT_EXPIRY }
// //         );

// //         res.cookie("token", token, {
// //             httpOnly: true,
// //             secure: true,
// //             sameSite: "none",
// //             maxAge: 24 * 60 * 60 * 1000
// //         });

// //         await transporter.sendMail({
// //             from: process.env.SENDER_EMAIL,
// //             to: email,
// //             subject: "Welcome to MsgBulkHUB",
// //             text: "Thank you for registering to MsgBulkHUB. You can now send bulk SMS within minutes."
// //         });

// //         return res.status(200).json({
// //             success: true,
// //             message: "User registered successfully",
// //             token
// //         });

// //     } catch (error) {
// //         console.error("❌ Registration error:", error.message, error);
// //         return res.status(500).json({
// //             success: false,
// //             message: "Registration failed: " + error.message
// //         });
// //     }
// // };

// // ==========================
// // LOGIN USER 
// // ==========================
// export const loginUser = async (req, res) => {
//     const { email, password } = req.body;

//     if (!email || !password) {
//         return res.status(400).json({ success: false, message: "Email and password are required" });
//     }

//     try {
//         const user = await userModel.findOne({ email });
//         if (!user) {
//             return res.status(400).json({ success: false, message: "User not found" });
//         }

//         const isPasswordMatched = await bcrypt.compare(password, user.password);
//         if (!isPasswordMatched) {
//             return res.status(400).json({ success: false, message: "Invalid credentials" });
//         }

//         const token = jwt.sign(
//             { id: user._id, role: user.role },
//             process.env.JWT_SECRET,
//             { expiresIn: process.env.JWT_EXPIRY }
//         );

//         res.cookie("token", token, {
//             httpOnly: true,
//             secure: true,
//             sameSite: "none",
//             maxAge: 24 * 60 * 60 * 1000
//         });

//         if (user.role === "admin") {
//             return res.status(200).json({ success: true, message: "Admin logged in successfully", token });
//         } else {
//             return res.status(200).json({ success: true, message: "User logged in successfully", token });
//         }

//     } catch (error) {
//         console.error("❌ Login error:", error.message, error);
//         return res.status(500).json({ 
//             success: false, 
//             message: "Login failed: " + error.message 
//         });
//     }
// };

// // ==========================
// // LOGOUT USER
// // ==========================
// export const logoutUser = async (req, res) => {
//     try {
//         res.clearCookie("token", {
//             httpOnly: true,
//             secure: true,
//             sameSite: "none"
//         });

//         return res.status(200).json({
//             success: true,
//             message: "User logged out successfully"
//         });

//     } catch (error) {
//         return res.json({ success: false, message: error.message });
//     }
// };



// // ==========================
// // SEND OTP
// // ==========================
// export const sendOtp = async (req, res) => {
//     try {
//         const { userId } = req.body;

//         if (!userId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "User ID is required"
//             });
//         }

//         const user = await userModel.findById(userId);
//         if (!user) {
//             return res.status(400).json({ success: false, message: "User not found" });
//         }

//         if (user.isVerified) {
//             return res.status(400).json({ success: false, message: "User already verified" });
//         }

//         // Generate OTP
//         const otp = Math.floor(1000 + Math.random() * 9000);
//         user.otp = otp;
//         user.otpExpiry = Date.now() + 10 * 60 * 1000;
//         user.lastOtpSentAt = Date.now();
//         await user.save();

//         // ✅ Respond to client immediately
//         res.status(200).json({
//             success: true,
//             message: `OTP sent successfully to ${user.email}`
//         });

//         // Send email asynchronously
//         transporter.sendMail({
//             from: process.env.SENDER_EMAIL,
//             to: user.email,
//             subject: "E-Mail Verification",
//             text: `Your OTP is ${otp}. It will expire in 10 minutes.`
//         })
//         .then(() => console.log(`📧 OTP sent to ${user.email}`))
//         .catch(err => console.error(`❌ Failed to send OTP to ${user.email}:`, err));

//     } catch (error) {
//         console.error("❌ Send OTP error:", error);
//         return res.status(500).json({ success: false, message: error.message });
//     }
// };

// // ==========================
// // VERIFY OTP
// // ==========================
// export const verifyOtp = async (req, res) => {
//     const { userId, otp } = req.body;

//     if (!userId || !otp) {
//         return res.status(400).json({ success: false, message: "Missing credentials" });
//     }

//     try {
//         const user = await userModel.findById(userId);
//         if (!user) {
//             return res.status(400).json({ success: false, message: "User not found" });
//         }

//         if (!user.otp || user.otpExpiry < Date.now()) {
//             return res.status(400).json({ success: false, message: "OTP expired" });
//         }

//         if (String(user.otp) !== String(otp)) {
//             return res.status(400).json({ success: false, message: "Invalid OTP" });
//         }

//         // Mark user as verified
//         user.isVerified = true;
//         user.otp = null;
//         user.otpExpiry = null;
//         user.apiKey = Math.floor(10000 + Math.random() * 90000);
//         user.credits = 10; // consistent with registration reward
//         await user.save();

//         return res.status(200).json({
//             success: true,
//             message: "Account verified successfully"
//         });

//     } catch (error) {
//         console.error("❌ Verify OTP error:", error);
//         return res.status(500).json({ success: false, message: error.message });
//     }
// };








// // ==========================
// // SEND OTP
// // ==========================
// // export const sendOtp = async (req, res) => {
// //     try {
// //         const { userId } = req.body;

// //         if (!userId) {
// //             return res.status(400).json({
// //                 success: false,
// //                 message: "User ID is required"
// //             });
// //         }

// //         const user = await userModel.findById(userId);
// //         if (!user) {
// //             return res.status(400).json({ success: false, message: "User not found" });
// //         }

// //         if (user.isVerified) {
// //             return res.status(400).json({ success: false, message: "User already verified" });
// //         }

// //         const otp = Math.floor(1000 + Math.random() * 9000);
// //         user.otp = otp;
// //         user.otpExpiry = Date.now() + 10 * 60 * 1000;
// //         user.lastOtpSentAt = Date.now();
// //         await user.save();

// //         await transporter.sendMail({
// //             from: process.env.SENDER_EMAIL,
// //             to: user.email,
// //             subject: "E-Mail Verification",
// //             text: `Your OTP is ${otp}. It will expire in 10 minutes.`
// //         });

// //         return res.status(200).json({ success: true, message: "OTP sent successfully" });

// //     } catch (error) {
// //         return res.status(400).json({ success: false, message: error.message });
// //     }
// // };

// // // ==========================
// // // VERIFY OTP
// // // ==========================
// // export const verifyOtp = async (req, res) => {
// //     const { userId, otp } = req.body;

// //     if (!userId || !otp) {
// //         return res.status(400).json({ success: false, message: "Missing credentials" });
// //     }

// //     try {
// //         const user = await userModel.findById(userId);
// //         if (!user) {
// //             return res.status(400).json({ success: false, message: "User not found" });
// //         }

// //         if (!user.otp || user.otpExpiry < Date.now()) {
// //             return res.status(400).json({ success: false, message: "OTP expired" });
// //         }

// //         if (String(user.otp) !== String(otp)) {
// //             return res.status(400).json({ success: false, message: "Invalid OTP" });
// //         }

// //         user.isVerified = true;
// //         user.otp = null;
// //         user.otpExpiry = null;
// //         user.apiKey = Math.floor(10000 + Math.random() * 90000);
// //         user.credits = 0;
// //         await user.save();

// //         return res.status(200).json({
// //             success: true,
// //             message: "Account verified successfully"
// //         });

// //     } catch (error) {
// //         return res.status(400).json({ success: false, message: error.message });
// //     }
// // };









// // import bcrypt from "bcryptjs";
// // import jwt from "jsonwebtoken";
// // import userModel from "../models/userModel.js";
// // import transporter from "../config/nodemailer.js";

// // //Registering New User
// // export const registerUser = async (req, res) => {
// //     const { email, password } = req.body;

// //     if (!email || !password) {
// //         return res.status(400).json({ success: false, message: "All fields are required" })
// //     }

// //     try {
// //         const existingUser = await userModel.findOne({ email })
// //         if (existingUser) {
// //             return res.status(400).json({ success: false, message: "User already exists" })
// //         }
// //         const hashedPassword = await bcrypt.hash(password, 10);//hashing the password
// //         const user = await userModel.create({ email, password: hashedPassword })
// //         await user.save();

// //         const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });

// //         res.cookie("token", token, {
// //             httpOnly: true,
// //             secure: true,
// //             sameSite: "none",
// //             maxAge: 24 * 60 * 60 * 1000, // 24 hours
// //         })

// //         const mailOptions = {
// //             from: process.env.SENDER_EMAIL,
// //             to: email,
// //             subject: "Welcome to MsgBulkHUB-send A LOT....",
// //             text: `Thank you for registering to the MsgBulkHUB. You can now Send Bulk sms within minutes`
// //         }

// //         await transporter.sendMail(mailOptions);
// //         return res.status(200).json({ success: true, message: "User registered successfully", token })
// //     } catch (error) {
// //         return res.json({ success: false, message: error.message })
// //     }
// // }

// // //Login User
// // export const loginUser = async (req, res) => {
// //     const { email, password } = req.body;

// //     if (!email || !password) {
// //         return res.status(400).json({ success: false, message: "Email and password are required" })
// //     }
// //     try {
// //         const user = await userModel.findOne({ email })
// //         if (!user) {
// //             return res.status(400).json({ success: false, message: "User not found" })
// //         }
// //         const isPasswordMatched = await bcrypt.compare(password, user.password)
// //         if (!isPasswordMatched) {
// //             return res.status(400).json({ success: false, message: "Invalid credentials" })
// //         }
// //         const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });

// //         res.cookie("token", token, {
// //             httpOnly: true,
// //             secure: true,
// //             sameSite: "none",
// //             maxAge: 24 * 60 * 60 * 1000, // 24 hours
// //         })

// //         if (user.role === "admin") {
// //             return res.status(200).json({ success: true, message: "Admin logged in successfully", token })
// //         } else {
// //             return res.status(200).json({ success: true, message: "User logged in successfully", token })
// //         }
// //     } catch (error) {
// //         return res.json({ success: false, message: error.message })
// //     }
// // }

// // //Logout User and Clear Cookies when user logs out
// // export const logoutUser = async (req, res) => {
// //     try {
// //         res.clearCookie('token', {
// //             httpOnly: true,
// //             secure: true,
// //             sameSite: "none"
// //         })
// //         return res.status(200).json({ success: true, message: "User logged out successfully" })
// //     }
// //     catch (error) {
// //         return res.json({ success: false, message: error.message })
// //     }
// // }

// // //Send OTP
// // export const sendOtp = async (req, res) => {
// //     try {
// //         const { userId, resend } = req.body;
// //         const user = await userModel.findById(userId);

// //         if (!user) {
// //             return res.status(404).json({ success: false, message: "User not found" });
// //         }

// //         if (user.isVerified) {
// //             return res.status(400).json({ success: false, message: "User is already verified" })
// //         }

// //         // Check for existing valid OTP if NOT a resend request
// //         if (!resend && user.otp && user.otpExpiry > Date.now()) {
// //             return res.status(200).json({
// //                 success: true,
// //                 message: "A valid verification code already exists. Please use that or wait to resend.",
// //                 reusing: true
// //             });
// //         }

// //         // Check 30s limit for resend
// //         if (user.lastOtpSentAt && (Date.now() - new Date(user.lastOtpSentAt).getTime() < 30000)) {
// //             const timeLeft = Math.ceil((30000 - (Date.now() - new Date(user.lastOtpSentAt).getTime())) / 1000);
// //             return res.status(400).json({
// //                 success: false,
// //                 message: `Please wait ${timeLeft} seconds before requesting a new code.`
// //             });
// //         }

// //         const otp = Math.floor(1000 + Math.random() * 9000);
// //         user.otp = otp;
// //         user.otpExpiry = Date.now() + 10 * 60 * 1000;
// //         user.lastOtpSentAt = Date.now();
// //         await user.save();

// //         const mailOptions = {
// //             from: process.env.SENDER_EMAIL,
// //             to: user.email,
// //             subject: "E-Mail Verification",
// //             text: `Your OTP is ${otp}. It will expire in 10 minutes.`
// //         }

// //         await transporter.sendMail(mailOptions);
// //         return res.status(200).json({ success: true, message: `Verification code sent to ${user.email}` })

// //     } catch (error) {
// //         res.status(500).json({ success: false, message: error.message })
// //     }
// // }

// // //Verify OTP
// // export const verifyOtp = async (req, res) => {
// //     const { userId, otp } = req.body;
// //     if (!userId || !otp) {
// //         return res.status(400).json({ success: false, message: "Missing Credintials" })
// //     }
// //     try {
// //         const user = await userModel.findById(userId);
// //         if (!user) {
// //             return res.status(400).json({ success: false, message: "User not found" })
// //         }
// //         if (String(user.otp) !== String(otp) || user.otp === "" || user.otpExpiry < Date.now()) {
// //             return res.status(400).json({ success: false, message: "Invalid OTP or OTP expired" })
// //         }
// //         user.isVerified = true;
// //         user.otp = "";
// //         user.otpExpiry = null;
// //         user.apiKey = Math.floor(10000 + Math.random() * 90000);
// //         user.credits = 10;
// //         await user.save();
// //         return res.status(200).json({ success: true, message: `Verified succesfully.Congratulations! You get 10 credits for free!! The Api key is ${user.apiKey}` })

// //     } catch (error) {
// //         res.status(500).json({ success: false, message: error.message })
// //     }
// // }

