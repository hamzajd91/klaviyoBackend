const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../models/users");
const axios = require("axios");
const { getMatrixKey } = require("../services/klaviyoService");

const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY;

// @desc    Register a new user
// @route   POST /api/users/signup
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    name,
    companyName,
    profilePicture,
    about
  } = req.body;


  if (!email || !password || !name || !companyName) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // const matrixKey = await getMatrixKey();
  // if (!matrixKey) {
  //     //  return res.status(400).json({ message: "userId and matrixKey are required" });
  //     console.log("Matrix key not found");
  //     }



  const newUser = await User.create({
    email,
    password: hashedPassword,
    name,
    companyName,
    about,
    // klaviyo : {
      // matrixKey: matrixKey || null
    // }
    
  });

  if (newUser) {
    res.status(201).json({
      _id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      companyName: newUser.companyName,
      klaviyo: newUser.klaviyo,
      token: generateToken(newUser._id),
    });
  } else {
    res.status(400);
    throw new Error("User creation failed");
  }
});

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  
  if (user && (await bcrypt.compare(password, user.password))) {
  // if (user){
    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      companyName: user.companyName,
      profilePicture: user.profilePicture,
      klaviyo: user.klaviyo,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const {
    name,
    companyName,
    profilePicture,
    about,
    active,
    newsletterSub,
    timezone,
  } = req.body;

  user.name = name || user.name;
  user.companyName = companyName || user.companyName;
  user.profilePicture = profilePicture || user.profilePicture;
  user.about = about || user.about;
  user.active = active ?? user.active;
  user.newsletterSub = newsletterSub ?? user.newsletterSub;
  user.timezone = timezone || user.timezone;

  const updatedUser = await user.save();

  res.status(200).json({
    _id: updatedUser._id,
    email: updatedUser.email,
    name: updatedUser.name,
    companyName: updatedUser.companyName,
    profilePicture: updatedUser.profilePicture,
    about: updatedUser.about,
    active: updatedUser.active,
  });
});

// @desc    Delete user by ID
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({ message: "User deleted" });
});

// @desc    Delete all users
// @route   DELETE /api/users
// @access  Admin
const deleteAllUsers = asyncHandler(async (req, res) => {
  await User.deleteMany({});
  res.status(200).json({ message: "All users deleted" });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.status(200).json(users);
});

// @desc    Reset password
// @route   POST /api/users/reset-password
// @access  Public (via token)
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    res.status(400);
    throw new Error("Missing token or password");
  }

  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired token");
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.status(200).json({ message: "Password reset successful" });
});

// JWT generator
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};





module.exports = {
  registerUser,
  loginUser,
  updateUserProfile,
  deleteUser,
  deleteAllUsers,
  getUsers,
  resetPassword,
};
