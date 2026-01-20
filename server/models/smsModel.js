import mongoose from "mongoose";

const smsSchema = new mongoose.Schema({
    to: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "sent", "failed"],
        default: "pending"
    },
    sender_id: {
        type: String,
        required: true,
        default: "TextLKDemo"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

})

const smsModel = mongoose.model("sms", smsSchema);

export default smsModel;
