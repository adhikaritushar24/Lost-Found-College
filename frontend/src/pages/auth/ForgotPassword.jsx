import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../../services/authService";
import { isValidEmail } from "../../utils/validators";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [exitDir, setExitDir] = useState(null); // 'left' | 'right' | null

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  const goTo = (path, direction, options) => {
    setExitDir(direction);
    setTimeout(() => navigate(path, options), 280);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      return setError("Please enter a valid email address");
    }

    try {
      setLoading(true);
      await authService.forgotPassword(email);
      goTo("/reset-password", "left", { state: { email } });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 px-4 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-fuchsia-200/40 rounded-full blur-3xl" />

      <div
        className={`relative w-full max-w-md transition-all duration-300 ease-out ${
          exitDir === "left"
            ? "opacity-0 -translate-x-16"
            : exitDir === "right"
              ? "opacity-0 translate-x-16"
              : mounted
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-16"
        }`}
      >
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm shadow-xl shadow-purple-900/5 rounded-2xl p-8 border border-purple-100/60">
          <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">
            Forgot password?
          </h1>
          <p className="text-gray-500 mb-6 text-sm text-center">
            Enter your email and we'll send you a code to reset it
          </p>

          {error && (
            <div className="bg-rose-50 text-rose-600 text-sm px-3.5 py-2.5 rounded-lg mb-4 border border-rose-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl py-2.5 text-sm font-medium hover:from-purple-700 hover:to-fuchsia-700 transition-all shadow-sm shadow-purple-500/25 disabled:opacity-60 active:scale-[0.99]"
            >
              {loading ? "Sending..." : "Send reset code"}
            </button>
          </form>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Remembered it?{" "}
            <button
              type="button"
              onClick={() => goTo("/login", "right")}
              className="text-purple-600 font-medium hover:text-purple-700"
            >
              Back to login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
