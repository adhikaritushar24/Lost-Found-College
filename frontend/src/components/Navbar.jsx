import { useState, useEffect, useRef } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import itemService from "../services/itemsService";
import useAuth from "../hooks/useAuth";

const API =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
const STORAGE_KEY = "lastSeenNotificationsAt";

const NAV_LINKS = [
  {
    to: "/profile",
    label: "Home",
    icon: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h4a1 1 0 001-1V10",
  },
  {
    to: "/my-items",
    label: "My Items",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    to: "/about",
    label: "About",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

// crude keyword overlap check between two titles
const titlesOverlap = (a, b) => {
  const wordsA =
    a
      ?.toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2) || [];
  const wordsB =
    b
      ?.toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2) || [];
  return wordsA.some((w) => wordsB.includes(w));
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [claims, setClaims] = useState([]);
  const [claimActionId, setClaimActionId] = useState(null); // claimId currently being approved/rejected
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastSeen, setLastSeen] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "0",
  );

  const bellRef = useRef(null);
  const profileRef = useRef(null);

  const loadMatches = async () => {
    try {
      const [myItems, foundItems] = await Promise.all([
        itemService.getMyItems(),
        itemService.getFoundItems(),
      ]);

      const myLostItems = myItems.filter((i) => i.status === "lost");
      if (myLostItems.length === 0) {
        setMatches([]);
        return;
      }

      const found = [];
      const seen = new Set();

      for (const foundItem of foundItems) {
        for (const lostItem of myLostItems) {
          const sameCategory =
            (foundItem.category || "Other") === (lostItem.category || "Other");
          const sameTitleWords = titlesOverlap(foundItem.title, lostItem.title);

          if ((sameCategory && sameTitleWords) || sameTitleWords) {
            if (!seen.has(foundItem._id)) {
              seen.add(foundItem._id);
              found.push({ ...foundItem, matchedLostTitle: lostItem.title });
            }
            break;
          }
        }
      }

      found.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMatches(found.slice(0, 8));
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  // Claims made by other people on items I reported — pending ones need my
  // action, approved ones show the claimer's contact email
  const loadClaims = async () => {
    try {
      const data = await itemService.getMyClaims();
      const relevant = data.filter((c) => c.status !== "rejected").slice(0, 8);
      setClaims(relevant);
    } catch (err) {
      console.error("Failed to load claims", err);
    }
  };

  useEffect(() => {
    loadMatches();
    loadClaims();
    const interval = setInterval(() => {
      loadMatches();
      loadClaims();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target))
        setBellOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pendingClaims = claims.filter((c) => c.status === "pending");

  const unreadMatchCount = matches.filter(
    (i) => new Date(i.createdAt).getTime() > Number(lastSeen),
  ).length;

  // Pending claims always count toward the badge since they need action,
  // regardless of whether the bell has been opened before
  const unreadCount = unreadMatchCount + pendingClaims.length;

  const toggleBell = () => {
    const next = !bellOpen;
    setBellOpen(next);
    setProfileOpen(false);
    if (next) {
      const now = Date.now().toString();
      localStorage.setItem(STORAGE_KEY, now);
      setLastSeen(now);
    }
  };

  const toggleProfile = () => {
    setProfileOpen((v) => !v);
    setBellOpen(false);
  };

  const handleLogout = () => {
    logout?.();
    navigate("/login");
  };

  const handleApproveClaim = async (claimId) => {
    setClaimActionId(claimId);
    try {
      await itemService.approveClaim(claimId);
      await loadClaims();
    } catch (err) {
      console.error("Failed to approve claim", err);
    } finally {
      setClaimActionId(null);
    }
  };

  const handleRejectClaim = async (claimId) => {
    setClaimActionId(claimId);
    try {
      await itemService.rejectClaim(claimId);
      await loadClaims();
    } catch (err) {
      console.error("Failed to reject claim", err);
    } finally {
      setClaimActionId(null);
    }
  };

  const timeAgo = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const initial = user?.name?.[0]?.toUpperCase() || "?";

  return (
    <nav className="sticky top-0 z-40">
      <div className="h-[2px] bg-gradient-to-r from-purple-300 via-fuchsia-300 to-purple-300" />

      <div
        className={`bg-white/70 backdrop-blur-xl border-b transition-shadow duration-300 ${
          scrolled
            ? "border-purple-100 shadow-[0_4px_24px_-6px_rgba(168,85,247,0.22)]"
            : "border-purple-100/70 shadow-[0_1px_20px_-4px_rgba(168,85,247,0.12)]"
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 group cursor-default shrink-0">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-md shadow-purple-500/25 group-hover:shadow-purple-500/40 group-hover:scale-105 transition-all">
              <span className="text-white text-base font-bold">L</span>
              <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="leading-tight hidden sm:block">
              <p className="font-bold text-gray-900 text-[15px] tracking-tight">
                Lost<span className="text-purple-500">&</span>Found
              </p>
              <p className="text-[10px] text-gray-400 font-medium -mt-0.5">
                Campus Portal
              </p>
            </div>
          </div>

          {/* Nav links (desktop) */}
          <div className="hidden sm:flex items-center gap-1 flex-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `relative px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-purple-700"
                      : "text-gray-500 hover:text-gray-800 hover:bg-purple-50/60"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-0 bg-purple-50 rounded-lg" />
                    )}
                    <span className="relative">{link.label}</span>
                    <span
                      className={`absolute left-2 right-2 -bottom-[7px] h-[2px] bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full origin-left transition-transform duration-300 ease-out ${
                        isActive ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={toggleBell}
                className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                  bellOpen
                    ? "bg-purple-100 text-purple-600"
                    : "text-purple-400 hover:bg-purple-50 hover:text-purple-500"
                }`}
              >
                <svg
                  className={`w-[19px] h-[19px] transition-transform ${unreadCount > 0 ? "animate-[wiggle_2.5s_ease-in-out_infinite]" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-gradient-to-br from-rose-500 to-pink-500 rounded-full ring-2 ring-white">
                    <span className="text-[9px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="fixed left-4 right-4 top-[68px] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-80 bg-white rounded-2xl shadow-2xl shadow-purple-900/10 border border-purple-100/80 overflow-hidden animate-[fadeIn_0.15s_ease-out] origin-top-right">
                  <div className="max-h-96 overflow-y-auto">
                    {/* Claim requests section */}
                    {claims.length > 0 && (
                      <div>
                        <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50/50 border-b border-emerald-100/70 flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              Claim requests
                            </h3>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              People who said an item is theirs
                            </p>
                          </div>
                          {pendingClaims.length > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                              {pendingClaims.length}
                            </span>
                          )}
                        </div>
                        {claims.map((claim) => (
                          <div
                            key={claim._id}
                            className="px-4 py-3 border-b border-gray-50 last:border-0"
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative shrink-0">
                                {claim.item?.image ? (
                                  <img
                                    src={`${API}${claim.item.image}`}
                                    alt={claim.item.title}
                                    className="w-10 h-10 rounded-xl object-cover bg-gray-100 ring-1 ring-black/5"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-400">
                                    <span className="text-white text-xs font-bold">
                                      {claim.item?.title?.[0]?.toUpperCase() ||
                                        "?"}
                                    </span>
                                  </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-fuchsia-500 flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white">
                                  {claim.claimedBy?.avatar ? (
                                    <img
                                      src={`${API}${claim.claimedBy.avatar}`}
                                      alt={claim.claimedBy?.name || "User"}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    claim.claimedBy?.name?.[0]?.toUpperCase() ||
                                    "?"
                                  )}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-900 truncate">
                                  <span className="font-medium">
                                    {claim.claimedBy?.name || "Someone"}
                                  </span>{" "}
                                  says this is theirs:{" "}
                                  <span className="text-gray-600">
                                    {claim.item?.title}
                                  </span>
                                </p>
                                {claim.message && (
                                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                    "{claim.message}"
                                  </p>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5 shrink-0">
                                {timeAgo(claim.createdAt)}
                              </span>
                            </div>

                            {claim.status === "pending" ? (
                              <div className="flex gap-2 mt-2.5 ml-[52px]">
                                <button
                                  onClick={() => handleApproveClaim(claim._id)}
                                  disabled={claimActionId === claim._id}
                                  className="flex-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-1.5 transition-colors disabled:opacity-50"
                                >
                                  {claimActionId === claim._id
                                    ? "Approving..."
                                    : "Accept"}
                                </button>
                                <button
                                  onClick={() => handleRejectClaim(claim._id)}
                                  disabled={claimActionId === claim._id}
                                  className="text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </div>
                            ) : (
                              claim.status === "approved" && (
                                <div className="mt-2.5 ml-[52px] text-xs bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                                  <p className="text-emerald-700 font-medium mb-0.5">
                                    ✓ Approved — contact to arrange pickup
                                  </p>
                                  {claim.claimedBy?.email && (
                                    <a
                                      href={`mailto:${claim.claimedBy.email}`}
                                      className="text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
                                    >
                                      ✉️ {claim.claimedBy.email}
                                    </a>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Possible matches section */}
                    <div className="px-4 py-3.5 bg-gradient-to-r from-purple-50 to-fuchsia-50/50 border-b border-purple-100/70 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Possible matches
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Found items that match something you lost
                        </p>
                      </div>
                      {matches.length > 0 && (
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full shrink-0">
                          {matches.length}
                        </span>
                      )}
                    </div>
                    {matches.length === 0 && claims.length === 0 ? (
                      <div className="text-center py-10 px-6">
                        <p className="text-2xl mb-1.5">🔔</p>
                        <p className="text-sm text-gray-400">
                          No matches yet — you'll be notified here if someone
                          finds an item like yours.
                        </p>
                      </div>
                    ) : matches.length === 0 ? (
                      <div className="text-center py-6 px-6">
                        <p className="text-xs text-gray-400">No matches yet.</p>
                      </div>
                    ) : (
                      matches.map((item) => (
                        <div
                          key={item._id}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-purple-50/40 transition-colors border-b border-gray-50 last:border-0"
                        >
                          {item.image ? (
                            <img
                              src={`${API}${item.image}`}
                              alt={item.title}
                              className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0 ring-1 ring-black/5"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center bg-blue-400">
                              <span className="text-white text-xs font-bold">
                                {item.title?.[0]?.toUpperCase() || "?"}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-blue-600">
                              Match for "{item.matchedLostTitle}"
                            </p>
                            <p className="text-sm text-gray-900 truncate mt-0.5">
                              Found: {item.title}
                            </p>
                            {item.location && (
                              <p className="text-xs text-gray-400 truncate">
                                📍 {item.location}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5">
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-purple-100 mx-1 hidden sm:block" />

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={toggleProfile}
                className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full transition-all ${
                  profileOpen
                    ? "bg-purple-50 ring-1 ring-purple-200"
                    : "hover:bg-purple-50/70"
                }`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white">
                  {user?.avatar ? (
                    <img
                      src={`${API}${user.avatar}`}
                      alt={user?.name || "Profile"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </div>
                <svg
                  className={`w-3.5 h-3.5 text-purple-400 transition-transform ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl shadow-purple-900/10 border border-purple-100/80 overflow-hidden animate-[fadeIn_0.15s_ease-out] origin-top-right">
                  <div className="px-5 py-5 bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-600 relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                    <div className="absolute -bottom-8 -left-4 w-20 h-20 rounded-full bg-white/10" />
                    <div className="relative flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 flex items-center justify-center text-white text-lg font-bold ring-2 ring-white/40 backdrop-blur-sm">
                        {user?.avatar ? (
                          <img
                            src={`${API}${user.avatar}`}
                            alt={user?.name || "Profile"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initial
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-[15px] font-semibold truncate">
                          {user?.name || "User"}
                        </p>
                        <p className="text-purple-100 text-xs truncate">
                          {user?.email || ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {(user?.rollNumber || user?.role) && (
                    <div className="px-5 py-3.5 space-y-2 border-b border-gray-100">
                      {user?.rollNumber && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Roll number</span>
                          <span className="text-gray-900 font-medium">
                            {user.rollNumber}
                          </span>
                        </div>
                      )}
                      {user?.role && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Role</span>
                          <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                            {user.role}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-2">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/account");
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-purple-50 transition-colors flex items-center gap-2.5"
                    >
                      <span className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                        <svg
                          className="w-4 h-4 text-purple-500"
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
                      </span>
                      My profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2.5"
                    >
                      <span className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                        <svg
                          className="w-4 h-4 text-rose-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                      </span>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full text-purple-500 hover:bg-purple-50 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav links */}
        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 ${
            mobileOpen ? "max-h-60 border-t border-purple-100/70" : "max-h-0"
          }`}
        >
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "text-purple-700 bg-purple-50"
                      : "text-gray-500 hover:bg-gray-50"
                  }`
                }
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d={link.icon}
                  />
                </svg>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wiggle {
          0%, 92%, 100% { transform: rotate(0deg); }
          93% { transform: rotate(-12deg); }
          94% { transform: rotate(10deg); }
          95% { transform: rotate(-8deg); }
          96% { transform: rotate(6deg); }
          97% { transform: rotate(0deg); }
        }
      `}</style>
    </nav>
  );
}
