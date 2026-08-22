import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import useAuth from "../../hooks/useAuth";
import { isValidOTP } from "../../utils/validators";

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOTP } = useAuth();

  const emailFromState = location.state?.email || "";

  const [email] = useState(emailFromState);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!isValidOTP(otp)) {
      return setError("Enter the 6-digit OTP sent to your email");
    }

    try {
      setLoading(true);
      await verifyOTP(email, otp);
      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    try {
      setResending(true);
      await authService.resendOTP(email, "register");
      setInfo("A new OTP has been sent to your email");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8">
        <h1 className="text-2xl font-bold text-navy-800 mb-1">Verify Your Email</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Enter the 6-digit code sent to <span className="font-medium">{email}</span>
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        {info && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md mb-4">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
            className="w-full border rounded-md px-3 py-2 text-center tracking-[6px] text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-800 transition disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <button
          onClick={handleResend}
          disabled={resending}
          className="w-full text-sm text-blue-900 font-medium mt-4 hover:underline disabled:opacity-60"
        >
          {resending ? "Resending..." : "Resend OTP"}
        </button>
      </div>
    </div>
  );
};

export default VerifyOTP;
