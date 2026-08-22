import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { isValidEmail } from "../../utils/validators";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(form.email)) {
      return setError("Please enter a valid email address");
    }

    try {
      setLoading(true);
      await login(form.email, form.password);
      navigate("/profile");
    } catch (err) {
      if (err.response?.data?.needsVerification) {
        navigate("/verify-otp", { state: { email: form.email } });
        return;
      }
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8">
        <h1 className="text-2xl font-bold text-navy-800 mb-1">Welcome Back</h1>
        <p className="text-gray-500 mb-6 text-sm">Login to continue.</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-800 transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-900 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
