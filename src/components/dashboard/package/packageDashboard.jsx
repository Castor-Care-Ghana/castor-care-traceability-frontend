import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const PackageDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [filter, setFilter] = useState("");
  const [view, setView] = useState("");
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${BASE_URL}/packages`);
      if (!res.ok) throw new Error("Failed to fetch packages");
      const data = await res.json();
      setPackages(data);
    } catch (error) {
      console.error("❌ Error fetching packages:", error);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const filteredPackages = packages.filter(
    (p) =>
      p.packageCode?.toLowerCase().includes(filter.toLowerCase()) ||
      p.batchCode?.toLowerCase().includes(filter.toLowerCase())
  );

  const userPackages = filteredPackages.filter((p) => p.user?._id === user?.id);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this package?")) return;
    try {
      const res = await fetch(`${BASE_URL}/packages/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error("Failed to delete package");
      alert("✅ Package deleted");
      fetchPackages();
    } catch (error) {
      alert("Delete failed");
    }
  };

  const handleEdit = (id) => navigate(`/dashboard/packages/edit/${id}`);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-green-700">📦 Package Dashboard</h1>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => navigate("/dashboard/packages/create")}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow"
        >
          ➕ Create Package
        </button>
        <button
          onClick={() => setView("all")}
          className={`px-4 py-2 rounded-lg border border-gray-400 ${
            view === "all"
              ? "bg-green-600 text-white"
              : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
        >
          📋 Show All Packages
        </button>
        <button
          onClick={() => setView("my")}
          className={`px-4 py-2 rounded-lg border border-gray-400 ${
            view === "my"
              ? "bg-green-600 text-white"
              : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
        >
          👤 My Packages
        </button>
      </div>

      {(view === "all" || view === "my") && (
        <input
          type="text"
          placeholder="Filter by package or batch code..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full mb-4 p-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500"
        />
      )}

      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        {view === "" && (
          <p className="text-gray-600 text-center">Select an action to continue 📦</p>
        )}
        {view === "all" &&
          (filteredPackages.length ? (
            <ul className="space-y-2">
              {filteredPackages.map((p) => (
                <li
                  key={p._id}
                  className="p-3 border border-gray-300 rounded-lg flex justify-between hover:bg-green-50"
                >
                  <div>
                    <p className="font-medium text-green-700">{p.packageCode}</p>
                    <p className="text-sm text-gray-500">{p.batchCode}</p>
                  </div>
                  <p className="text-sm text-gray-600">{p.weight} kg</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">No packages found 📦</p>
          ))}
        {view === "my" &&
          (userPackages.length ? (
            <ul className="space-y-2">
              {userPackages.map((p) => (
                <li
                  key={p._id}
                  className="p-3 border border-gray-300 rounded-lg flex justify-between items-center hover:bg-green-50"
                >
                  <div>
                    <p className="font-medium text-green-700">{p.packageCode}</p>
                    <p className="text-sm text-gray-500">{p.batchCode}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(p._id)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
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
              You haven’t created any packages yet 📦
            </p>
          ))}
      </div>
    </div>
  );
};

export default PackageDashboard;
