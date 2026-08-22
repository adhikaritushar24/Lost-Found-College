import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../../services/authService";
import { isValidEmail, isValidPassword } from "../../utils/validators";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    rollNumber: "",
    phone: "",
  });
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
    if (!isValidPassword(form.password)) {
      return setError("Password must be at least 6 characters");
    }

    try {
      setLoading(true);
      await authService.register(form);
      navigate("/verify-otp", { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8">
        <h1 className="text-2xl font-bold text-navy-800 mb-1">Create Account</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Register with your college email to get started.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          />
          <input
            type="email"
            name="email"
            placeholder="College Email"
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
          <input
            type="text"
            name="rollNumber"
            placeholder="Roll Number (optional)"
            value={form.rollNumber}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-800 transition disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-900 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
