import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import authService from "../services/authService";

const API =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

export default function Account() {
  const { user: contextUser, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(contextUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef(null);

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

  const handleAvatarClick = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be under 5MB.");
      return;
    }

    setAvatarError("");
    setUploading(true);
    try {
      const updated = await authService.updateAvatar(file);
      setProfile((prev) => ({ ...prev, avatar: updated.avatar }));
      updateUser?.(updated); // reflects instantly in Navbar too
    } catch (err) {
      console.error("Failed to upload avatar", err);
      setAvatarError("Couldn't upload photo. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="relative w-16 h-16 rounded-full overflow-hidden ring-4 ring-white/30 backdrop-blur-sm group"
                  title="Change profile photo"
                >
                  {profile?.avatar ? (
                    <img
                      src={`${API}${profile.avatar}`}
                      alt={profile?.name || "Profile"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                      {initial}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploading ? (
                      <svg
                        className="w-5 h-5 text-white animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M12 17a4 4 0 100-8 4 4 0 000 8z"
                        />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Edit badge - separate button outside the overflow-hidden circle so it's not clipped */}
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute bottom-1.5 right-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center ring-2 ring-purple-600 shadow-sm translate-x-0.5 translate-y-0.5 hover:bg-purple-50 transition-colors"
                  title="Change profile photo"
                >
                  <svg
                    className="w-2.5 h-2.5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
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
            {avatarError && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3.5 py-2.5 mb-4">
                {avatarError}
              </p>
            )}
            <p className="text-xs text-gray-400 -mt-1 mb-4">
              Tap your photo to add or change it — completely optional.
            </p>

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
