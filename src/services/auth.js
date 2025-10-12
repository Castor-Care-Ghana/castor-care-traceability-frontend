import { apiClient } from "./config";

// Signup
export const apiSignup = async (payload) => {
  return await apiClient.post("/users/register", payload);
};

// Login
export const apiLogin = async (payload) => {
  return await apiClient.post("/users/login", payload);
};

// Get logged-in user data
export const getUserData = async (token) => {
  return await apiClient.get("/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Update user data
export const updateUserData = async (updatedData, token) => {
  return await apiClient.patch("/users/me", updatedData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
