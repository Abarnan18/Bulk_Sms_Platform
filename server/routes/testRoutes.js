import express from "express";
import {apiKeyAuth} from "../middleware/apiKeyAuth.js";

const testRouter = express.Router();

testRouter.get("/protected-test", apiKeyAuth, (req, res) => {
  res.status(200).json({
    message: "Middleware passed",
    user: {
      email: req.user.email,
      credits: req.user.credits,
    },
  });
});

export default testRouter;
