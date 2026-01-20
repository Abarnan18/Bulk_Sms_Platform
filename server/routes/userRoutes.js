import express from "express";
import { getUser } from "../operators/userController.js";
import { authRole } from "../middleware/roleMiddleware.js";
import { verifyToken } from "../middleware/userAuth.js";

import { createRequest, getMyRequests } from "../operators/requestController.js";

const userRouter = express.Router();

//only admin can acess this route
userRouter.get("/admin", verifyToken, authRole("admin"), (req, res) => {
    res.json({ success: true, message: "Admin" })
})

//user and admin can access this route
userRouter.get("/user", verifyToken, authRole("user", "admin"), (req, res) => {
    res.json({ success: true, message: "User" })
});

// Request routes (User)
userRouter.post("/request", verifyToken, createRequest);
userRouter.get("/requests", verifyToken, getMyRequests);
userRouter.get("/data", verifyToken, getUser);

export default userRouter;
