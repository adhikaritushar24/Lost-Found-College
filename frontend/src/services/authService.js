import api from "./api";

const register = async (data) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

const verifyOTP = async (email, otp) => {
  const res = await api.post("/auth/verify-otp", { email, otp });
  if (res.data.token) {
    localStorage.setItem("user", JSON.stringify(res.data));
  }
  return res.data;
};

const resendOTP = async (email, purpose = "register") => {
  const res = await api.post("/auth/resend-otp", { email, purpose });
  return res.data;
};

const login = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  if (res.data.token) {
    localStorage.setItem("user", JSON.stringify(res.data));
  }
  return res.data;
};

const logout = () => {
  localStorage.removeItem("user");
};

const getProfile = async () => {
  const res = await api.get("/auth/profile");
  return res.data;
};

const updateProfile = async (data) => {
  const res = await api.put("/auth/profile", data);
  return res.data;
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

export default {
  register,
  verifyOTP,
  resendOTP,
  login,
  logout,
  getProfile,
  updateProfile,
  getCurrentUser,
};
