const nodemailer = require("nodemailer");

// Brevo SMTP relay — free tier: 300 emails/day, sends to ANY recipient
// (unlike Resend's free tier which needs a verified domain for that)
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER, // your Brevo login email
    pass: process.env.BREVO_SMTP_KEY,  // your Brevo SMTP key (not your Brevo account password)
  },
});

// Must be the email address you verified as a Sender in Brevo
const FROM_ADDRESS = `"Campus Lost & Found" <${process.env.BREVO_SENDER_EMAIL}>`;

const sendOTPEmail = async (toEmail, otp, purpose = "register") => {
  const subjectMap = {
    register: "Verify your account - Lost & Found",
    login: "Your login OTP - Lost & Found",
    reset: "Reset your password - Lost & Found",
  };

  try {
    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
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
    });

    console.log(`OTP email sent to ${toEmail} — messageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Brevo email error:", error);
    throw new Error("Failed to send OTP email");
  }
};

module.exports = { sendOTPEmail };