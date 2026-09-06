import { useState, useEffect, useMemo, useRef } from "react";
import itemService from "../../services/itemsService";
import useAuth from "../../hooks/useAuth";

const API =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const CATEGORY_ICONS = {
  Electronics: "💻",
  "ID Card": "🪪",
  Bag: "🎒",
  Documents: "📄",
  Other: "📦",
};

const CATEGORIES = [
  "All",
  "Electronics",
  "ID Card",
  "Bag",
  "Documents",
  "Other",
];
const TABS = [
  { key: "lost", label: "Lost", dot: "bg-rose-400", ring: "ring-rose-100" },
  { key: "found", label: "Found", dot: "bg-blue-400", ring: "ring-blue-100" },
  {
    key: "claimed",
    label: "Claimed",
    dot: "bg-emerald-400",
    ring: "ring-emerald-100",
  },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

const isNew = (dateStr) =>
  Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

// Reusable purple-themed dropdown to replace the plain native <select>
function Dropdown({ value, options, onChange, renderLabel, icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-between gap-2 min-w-[160px] rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all ${
          open
            ? "border-purple-400 ring-2 ring-purple-500/20 bg-white"
            : "border-purple-200 bg-white hover:border-purple-300"
        }`}
      >
        <span className="flex items-center gap-1.5 text-gray-700">
          {icon && <span className="text-purple-400">{icon}</span>}
          {renderLabel ? renderLabel(current) : current?.label}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-purple-400 transition-transform shrink-0 ${
            open ? "rotate-180" : ""
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

      {open && (
        <div className="absolute right-0 sm:left-0 mt-2 min-w-full w-max max-h-72 overflow-y-auto bg-white rounded-xl shadow-xl shadow-purple-900/10 border border-purple-100 p-1.5 z-30 animate-[fadeIn_0.12s_ease-out]">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                opt.value === value
                  ? "bg-purple-50 text-purple-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.icon && <span>{opt.icon}</span>}
              <span className="truncate">{opt.label}</span>
              {opt.value === value && (
                <svg
                  className="w-3.5 h-3.5 ml-auto text-purple-500 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("lost");
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [claimedItems, setClaimedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedItem, setSelectedItem] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [reportType, setReportType] = useState("found"); // "lost" | "found"
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [itemCategory, setItemCategory] = useState("Other");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Claim flow state
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [claimSuccess, setClaimSuccess] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const [lost, found, claimed] = await Promise.all([
        itemService.getLostItems(),
        itemService.getFoundItems(),
        itemService.getClaimedItems(),
      ]);
      setLostItems(lost);
      setFoundItems(found);
      setClaimedItems(claimed);
    } catch (err) {
      console.error("Failed to load items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("title", title);
      data.append("description", description);
      data.append("location", location);
      data.append("category", itemCategory);
      data.append("status", reportType); // "lost" or "found"
      if (file) data.append("image", file);

      await itemService.createItem(data);

      setTitle("");
      setDescription("");
      setLocation("");
      setItemCategory("Other");
      setFile(null);
      setShowForm(false);
      setActiveTab(reportType); // jump to the tab where it now lives
      loadItems();
    } catch (err) {
      console.error("Failed to report item", err);
      setFormError("Couldn't submit the report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedItem(null);
    setClaimMessage("");
    setClaimSuccess(false);
  };

  const handleClaim = async () => {
    if (!selectedItem) return;
    setClaiming(true);
    try {
      await itemService.claimItem(selectedItem._id, claimMessage);
      setClaimSuccess(true);
      setClaimMessage("");
    } catch (err) {
      console.error("Failed to claim item", err);
    } finally {
      setClaiming(false);
    }
  };

  const rawItems = useMemo(() => {
    if (activeTab === "lost") return lostItems;
    if (activeTab === "found") return foundItems;
    return claimedItems;
  }, [activeTab, lostItems, foundItems, claimedItems]);

  const visibleItems = useMemo(() => {
    let items = [...rawItems];

    if (category !== "All") {
      items = items.filter((i) => (i.category || "Other") === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.location?.toLowerCase().includes(q),
      );
    }

    items.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });

    return items;
  }, [rawItems, category, search, sortOrder]);

  const counts = {
    lost: lostItems.length,
    found: foundItems.length,
    claimed: claimedItems.length,
  };

  const categoryOptions = CATEGORIES.map((c) => ({
    value: c,
    label: c === "All" ? "All categories" : c,
    icon: c === "All" ? "🗂️" : CATEGORY_ICONS[c],
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100/70 via-purple-50/30 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Campus <span className="text-purple-600">Lost & Found</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1.5">
                Help reunite people with their belongings
              </p>
            </div>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:from-purple-700 hover:to-fuchsia-700 active:scale-[0.98] transition-all shadow-md shadow-purple-300/50"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showForm ? "rotate-45" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {showForm ? "Cancel" : "Report an item"}
            </button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3 mt-7">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative overflow-hidden bg-white border rounded-2xl px-4 py-4 sm:py-5 text-left transition-all duration-200 ${
                  activeTab === tab.key
                    ? "border-purple-300 ring-2 ring-purple-200 shadow-lg shadow-purple-200/50 -translate-y-0.5"
                    : "border-purple-100 shadow-sm shadow-purple-100/30 hover:border-purple-300 hover:bg-purple-50/40 hover:-translate-y-0.5"
                }`}
              >
                {activeTab === tab.key && (
                  <span className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-fuchsia-500" />
                )}
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`w-2 h-2 rounded-full ${tab.dot}`} />
                  <span className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {tab.label}
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">
                  {counts[tab.key]}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Report Form */}
        {showForm && (
          <div className="bg-white border border-purple-200 rounded-2xl p-6 mb-8 shadow-md shadow-purple-100/60 animate-[fadeIn_0.15s_ease-out]">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Report an item
            </h2>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              {/* Lost / Found toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  What are you reporting?
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-purple-100/60 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setReportType("lost")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      reportType === "lost"
                        ? "bg-white text-rose-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${reportType === "lost" ? "bg-rose-400" : "bg-gray-300"}`}
                    />
                    I lost something
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType("found")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      reportType === "found"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${reportType === "found" ? "bg-blue-400" : "bg-gray-300"}`}
                    />
                    I found something
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Black wallet"
                    className="w-full rounded-lg border border-purple-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {reportType === "lost"
                      ? "Last seen location"
                      : "Location found"}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Library, 2nd floor"
                    className="w-full rounded-lg border border-purple-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setItemCategory(c)}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                        itemCategory === c
                          ? "border-purple-600 bg-gradient-to-b from-purple-600 to-purple-500 text-white shadow-sm"
                          : "border-purple-100 text-gray-600 hover:border-purple-300 hover:bg-purple-50"
                      }`}
                    >
                      <span className="text-base">{CATEGORY_ICONS[c]}</span>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Any identifying details..."
                  className="w-full rounded-lg border border-purple-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
                />
              </div>

              {formError && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3.5 py-2.5">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 shadow-sm ${
                  reportType === "lost"
                    ? "bg-rose-500 hover:bg-rose-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {submitting
                  ? "Submitting..."
                  : reportType === "lost"
                    ? "Report Lost Item"
                    : "Report Found Item"}
              </button>
            </form>
          </div>
        )}

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, location, or description..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-purple-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-purple-300 hover:text-purple-500 hover:bg-purple-50 transition-colors"
              >
                ×
              </button>
            )}
          </div>

          <Dropdown
            value={category}
            options={categoryOptions}
            onChange={setCategory}
          />

          <Dropdown
            value={sortOrder}
            options={SORT_OPTIONS}
            onChange={setSortOrder}
            icon={
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9M3 12h5m6-4v12m0 0l-3-3m3 3l3-3"
                />
              </svg>
            }
          />
        </div>

        {/* Active filter chips */}
        {(category !== "All" || search) && (
          <div className="flex items-center flex-wrap gap-2 mb-6 -mt-2">
            {category !== "All" && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full bg-purple-100 text-purple-700">
                {CATEGORY_ICONS[category]} {category}
                <button
                  onClick={() => setCategory("All")}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-purple-200 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full bg-purple-100 text-purple-700">
                "{search}"
                <button
                  onClick={() => setSearch("")}
                  className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-purple-200 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        {/* Item Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-purple-100 rounded-2xl overflow-hidden animate-pulse shadow-sm shadow-purple-100/30"
              >
                <div className="w-full h-40 bg-purple-100" />
                <div className="p-4 space-y-2">
                  <div className="h-3.5 bg-purple-50 rounded w-2/3" />
                  <div className="h-3 bg-purple-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="border border-dashed border-purple-300 rounded-2xl py-16 text-center bg-purple-50/50">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm text-gray-500 font-medium">
              No items match your filters
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your search or category
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleItems.map((item) => (
              <button
                key={item._id}
                onClick={() => setSelectedItem(item)}
                className="group text-left bg-white border border-purple-100 rounded-2xl overflow-hidden shadow-sm shadow-purple-100/40 hover:shadow-xl hover:shadow-purple-200/50 hover:border-purple-300 hover:-translate-y-1 transition-all duration-200 flex flex-col"
              >
                <div className="relative">
                  {isNew(item.createdAt) && (
                    <span className="absolute top-2.5 left-2.5 z-10 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-sm">
                      NEW
                    </span>
                  )}
                  <span className="absolute top-2.5 right-2.5 z-10 text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-purple-700 border border-purple-100 shadow-sm flex items-center gap-1">
                    <span>{CATEGORY_ICONS[item.category] || "📦"}</span>
                    {item.category || "Other"}
                  </span>
                  {item.image ? (
                    <img
                      src={`${API}${item.image}`}
                      alt={item.title}
                      className="w-full h-40 object-contain bg-gradient-to-br from-purple-50/60 to-fuchsia-50/40 group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-4xl">
                      {CATEGORY_ICONS[item.category] || "📦"}
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                    {item.title}
                  </h3>
                  {item.location && (
                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1 truncate">
                      <span className="text-purple-300">📍</span>
                      {item.location}
                    </p>
                  )}
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {activeTab === "claimed" && item.claimedByUser?.name && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <div className="relative shrink-0">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white">
                          {item.claimedByUser.avatar ? (
                            <img
                              src={`${API}${item.claimedByUser.avatar}`}
                              alt={item.claimedByUser.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            item.claimedByUser.name[0].toUpperCase()
                          )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white flex items-center justify-center ring-1 ring-emerald-100">
                          <svg
                            className="w-2 h-2 text-emerald-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Claimed by{" "}
                        <span className="text-gray-800 font-medium">
                          {item.claimedByUser.name}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="mt-auto pt-2.5 flex items-center justify-end">
                    <span className="text-[11px] text-purple-300 font-medium">
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-purple-950/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl border border-purple-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItem.image ? (
              <img
                src={`${API}${selectedItem.image}`}
                alt={selectedItem.title}
                className="w-full h-56 object-contain bg-gray-100"
              />
            ) : (
              <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-5xl">
                {CATEGORY_ICONS[selectedItem.category] || "📦"}
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedItem.title}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-purple-600 text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 mb-4">
                <span>{CATEGORY_ICONS[selectedItem.category] || "📦"}</span>
                {selectedItem.category || "Other"}
              </span>

              {selectedItem.location && (
                <p className="text-sm text-gray-600 mb-2">
                  📍{" "}
                  <span className="text-gray-900">{selectedItem.location}</span>
                </p>
              )}
              {selectedItem.description && (
                <p className="text-sm text-gray-500 mb-4">
                  {selectedItem.description}
                </p>
              )}

              <div className="border-t border-purple-100 pt-4">
                {selectedItem.reportedBy?.name && (
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-purple-100">
                      {selectedItem.reportedBy.avatar ? (
                        <img
                          src={`${API}${selectedItem.reportedBy.avatar}`}
                          alt={selectedItem.reportedBy.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        selectedItem.reportedBy.name[0].toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {selectedItem.reportedBy.name}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Reported this item
                      </p>
                    </div>
                  </div>
                )}
                {selectedItem.createdAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(selectedItem.createdAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </p>
                )}
              </div>
              {/* Already claimed — show who claimed it */}
              {selectedItem.status === "claimed" &&
                selectedItem.claimedByUser && (
                  <div className="border-t border-purple-100 pt-4 mt-4">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white shadow-sm">
                          {selectedItem.claimedByUser.avatar ? (
                            <img
                              src={`${API}${selectedItem.claimedByUser.avatar}`}
                              alt={selectedItem.claimedByUser.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            selectedItem.claimedByUser.name?.[0]?.toUpperCase() ||
                            "?"
                          )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center ring-1 ring-emerald-100">
                          <svg
                            className="w-2.5 h-2.5 text-emerald-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">
                            {selectedItem.claimedByUser.name}
                          </span>{" "}
                          claimed this item
                        </p>
                        <p className="text-xs text-gray-400">
                          Reach out to arrange pickup
                        </p>
                      </div>
                      {selectedItem.claimedByUser.email && (
                        <a
                          href={`mailto:${selectedItem.claimedByUser.email}`}
                          className="shrink-0 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Contact
                        </a>
                      )}
                    </div>
                  </div>
                )}

              {/* Claim section — hidden for your own items and already-claimed items */}
              {selectedItem.reportedBy?._id !== user?._id &&
                selectedItem.status !== "claimed" && (
                  <div className="border-t border-purple-100 pt-4 mt-4">
                    {claimSuccess ? (
                      <div className="text-sm bg-emerald-50 border border-emerald-100 rounded-lg px-3.5 py-3 space-y-2">
                        <div className="flex items-center gap-2 font-medium text-emerald-700">
                          <span>✓</span>
                          Request sent!
                        </div>
                        <p className="text-xs text-emerald-600/80">
                          The reporter will review your request. Once approved,
                          it'll show up in the Claimed tab and you two can
                          arrange pickup.
                        </p>
                      </div>
                    ) : (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {selectedItem.status === "lost"
                            ? "Did you find this?"
                            : "Is this yours?"}
                        </label>
                        <textarea
                          value={claimMessage}
                          onChange={(e) => setClaimMessage(e.target.value)}
                          rows={2}
                          placeholder={
                            selectedItem.status === "lost"
                              ? "Add a note with where/when you found it (optional)"
                              : "Add a note to help verify it's yours (optional)"
                          }
                          className="w-full rounded-lg border border-purple-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-400 resize-none mb-2"
                        />
                        <button
                          onClick={handleClaim}
                          disabled={claiming}
                          className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:from-purple-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 shadow-sm"
                        >
                          {claiming
                            ? "Submitting..."
                            : selectedItem.status === "lost"
                              ? "I found this — notify owner"
                              : "This is mine — claim it"}
                        </button>
                      </>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
