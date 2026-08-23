import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import authService from "../services/authService";

export default function Account() {
  const { user: contextUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(contextUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getProfile();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Couldn't load full profile details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const initial = profile?.name?.[0]?.toUpperCase() || "?";

  const handleLogout = () => {
    logout?.();
    navigate("/login");
  };

  const extraFields = [
    { label: "Roll number", value: profile?.rollNumber },
    { label: "Phone", value: profile?.phone },
  ].filter((f) => f.value);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100/70 via-purple-50/30 to-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium mb-6"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        <div className="bg-white rounded-2xl border border-purple-100 shadow-md shadow-purple-100/60 overflow-hidden">
          {/* Cover / header */}
          <div className="px-6 py-8 bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-600 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 -left-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="relative flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white/30 backdrop-blur-sm">
                {initial}
              </div>
              <div className="min-w-0">
                <h1 className="text-white text-xl font-semibold truncate">
                  {profile?.name || "User"}
                </h1>
                <p className="text-purple-100 text-sm truncate">
                  {profile?.email || ""}
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Account details
            </h2>

            {loading ? (
              <div className="space-y-2">
                <div className="h-11 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-11 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ) : error ? (
              <p className="text-sm text-rose-500">{error}</p>
            ) : extraFields.length === 0 ? (
              <p className="text-sm text-gray-400">
                No additional details available.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                {extraFields.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center justify-between px-4 py-3 bg-white"
                  >
                    <span className="text-sm text-gray-400">{f.label}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <NavLink
                to="/my-items"
                className="flex-1 text-center bg-purple-50 text-purple-700 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-purple-100 transition-colors"
              >
                View my items
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex-1 text-center bg-rose-50 text-rose-600 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-rose-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
