import { createContext, useState, useEffect } from "react";
import authService from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data);
    return data;
  };

  const verifyOTP = async (email, otp) => {
    const data = await authService.verifyOTP(email, otp);
    setUser(data);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (data) => {
    const merged = { ...user, ...data };
    setUser(merged);
    localStorage.setItem("user", JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, verifyOTP, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
