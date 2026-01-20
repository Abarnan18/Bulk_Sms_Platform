import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    type: {
        type: String,
        enum: ["unblock", "credit"],
        required: true
    },
    amount: {
        type: Number,
        default: 0 // Used for credit requests
    },
    reason: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    }
}, { timestamps: true });

const requestModel = mongoose.model.request || mongoose.model("request", requestSchema);

export default requestModel;
