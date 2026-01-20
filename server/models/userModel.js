import mongoose from "mongoose";

const userSchema = new mongoose.Schema({//crearing a user schema
    email: {
        type: String,
        required: true,
        unique: true // An email can't be used by multiple users
    },
    password: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    apiKey: {
        type: String,
        unique: true,
        sparse: true
    },
    credits: {
        type: Number,
        default: 0,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const userModel = mongoose.model.user || mongoose.model("user", userSchema);
//it prevents the overwriting of the model and also use the model if exists or create a new model if not exists

export default userModel;