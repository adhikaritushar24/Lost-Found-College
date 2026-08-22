const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { createAndSendOTP, verifyOTP } = require("../services/otpService");

// @desc    Register a new user + send OTP
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, rollNumber, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "User already exists. Please login." });
    }

    // If user exists but never verified, update their details and resend OTP
    let user;
    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name;
      existingUser.password = password;
      existingUser.rollNumber = rollNumber;
      existingUser.phone = phone;
      user = await existingUser.save();
    } else {
      user = await User.create({ name, email, password, rollNumber, phone });
    }

    await createAndSendOTP(email, "register");

    res.status(201).json({
      message: "Registered successfully. OTP sent to your email.",
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and activate account
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTPController = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const result = await verifyOTP(email, otp, "register");

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Account verified successfully",
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP (register or login)
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    await createAndSendOTP(email, purpose || "register");

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      // Not verified yet — send a fresh OTP so they can complete verification
      await createAndSendOTP(email, "register");
      return res.status(403).json({
        message: "Account not verified. A new OTP has been sent to your email.",
        needsVerification: true,
      });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update logged-in user's profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.rollNumber = req.body.rollNumber || user.rollNumber;
    user.avatar = req.body.avatar || user.avatar;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      rollNumber: updatedUser.rollNumber,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  verifyOTPController,
  resendOTP,
  loginUser,
  getProfile,
  updateProfile,
};
