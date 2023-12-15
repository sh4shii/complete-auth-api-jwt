import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import transporter from "../config/emailConfig.js";

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, password_confirmation, tc } = req.body;
  if (!name || !email || !password || !password_confirmation || !tc) {
    return res.status(400).json({ error: "All fields are mandatory" });
  }

  const user = await userModel.findOne({ email: email });

  if (user) {
    return res.status(400).json({ error: "Email already exists" });
  } else {
    if (password !== password_confirmation) {
      return res
        .status(400)
        .json({ error: "Password and Confirm Password don't match" });
    } else {
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await userModel.create({
          name,
          email,
          password: hashedPassword,
          tc,
        });

        // Generate JWT Token
        const token = jwt.sign(
          { userID: user._id },
          process.env.JWT_SECRET_KEY,
          { expiresIn: "1d" }
        );

        res.status(201).json({
          status: "success",
          message: "Registration Success",
          token,
        });
      } catch (error) {
        console.log(error);
        res.send({ status: "failed", message: "Unable to Register" });
      }
    }
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "All fields are mandatory" });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Cannot find user by this email" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (user.email !== email || !isPasswordCorrect) {
      return res.status(400).json({ error: "Email or Password is incorrect" });
    }

    const accessToken = jwt.sign(
      { userID: user._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1d",
      }
    );
    res.status(200).json({
      accessToken,
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

const currentUser = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});

const changeUserPassword = asyncHandler(async (req, res) => {
  const { password, password_confirmation } = req.body;
  if (!password || !password_confirmation) {
    return res.status(400).json({ message: "All fields are mandatory" });
  }

  if (password !== password_confirmation) {
    return res
      .status(400)
      .json({ message: "New Password and Confirm New Password doesn't match" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(password, salt);
    await userModel.findByIdAndUpdate(req.user._id, {
      $set: { password: newHashedPassword },
    });
    res.status(200).json({ message: "Password changed succesfully" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error changing password. Please try again later." });
  }
});

const sendUserPasswordResetEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email field is required" });
  }

  const user = await userModel.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "Email doesn't exists" });
  }
  
  const secret = user._id + process.env.JWT_SECRET_KEY;
  const token = jwt.sign({ userID: user._id }, secret, { expiresIn: "15m" });
  const link = `http://127.0.0.1:3000/api/user/reset/${user._id}/${token}`;
  console.log(link);

  //Send Email
  try {
    const mailDetails = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Test mail - Password Reset Link",
      html: `<a href=${link}>Click Here</a> to Reset Your Password`,
    };

    // Use async/await for cleaner code
    const data = await transporter.sendMail(mailDetails);
    console.log("Email sent successfully");
    res.status(200).json({ message: "Please check your email", info: data });
  } catch (error) {
    console.log("Error Occurs:", error.message);
    res.status(500).json({ message: "Can't send mail", error: error.message });
  }
});

const userPasswordReset = asyncHandler(async (req, res) => {
  const { password, password_confirmation } = req.body;
  const { id, token } = req.params;

  if (!password || !password_confirmation) {
    return res.status(400).json({ message: "All fields are mandatory" });
  }

  const user = await userModel.findById(id);

  if (!user) {
    return res.status(404).json({ message: "Email doesn't exists" });
  }

  if (password !== password_confirmation) {
    return res
      .status(400)
      .json({ message: "New Password and Confirm New Password doesn't match" });
  }

  const new_secret = user._id + process.env.JWT_SECRET_KEY;

  try {
    jwt.verify(token, new_secret);
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(password, salt);
    await userModel.findByIdAndUpdate(user._id, {
      $set: { password: newHashedPassword },
    });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.log(error);
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      return res.status(400).json({
        message: "Invalid or expired reset token. Please request a new one.",
      });
    }
    res
      .status(500)
      .json({ message: "Error changing password. Please try again later." });
  }
});

export {
  registerUser,
  loginUser,
  currentUser,
  changeUserPassword,
  sendUserPasswordResetEmail,
  userPasswordReset,
};
