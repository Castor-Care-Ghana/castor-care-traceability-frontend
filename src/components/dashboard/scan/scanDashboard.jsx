import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const ScanDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [scans, setScans] = useState([]);
  const [filter, setFilter] = useState("");
  const [view, setView] = useState(""); // "all" | "my"

  // Fetch all scans from backend
  useEffect(() => {
    const fetchScans = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BASE_URL}/scans`);
        if (!res.ok) throw new Error("Failed to fetch scans");
        const data = await res.json();
        setScans(data);
      } catch (error) {
        console.error("❌ Error fetching scans:", error);
      }
    };
    fetchScans();
  }, []);

  // Filter logic
  const filteredScans = scans.filter(
    (s) =>
      s.scanCode?.toLowerCase().includes(filter.toLowerCase()) ||
      s.packageType?.toLowerCase().includes(filter.toLowerCase())
  );

  const userScans = filteredScans.filter((s) => s.user?._id === user?.id);

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this scan?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/scans/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setScans((prev) => prev.filter((s) => s._id !== id));
      } else {
        console.error("Failed to delete scan");
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-green-700">🔍 Scan Dashboard</h1>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => navigate("/dashboard/scans/create")}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow"
        >
          ➕ Create Scan
        </button>

        <button
          onClick={() => setView("all")}
          className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 border border-gray-400"
        >
          📋 Show All Scans
        </button>

        <button
          onClick={() => setView("my")}
          className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 border border-gray-400"
        >
          👤 My Scans
        </button>
      </div>

      {/* Filter Bar */}
      {(view === "all" || view === "my") && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Filter by package type or scan code..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full p-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>
      )}

      {/* Content */}
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        {view === "" && (
          <p className="text-gray-600 text-center">
            Select an action to continue 🧾
          </p>
        )}

        {view === "all" && (
          <div>
            <h2 className="text-lg font-semibold mb-3 text-green-700">
              All Scans
            </h2>
            {filteredScans.length > 0 ? (
              <ul className="space-y-2">
                {filteredScans.map((scan) => (
                  <li
                    key={scan._id}
                    className="p-3 border border-gray-300 rounded-lg flex justify-between items-center hover:bg-green-50 transition"
                  >
                    <div>
                      <p className="font-medium text-green-700">
                        {scan.packageType}
                      </p>
                      <p className="text-sm text-gray-500">{scan.scanCode}</p>
                    </div>
                    <span className="text-sm text-gray-600">
                      {scan.batchCode || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center">No scans found 🧪</p>
            )}
          </div>
        )}

        {view === "my" && (
          <div>
            <h2 className="text-lg font-semibold mb-3 text-green-700">
              My Scans
            </h2>
            {userScans.length > 0 ? (
              <ul className="space-y-2">
                {userScans.map((scan) => (
                  <li
                    key={scan._id}
                    className="p-3 border border-gray-300 rounded-lg hover:bg-green-50 transition"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-green-700">
                          {scan.packageType}
                        </p>
                        <p className="text-sm text-gray-500">
                          {scan.scanCode}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(`/dashboard/scans/edit/${scan._id}`)
                          }
                          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(scan._id)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center">
                You haven’t created any scans yet 🔍
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanDashboard;
