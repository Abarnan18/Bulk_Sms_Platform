import express from "express";
import { verifyToken } from "../middleware/userAuth.js";
import { authRole } from "../middleware/roleMiddleware.js";
import {
    addCredits,
    blockUser,
    unBlockUser,
    getAllUsers,
    singleUser,
    viewAllSms
} from "../operators/adminController.js";
import { getPendingRequests, handleRequest } from "../operators/requestController.js";

const adminRouter = express.Router();

// Apply check to all routes: Must be logged in and must be an Admin
adminRouter.use(verifyToken);
adminRouter.use(authRole("admin"));

// User Management
adminRouter.get("/users", getAllUsers);
adminRouter.get("/user/:identifier", singleUser);
adminRouter.post("/add-credits/:userId", addCredits);
adminRouter.post("/block-user/:userId", blockUser);
adminRouter.post("/unblock-user/:userId", unBlockUser);

// SMS History with filtering
adminRouter.get("/sms-history", viewAllSms);

// Request Management
adminRouter.get("/requests", getPendingRequests);
adminRouter.post("/handle-request", handleRequest);

export default adminRouter;
