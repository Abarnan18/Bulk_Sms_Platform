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

app.use(cors({
    origin: (origin, callback) => {
        const allowed = ["https://bulk-sms-platform-frontend.onrender.com", "http://localhost:5173"];
        if (!origin || allowed.includes(origin) || origin.endsWith(".onrender.com")) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"]
}));
app.options("*", cors());
app.set("trust proxy", 1);
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