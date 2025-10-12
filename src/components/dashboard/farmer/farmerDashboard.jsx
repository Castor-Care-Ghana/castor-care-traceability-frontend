import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const FarmerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [filter, setFilter] = useState("");
  const [view, setView] = useState("");

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchFarmers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/farmers`);
      if (!res.ok) throw new Error("Failed to fetch farmers");
      const data = await res.json();
      setFarmers(data);
    } catch (error) {
      console.error("❌ Error fetching farmers:", error);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const filteredFarmers = farmers.filter(
    (f) =>
      f.name?.toLowerCase().includes(filter.toLowerCase()) ||
      f.farmerCode?.toLowerCase().includes(filter.toLowerCase())
  );

  const userFarmers = filteredFarmers.filter((f) => f.user?._id === user?.id);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this farmer?")) return;
    try {
      const res = await fetch(`${BASE_URL}/farmers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error("Failed to delete farmer");
      alert("✅ Farmer deleted successfully");
      fetchFarmers();
    } catch (error) {
      console.error(error);
      alert("Failed to delete farmer.");
    }
  };

  const handleEdit = (id) => {
    navigate(`/dashboard/farmers/edit/${id}`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-green-700">👨‍🌾 Farmer Dashboard</h1>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => navigate("/dashboard/farmers/create")}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow"
        >
          ➕ Create Farmer
        </button>
        <button
          onClick={() => setView("all")}
          className={`px-4 py-2 rounded-lg border border-gray-400 ${
            view === "all"
              ? "bg-green-600 text-white"
              : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
        >
          📋 Show All Farmers
        </button>
        <button
          onClick={() => setView("my")}
          className={`px-4 py-2 rounded-lg border border-gray-400 ${
            view === "my"
              ? "bg-green-600 text-white"
              : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
        >
          👤 My Farmers
        </button>
      </div>

      {(view === "all" || view === "my") && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Filter by name or code..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full p-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>
      )}

      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        {view === "" && (
          <p className="text-gray-600 text-center">
            Select an action to continue 🌱
          </p>
        )}

        {view === "all" &&
          (filteredFarmers.length ? (
            <ul className="space-y-2">
              {filteredFarmers.map((f) => (
                <li
                  key={f._id}
                  className="p-3 border border-gray-300 rounded-lg flex justify-between hover:bg-green-50"
                >
                  <div>
                    <p className="font-medium text-green-700">{f.name}</p>
                    <p className="text-sm text-gray-500">{f.farmerCode}</p>
                  </div>
                  <p className="text-sm text-gray-600">{f.location}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">No farmers found 🌾</p>
          ))}

        {view === "my" &&
          (userFarmers.length ? (
            <ul className="space-y-2">
              {userFarmers.map((f) => (
                <li
                  key={f._id}
                  className="p-3 border border-gray-300 rounded-lg flex justify-between items-center hover:bg-green-50"
                >
                  <div>
                    <p className="font-medium text-green-700">{f.name}</p>
                    <p className="text-sm text-gray-500">{f.farmerCode}</p>
                    <p className="text-sm text-gray-600">{f.location}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(f._id)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(f._id)}
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
              You haven’t created any farmers yet 🌿
            </p>
          ))}
      </div>
    </div>
  );
};

export default FarmerDashboard;
