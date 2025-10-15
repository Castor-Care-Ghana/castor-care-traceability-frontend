import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserData } from "../services/auth"; // must handle axios calls

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication when app loads
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        // ✅ Fetch user with token
        const res = await getUserData(token);

        // Handle both { user } or raw object
        const userData = res?.data?.user || res?.data;
        setUser(userData);

        localStorage.setItem("user", JSON.stringify(userData));
      } catch (err) {
        console.error("❌ Auth init failed:", err);

        // ✅ Only clear if token is invalid
        if (err.response?.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ login: save user + token
  const login = (userData, token) => {
    if (token) {
      localStorage.setItem("token", token);
    }
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // ✅ logout: clear storage
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
