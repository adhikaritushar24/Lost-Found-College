import api from "./api";

const itemService = {
  getAllItems: async () => {
    const res = await api.get("/items");
    return res.data;
  },

  getLostItems: async () => {
    const res = await api.get("/items?status=lost");
    return res.data;
  },

  getFoundItems: async () => {
    const res = await api.get("/items?status=found");
    return res.data;
  },

  getClaimedItems: async () => {
    const res = await api.get("/items?status=claimed");
    return res.data;
  },

  getMyItems: async () => {
    const res = await api.get("/items/mine");
    return res.data;
  },

  createItem: async (formData) => {
    const res = await api.post("/items", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // Submit a claim ("this is mine" / "I found this") on someone else's item
  claimItem: async (itemId, message = "") => {
    const res = await api.post(`/items/${itemId}/claim`, { message });
    return res.data;
  },

  // Claims made on items I reported (for notifications)
  getMyClaims: async () => {
    const res = await api.get("/items/claims/mine");
    return res.data;
  },
};

export default itemService;