const nodemailer = require("nodemailer");

// Reusable transporter (Gmail example — swap for college SMTP if available)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // use an App Password, not your real Gmail password
  },
});

const sendOTPEmail = async (toEmail, otp, purpose = "register") => {
  const subjectMap = {
    register: "Verify your account - Lost & Found",
    login: "Your login OTP - Lost & Found",
    reset: "Reset your password - Lost & Found",
  };

  const mailOptions = {
    from: `"Campus Lost & Found" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: subjectMap[purpose] || "Your OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #1e3a8a;">Campus Lost & Found</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 4px; color: #1e3a8a;">${otp}</h1>
        <p>This code will expire in 5 minutes. Do not share it with anyone.</p>
        <p style="color: #888; font-size: 12px;">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
