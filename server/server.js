import express, { Router } from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import router from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import testRouter from "./routes/testRoutes.js";
import adminRouter from "./routes/adminRoutes.js";

const app = express(); //create express app 

const port = process.env.PORT || 5000;

connectDB();

//  CORS middleware comes first
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            "https://bulk-sms-platform-frontend.onrender.com"//host frontend link
        ];
        if (!origin) return callback(null, true); // allow Postman/server calls
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-api-key"]  //# Added x-api-key for API key auth
}));

// 2️⃣ Handle preflight requests
app.options("*", cors());

// 3️⃣ Body parsers
app.use(cookieParser());
app.use(express.json());

//API endpoints Starts
app.get("/", (req, res) => {
    res.send("The API is Working Great")
})
app.use("/api/auth", router);
app.use("/api/user", userRouter);
app.use("/api/msg", messageRouter);
app.use("/api/admin", adminRouter);
app.use("/api/test", testRouter)

app.listen(port, () => console.log(`Server is running on port ${port}`));
