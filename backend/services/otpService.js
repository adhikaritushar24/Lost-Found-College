const OTP = require("../models/OTP");
const generateOTP = require("../utils/generateOTP");
const { sendOTPEmail } = require("./emailService");

// Creates a new OTP, saves it, and emails it to the user
const createAndSendOTP = async (email, purpose = "register") => {
  const otp = generateOTP();

  // Remove any previous unused OTPs for this email + purpose
  await OTP.deleteMany({ email, purpose });

  await OTP.create({ email, otp, purpose });
  await sendOTPEmail(email, otp, purpose);

  return true;
};

// Verifies an OTP against what's stored in DB
const verifyOTP = async (email, otp, purpose = "register") => {
  const record = await OTP.findOne({ email, otp, purpose });

  if (!record) {
    return { valid: false, message: "Invalid or expired OTP" };
  }

  // OTP is correct — clean it up so it can't be reused
  await OTP.deleteOne({ _id: record._id });

  return { valid: true };
};

module.exports = { createAndSendOTP, verifyOTP };
