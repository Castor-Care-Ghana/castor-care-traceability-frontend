import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { apiGetBatches } from "../../../services/traceability";


const BatchDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [filter, setFilter] = useState("");
  const [view, setView] = useState(""); // "all" | "my"

//   const BASE_URL = import.meta.env.VITE_BASE_URL;

  // ✅ Fetch all batches
  const fetchBatches = async () => {
    try {
      const res = await apiGetBatches();
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      setBatches(data);
    } catch (error) {
      console.error("❌ Error fetching batches:", error);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // ✅ Filter batches
  const filteredBatches = batches.filter(
    (b) =>
      b.cropType?.toLowerCase().includes(filter.toLowerCase()) ||
      b.batchCode?.toLowerCase().includes(filter.toLowerCase())
  );

  // ✅ Current user's batches
  const userBatches = filteredBatches.filter((b) => b.user?._id === user?.id);

  // ✅ Delete batch
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this batch?")) return;
    try {
      const res = await fetch(`${BASE_URL}/batches/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete batch");
      alert("✅ Batch deleted successfully");
      fetchBatches();
    } catch (error) {
      console.error("❌ Delete failed:", error);
      alert("Failed to delete batch.");
    }
  };

  // ✅ Update (redirect to edit page)
  const handleEdit = (id) => {
    navigate(`/dashboard/batches/edit/${id}`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-green-700">🌿 Batch Dashboard</h1>

      {/* Buttons */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => navigate("/dashboard/batches/create")}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow"
        >
          ➕ Create Batch
        </button>

        <button
          onClick={() => setView("all")}
          className={`px-4 py-2 rounded-lg border border-gray-400 ${
            view === "all"
              ? "bg-green-600 text-white"
              : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
        >
          📋 Show All Batches
        </button>

        <button
          onClick={() => setView("my")}
          className={`px-4 py-2 rounded-lg border border-gray-400 ${
            view === "my"
              ? "bg-green-600 text-white"
              : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
        >
          👤 My Batches
        </button>
      </div>

      {/* Filter input */}
      {(view === "all" || view === "my") && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Filter by crop type or batch code..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full p-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>
      )}

      {/* Display area */}
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        {view === "" && (
          <p className="text-gray-600 text-center">
            Select an action to continue 🌱
          </p>
        )}

        {/* All Batches */}
        {view === "all" && (
          <div>
            <h2 className="text-lg font-semibold mb-3 text-green-700">📋 All Batches</h2>
            {filteredBatches.length > 0 ? (
              <ul className="space-y-2">
                {filteredBatches.map((batch) => (
                  <li
                    key={batch._id}
                    className="p-3 border border-gray-300 rounded-lg flex justify-between items-center hover:bg-green-50 transition"
                  >
                    <div>
                      <p className="font-medium text-green-700">{batch.cropType}</p>
                      <p className="text-sm text-gray-500">{batch.batchCode}</p>
                    </div>
                    <span className="text-sm text-gray-600">
                      {batch.quantity} kg — {batch.collectionLocation}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center">No batches found 🌾</p>
            )}
          </div>
        )}

        {/* My Batches */}
        {view === "my" && (
          <div>
            <h2 className="text-lg font-semibold mb-3 text-green-700">👤 My Batches</h2>
            {userBatches.length > 0 ? (
              <ul className="space-y-2">
                {userBatches.map((batch) => (
                  <li
                    key={batch._id}
                    className="p-3 border border-gray-300 rounded-lg flex justify-between items-center hover:bg-green-50 transition"
                  >
                    <div>
                      <p className="font-medium text-green-700">{batch.cropType}</p>
                      <p className="text-sm text-gray-500">{batch.batchCode}</p>
                      <p className="text-sm text-gray-600">
                        {batch.quantity} kg — {batch.collectionLocation}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(batch._id)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(batch._id)}
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
                You haven’t created any batches yet 🌿
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchDashboard;
