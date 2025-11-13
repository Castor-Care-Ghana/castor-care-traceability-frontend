import React, { useState } from "react";
import api from "../../../api";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

const CreateUser = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
    role: "user",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const headers = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const response = await api.post("/users/register", userData, { headers });
    const newUser = response.data.user; // newly created user

    Swal.fire({
      title: "Success!",
      text: response.data.message || "User created successfully.",
      icon: "success",
      confirmButtonText: "OK",
    }).then(() =>
      // Redirect to admin dashboard and pass newUser as state
      navigate("/dashboard/admin/users", { state: { newUser } })
    );

    setUserData({
      name: "",
      email: "",
      password: "",
      contact: "",
      role: "user",
    });
  } catch (error) {
    console.error("❌ Create user error:", error);

    const errMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "An error occurred while creating the user.";

    Swal.fire({
      title: "Error",
      text: errMsg,
      icon: "error",
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-6 md:p-8 bg-white rounded-2xl shadow-md max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-700">Create New User</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-gray-600 mb-1">Full Name</label>
          <input
            type="text"
            name="name"
            value={userData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-gray-600 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-gray-600 mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={userData.password}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Contact */}
        <div>
          <label className="block text-gray-600 mb-1">Contact</label>
          <input
            type="text"
            name="contact"
            value={userData.contact}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-gray-600 mb-1">Role</label>
          <select
            name="role"
            value={userData.role}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex justify-end items-center gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition-all font-medium"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 rounded-lg text-white font-medium transition-all ${
              loading
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUser;
