import mongoose from "mongoose";

// Defining User Schema
const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 6, 
  },

  tc: {
    type: Boolean,
    required: true,
  },
});

// User Model
const userModel = mongoose.model("user", userSchema);

export default userModel;
