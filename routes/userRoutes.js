import express from "express";
import {
  changeUserPassword,
  currentUser,
  loginUser,
  registerUser,
  sendUserPasswordResetEmail,
  userPasswordReset,
} from "../controllers/userController.js";
import checkUserAuth from "../middlewares/authMiddleware.js";
const router = express.Router();

//Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/send-reset-password-email", sendUserPasswordResetEmail);
router.post("/reset-password/:id/:token", userPasswordReset);

//Protected Routes
router.get("/current", checkUserAuth, currentUser);
router.post("/changepassword", checkUserAuth, changeUserPassword);
export default router;
