import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import router from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import testRouter from "./routes/testRoutes.js";
import adminRouter from "./routes/adminRoutes.js";

const app = express();
const port = process.env.PORT || 5000;

connectDB();

// ✅ CORS (FIXED)
app.use(cors({
    origin: [
        "https://bulk-sms-platform-frontend.onrender.com",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    credentials: true
}));

// ✅ Handle preflight
app.options("/", cors());

// ✅ Body + cookies
app.use(express.json());
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
    res.send("The API is Working Great");
});

app.use("/api/auth", router);
app.use("/api/user", userRouter);
app.use("/api/msg", messageRouter);
app.use("/api/admin", adminRouter);
app.use("/api/test", testRouter);

app.listen(port, () => console.log(`Server is running on port ${port}`));
















// import express, { Router } from "express";
// import "dotenv/config";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import connectDB from "./config/mongodb.js";
// import router from "./routes/authRoutes.js";
// import userRouter from "./routes/userRoutes.js";
// import messageRouter from "./routes/messageRoutes.js";
// import testRouter from "./routes/testRoutes.js";
// import adminRouter from "./routes/adminRoutes.js";

// const app = express(); //create express app 

// const port = process.env.PORT || 5000;

// connectDB();

// // 1️⃣ CORS middleware - handles regular requests and preflight for all routes
// const allowedOrigins = [
//     "https://bulk-sms-platform-frontend.onrender.com",
//     "http://localhost:5173", // for local development
//     "http://localhost:3000"
// ];

// app.use(cors({
//     origin: function (origin, callback) {
//         // allow requests with no origin (like mobile apps or curl requests)
//         if (!origin) return callback(null, true);
//         if (allowedOrigins.indexOf(origin) !== -1) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
//     allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
//     exposedHeaders: ["Content-Type"],
//     optionsSuccessStatus: 200 // Some legacy browsers choke on 204
// }));

// // 2️⃣ Body parsers (cors middleware above already handles preflight)
// app.use(cookieParser());
// app.use(express.json());

// //API endpoints Starts
// app.get("/", (req, res) => {
//     res.send("The API is Working Great")
// })
// app.use("/api/auth", router);
// app.use("/api/user", userRouter);
// app.use("/api/msg", messageRouter);
// app.use("/api/admin", adminRouter);
// app.use("/api/test", testRouter)

// app.listen(port, () => console.log(`Server is running on port ${port}`));
