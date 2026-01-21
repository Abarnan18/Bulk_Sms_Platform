import mongoose from "mongoose";

const connectDB = async () => {

    try {
        mongoose.connection.on("connected", () => {
            console.log("MongoDB connected");
        })
        mongoose.connection.on("error", (err) => {
            console.error("MongoDB connection error:", err);
        })

        await mongoose.connect(`${process.env.MONGODB_URI}Mini_Sms`);
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error.message);
        // Do not crash immediately, allowing retries or clean exit
    }
}

export default connectDB;