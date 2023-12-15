import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import AsyncHandler from "express-async-handler";

const checkUserAuth = AsyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.Authorization || req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
      if (err) {
        res.status(401).json({ message: "User is not authorized" });
      } else {
        const userID = decoded.userID;
        // Get User from Token
        req.user = await userModel.findById(userID).select("-password");
        next();
      }
    });
  }

  if (!token) {
    res
      .status(401)
      .json({ message: "User is not authorized or token is missing" });
  }
});

export default checkUserAuth;
