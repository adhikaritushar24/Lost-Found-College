// Brevo HTTP API (port 443). Render free par SMTP block hai, isliye nodemailer ki jagah ye use ho raha hai.
// Zaroori env variables: BREVO_API_KEY, BREVO_SENDER_EMAIL

const FROM_NAME = "Campus Lost & Found";

const sendOTPEmail = async (toEmail, otp, purpose = "register") => {
  const subjectMap = {
    register: "Verify your account - Lost & Found",
    login: "Your login OTP - Lost & Found",
    reset: "Reset your password - Lost & Found",
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: process.env.BREVO_SENDER_EMAIL },
        to: [{ email: toEmail }],
        subject: subjectMap[purpose] || "Your OTP Code",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
            <h2 style="color: #1e3a8a;">Campus Lost & Found</h2>
            <p>Your OTP code is:</p>
            <h1 style="letter-spacing: 4px; color: #1e3a8a;">${otp}</h1>
            <p>This code will expire in 5 minutes. Do not share it with anyone.</p>
            <p style="color: #888; font-size: 12px;">If you didn't request this, you can ignore this email.</p>
          </div>
        `,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Brevo API error:", res.status, data);
      throw new Error("Failed to send OTP email");
    }

    console.log(`OTP email sent to ${toEmail} - messageId: ${data.messageId}`);
    return data;
  } catch (error) {
    console.error("Brevo email error:", error.message);
    throw new Error("Failed to send OTP email");
  } finally {
    clearTimeout(timer);
  }
};

module.exports = { sendOTPEmail };