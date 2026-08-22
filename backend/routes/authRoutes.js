const express = require("express");
const router = express.Router();
const {
  registerUser,
  verifyOTPController,
  resendOTP,
  loginUser,
  getProfile,
  updateProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/verify-otp", verifyOTPController);
router.post("/resend-otp", resendOTP);
router.post("/login", loginUser);

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

module.exports = router;
