import api from "./api";

const notificationService = {
  // AI image-match notifications for the logged-in user
  getMyNotifications: async () => {
    const res = await api.get("/notifications");
    return res.data;
  },
};

export default notificationService;