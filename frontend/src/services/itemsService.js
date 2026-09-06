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
    // Don't set Content-Type manually — for FormData the browser needs to
    // add its own multipart boundary, which it won't do if we override the
    // header ourselves. Setting it explicitly was causing multer on the
    // backend to fail to parse the image, so uploaded photos weren't saved.
    const res = await api.post("/items", formData);
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

  // Approve a claim on one of my items — marks the item as claimed and
  // returns the claim populated with the claimer's contact email
  approveClaim: async (claimId) => {
    const res = await api.put(`/items/claims/${claimId}/approve`);
    return res.data;
  },

  // Reject a claim on one of my items
  rejectClaim: async (claimId) => {
    const res = await api.put(`/items/claims/${claimId}/reject`);
    return res.data;
  },
};

export default itemService;