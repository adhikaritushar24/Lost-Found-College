import { useState, useEffect } from "react";
import itemService from "../services/itemsService";
import { getImageUrl } from "../utils/imageUrl";
const API =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const CATEGORY_ICONS = {
  Electronics: "💻",
  "ID Card": "🪪",
  Bag: "🎒",
  Documents: "📄",
  Other: "📦",
};

const statusMeta = {
  lost: {
    badge: "bg-rose-50 text-rose-700 border-rose-200/70",
    ring: "ring-rose-100",
  },
  found: {
    badge: "bg-blue-50 text-blue-700 border-blue-200/70",
    ring: "ring-blue-100",
  },
  claimed: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
    ring: "ring-emerald-100",
  },
};

export default function MyItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await itemService.getMyItems();
        setItems(data);
      } catch (err) {
        console.error("Failed to load your items", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100/70 via-purple-50/30 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            My Items
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Everything you've reported as lost or found
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-purple-100 rounded-2xl overflow-hidden animate-pulse shadow-sm shadow-purple-100/40"
              >
                <div className="w-full h-36 bg-purple-50/70" />
                <div className="p-4 space-y-2">
                  <div className="h-3.5 bg-purple-50 rounded w-2/3" />
                  <div className="h-3 bg-purple-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="border border-dashed border-purple-200 bg-white/60 rounded-2xl py-16 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm text-gray-400">
              You haven't reported anything yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => {
              const meta = statusMeta[item.status] || statusMeta.found;
              return (
                <div
                  key={item._id}
                  className={`bg-white border border-purple-100 rounded-2xl overflow-hidden relative shadow-sm shadow-purple-100/40 hover:shadow-lg hover:shadow-purple-200/50 hover:-translate-y-0.5 transition-all duration-200 ring-1 ${meta.ring}`}
                >
                  <span
                    className={`absolute top-2.5 left-2.5 z-10 text-[10px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${meta.badge}`}
                  >
                    {item.status?.toUpperCase()}
                  </span>
                  {item.image ? (
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      className="w-full h-36 object-contain bg-purple-50/40"
                    />
                  ) : (
                    <div className="w-full h-36 bg-gradient-to-br from-purple-50 to-fuchsia-50 flex items-center justify-center text-3xl">
                      {CATEGORY_ICONS[item.category] || "📦"}
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    {item.location && (
                      <p className="text-xs text-gray-500 mt-1.5">
                        📍 {item.location}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <p className="text-[11px] text-purple-300 font-medium mt-2.5">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
