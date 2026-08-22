import { useState, useEffect } from "react";
import authService from "../../services/authService";
import useAuth from "../../hooks/useAuth";

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", rollNumber: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getProfile();
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          rollNumber: data.rollNumber || "",
        });
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      setSaving(true);
      const updated = await authService.updateProfile(form);
      updateUser(updated);
      setSuccess("Profile updated successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-lg bg-white shadow-md rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-navy-800">My Profile</h1>
          <button
            onClick={logout}
            className="text-sm text-red-600 font-medium hover:underline"
          >
            Logout
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-6">{user?.email}</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Phone</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Roll Number</label>
            <input
              type="text"
              name="rollNumber"
              value={form.rollNumber}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-900 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-800 transition disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
