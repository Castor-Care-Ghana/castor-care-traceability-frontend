import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [view, setView] = useState("");

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // ✅ Fetch all users
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("❌ Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ Filter users
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(filter.toLowerCase()) ||
      u.email?.toLowerCase().includes(filter.toLowerCase())
  );

  // ✅ Filter users created by logged-in user
  const myUsers = filteredUsers.filter((u) => u.createdBy?._id === user?.id);

  // ✅ Delete user
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error("Failed to delete user");
      alert("✅ User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert("Failed to delete user.");
    }
  };

  // ✅ Edit user
  const handleEdit = (id) => {
    navigate(`/dashboard/users/edit/${id}`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-green-700">👤 User Dashboard</h1>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => navigate("/dashboard/users/create")}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow"
        >
          ➕ Create User
        </button>

        <button
          onClick={() => setView("all")}
          className={`px-4 py-2 rounded-lg border border-gray-400 ${
            view === "all"
              ? "bg-green-600 text-white"
              : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
        >
          📋 Show All Users
        </button>

        <button
          onClick={() => setView("my")}
          className={`px-4 py-2 rounded-lg border border-gray-400 ${
            view === "my"
              ? "bg-green-600 text-white"
              : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
        >
          👥 My Users
        </button>
      </div>

      {/* Filter Input */}
      {(view === "all" || view === "my") && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Filter by name or email..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full p-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>
      )}

      {/* User List Section */}
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        {view === "" && (
          <p className="text-gray-600 text-center">
            Select an action to continue 👇
          </p>
        )}

        {/* All Users */}
        {view === "all" &&
          (filteredUsers.length ? (
            <ul className="space-y-2">
              {filteredUsers.map((u) => (
                <li
                  key={u._id}
                  className="p-3 border border-gray-300 rounded-lg flex justify-between items-center hover:bg-green-50"
                >
                  <div>
                    <p className="font-medium text-green-700">{u.name}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                    <p className="text-xs text-gray-400">{u.role}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(u._id)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">No users found 👤</p>
          ))}

        {/* My Users */}
        {view === "my" &&
          (myUsers.length ? (
            <ul className="space-y-2">
              {myUsers.map((u) => (
                <li
                  key={u._id}
                  className="p-3 border border-gray-300 rounded-lg flex justify-between items-center hover:bg-green-50"
                >
                  <div>
                    <p className="font-medium text-green-700">{u.name}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                    <p className="text-xs text-gray-400">{u.role}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(u._id)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">
              You haven’t created any users yet 🙋‍♂️
            </p>
          ))}
      </div>
    </div>
  );
};

export default Dashboard;
