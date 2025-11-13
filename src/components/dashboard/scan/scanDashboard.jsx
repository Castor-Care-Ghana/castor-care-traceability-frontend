import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  apiGetScans,
  apiUpdateScan,
  apiDeleteScan,
} from "../../../services/traceability";
import { Link } from "react-router-dom";


const ScanDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [scans, setScans] = useState([]);
  const [filter, setFilter] = useState("");
  const [view, setView] = useState("");
  const [selectedScan, setSelectedScan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const newScan = location.state?.newScan;
  const basePath = `/dashboard/${user?.role?.toLowerCase()}`;

  useEffect(() => {
    if (location.state?.newScan) {
      setSelectedScan(location.state.newScan);
      setShowModal(true);
    }
  }, [location.state]);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const response = await apiGetScans();
      const scansArray = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      const formatted = scansArray.map((s) => ({
        ...s,
        id: s.id ?? s._id,
        packageId:
          (s.package && (s.package._id || s.package.id || s.package)) || "",
        packageName: s.package && s.package.name ? s.package.name : "",
        scannedBy: s.scannedBy || "",
        location: s.location || "",
        user: s.user || null,
        createdAt:
          s.createdAt || s.created_at || s.timestamp || new Date().toISOString(),
      }));

      formatted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setScans(formatted);
    } catch (error) {
      console.error("❌ Error fetching scans:", error);
      Swal.fire("Error", "Failed to fetch scans", "error");
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const exportToCSV = (data, filename = "scans.csv") => {
    if (!data || !data.length) {
      Swal.fire("No data", "There are no scans to download.", "info");
      return;
    }

    const headers = [
      "Scan ID",
      "Package ID",
      "Package Name",
      "Scanned By",
      "Location",
      "User ID",
      "Date",
    ];
    const rows = data.map((s) => [
      s.id || s._id || "N/A",
      s.packageId || "N/A",
      s.packageName || "N/A",
      s.scannedBy || "N/A",
      s.location || "N/A",
      (s.user && (s.user._id || s.user.id)) ||
        s.user ||
        "Anonymous",
      new Date(s.createdAt).toLocaleString(),
    ]);

    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const filteredScans = scans.filter((s) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;

    return (
      (s.id || "").toString().toLowerCase().includes(q) ||
      (s.packageId || "").toString().toLowerCase().includes(q) ||
      (s.packageName || "").toLowerCase().includes(q) ||
      (s.scannedBy || "").toLowerCase().includes(q) ||
      (s.location || "").toLowerCase().includes(q) ||
      ((s.user && (s.user._id || s.user.id)) ||
        s.user ||
        "")
        .toString()
        .toLowerCase()
        .includes(q)
    );
  });

  const userScans = filteredScans.filter(
    (s) =>
      s.user === user?.id ||
      (s.user && (s.user.id === user?.id || s.user._id === user?.id))
  );

  // Edit scan
  const handleEdit = async (scan) => {
    const scanId = scan?.id || scan?._id;
    if (!scanId) {
      Swal.fire("Error", "Scan ID not found.", "error");
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: "Edit Scan Information",
      html: `
        <div class="flex flex-col gap-3 text-left">
          <input id="swal-package" type="text" placeholder="Package ID"
            value="${scan.packageId || ""}"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:outline-none" disabled />
          <input id="swal-scannedBy" type="text" placeholder="Scanned By"
            value="${scan.scannedBy || ""}"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:outline-none" disabled />
          <input id="swal-location" type="text" placeholder="Location"
            value="${scan.location || ""}"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:outline-none" />
            <select id="swal-status" class="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:outline-none">
              <option value="" disabled ${!scan.status ? "selected" : ""}>Select Status</option>
              <option value="sold" ${scan.status === "sold" ? "selected" : ""}>Sold</option>
              <option value="in transit" ${scan.status === "in transit" ? "selected" : ""}>In Transit</option>
              <option value="delivered" ${scan.status === "delivered" ? "selected" : ""}>Delivered</option>
              <option value="returned" ${scan.status === "returned" ? "selected" : ""}>Returned</option>
              <option value="available" ${scan.status === "available" ? "selected" : ""}>Available</option>
            </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      confirmButtonColor: "#166534",
      preConfirm: () => {
        const getVal = (id) => document.getElementById(id)?.value.trim() || "";
        return {
          package: getVal("swal-package"),
          scannedBy: getVal("swal-scannedBy"),
          location: getVal("swal-location"),
          status: getVal("swal-status"),
        };
      },
    });

    if (!formValues) return;

    try {
      const payload = {
        location: formValues.location,
        status: formValues.status,
      };

      await apiUpdateScan(scanId, payload);
      Swal.fire("✅ Updated!", "Scan information updated successfully.", "success");
      fetchScans();
      setSelectedScan(null);
    } catch (error) {
      console.error("❌ Edit error:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Failed to update scan.",
        "error"
      );
    }
  };

  // Delete scan
  const handleDelete = async (id, scanUserId) => {
    const isAdmin = user?.role?.toLowerCase() === "admin";
    const isOwner =
      scanUserId === user?.id ||
      scanUserId?.id === user?.id ||
      scanUserId?._id === user?.id;

    if (!isAdmin && !isOwner) {
      Swal.fire("Unauthorized", "You can only delete your own scans.", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the scan record.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      await apiDeleteScan(id);
      Swal.fire("Deleted!", "Scan has been deleted.", "success");
      setSelectedScan(null);
      fetchScans();
    } catch (error) {
      console.error("❌ Delete error:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Failed to delete scan.",
        "error"
      );
    }
  };

  const handleViewScan = (scan) => {
    setSelectedScan(scan);
    setShowModal(true);
  };
  const closeModal = () => {
    setSelectedScan(null);
    setShowModal(false);
  };

  const canEditOrDelete =
    selectedScan &&
    (user?.role?.toLowerCase() === "admin" ||
      selectedScan.user === user?.id ||
      selectedScan.user?.id === user?.id ||
      selectedScan.user?._id === user?.id);

  if (loading) return <p className="p-6 text-center">Loading scans...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-green-700">📦 Scan Dashboard</h1>

      {/* Buttons */}
      <div className="flex gap-4 mb-8">
        <Link
          to={`${basePath}/scans/perform`}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow"
        >
          ➕ Record Scan
        </Link>

        <button
          onClick={() => setView("all")}
          className={`px-4 py-2 rounded-lg border border-gray-400 ${
            view === "all"
              ? "bg-green-600 text-white"
              : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
        >
          📋 Show All Scans
        </button>

        <button
          onClick={() => setView("my")}
          className={`px-4 py-2 rounded-lg border border-gray-400 ${
            view === "my"
              ? "bg-green-600 text-white"
              : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
        >
          👤 My Scans
        </button>
      </div>

      {/* Inline Card after create (mirrors FarmerDashboard inline card) */}
      {newScan && view === "" && (
        <div className="inline-block bg-white p-4 rounded-lg shadow border border-green-200 w-100 auto m-2 align-top">
          <h2 className="text-xl font-bold text-green-700 mb-4">🎉 New Scan Recorded</h2>
          <div className="flex flex-col items-center">
            {/* Icon / Avatar */}
            <div className="w-20 h-20 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-xl border-2 border-green-500 mb-3">
              📦
            </div>

            <div className="text-left space-y-1 flex-1">
              <h2 className="text-base-center font-bold text-green-700">
                Package: {newScan.packageName || newScan.package || "N/A"}
              </h2>
              <p className="text-s text-gray-600">Scan ID: {newScan.id || newScan._id || "N/A"}</p>
              <p className="text-s text-gray-600">Scanned By: {newScan.scannedBy || "N/A"}</p>
              <p className="text-s text-gray-600">Location: {newScan.location || "N/A"}</p>
              <p className="text-s text-gray-600">User: {(newScan.user && (newScan.user._id || newScan.user.id)) || newScan.user || "Anonymous"}</p>
              <p className="text-s text-gray-600">Date: {new Date(newScan.createdAt || new Date()).toLocaleString()}</p>
            </div>

            <div className="flex justify-center gap-4 mt-3">
              <button
                onClick={() => handleEdit(newScan)}
                className="text-green-600 hover:text-green-800 text-lg"
                title="Edit Scan"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(newScan.id || newScan._id, newScan.user)}
                className="text-red-500 hover:text-red-700 text-lg"
                title="Delete Scan"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      )}

      {(view === "all" || view === "my") && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {view === "all" ? "All Scans" : "My Scans"}
          </h2>

          <div className="flex items-center gap-3">
            {/* Search box */}
            <div className="relative w-40">
              <span className="absolute inset-y-0 left-2 flex items-center text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Filter scans..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* CSV Download */}
            <button
              onClick={() =>
                exportToCSV(view === "all" ? filteredScans : userScans, `${view === "all" ? "all_scans" : "my_scans"}.csv`)
              }
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow text-sm"
            >
              ⬇️ CSV
            </button>
          </div>
        </div>
      )}

      {/* Scans Table / List */}
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        {view === "" && <p className="text-gray-600 text-center">Select an action to continue 🌱</p>}

        {view === "all" &&
          (filteredScans.length ? (
            <ul className="space-y-2">
              {filteredScans.map((s) => (
                <li
                  key={s.id || s._id}
                  onClick={() => handleViewScan(s)}
                  className="p-3 border border-gray-300 rounded-lg flex items-center gap-3 hover:bg-green-50 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-lg border border-green-400">
                    📦
                  </div>

                  <div>
                    <p className="font-medium text-green-700">{s.packageName || s.packageId || "Package"}</p>
                    <p className="text-sm text-gray-500">Scanned By: {s.scannedBy}</p>
                    <p className="text-sm text-gray-600">{s.location}</p>
                  </div>

                  <div className="ml-auto text-right">
                    <p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">No scans found 📭</p>
          ))}

        {view === "my" &&
          (userScans.length ? (
            <ul className="space-y-2">
              {userScans.map((s) => (
                <li
                  key={s.id || s._id}
                  className="p-3 border border-gray-300 rounded-lg flex items-center gap-3 hover:bg-green-50"
                >
                  <div className="w-10 h-10 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-lg border border-green-400">
                    📦
                  </div>

                  <div className="cursor-pointer flex-1" onClick={() => handleViewScan(s)}>
                    <p className="font-medium text-green-700">{s.packageName || s.packageId || "Package"}</p>
                    <p className="text-sm text-gray-500">Scanned By: {s.scannedBy}</p>
                    <p className="text-sm text-gray-600">{s.location}</p>
                  </div>

                  <div className="flex gap-3 ml-4">
                    <button
                      onClick={() => handleEdit(s)}
                      className="text-green-600 hover:text-green-800 text-lg"
                      title="Edit Scan"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(s.id || s._id, s.user)}
                      className="text-red-500 hover:text-red-700 text-lg"
                      title="Delete Scan"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">You haven’t recorded any scans yet 🌿</p>
          ))}
      </div>

      {/* Modal */}
      {selectedScan && showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-3 text-gray-600 hover:text-gray-800 text-xl"
            >
              ✖
            </button>
            <h2 className="text-xl font-semibold text-green-700 mb-4">Scan Details</h2>

            <div className="space-y-2 text-gray-700">
              <p><strong>Package:</strong> {selectedScan.packageName || selectedScan.packageId || selectedScan.package || "N/A"}</p>
              <p><strong>Scan ID:</strong> {selectedScan.id || selectedScan._id}</p>
              <p><strong>Scanned By:</strong> {selectedScan.scannedBy}</p>
              <p><strong>Location:</strong> {selectedScan.location}</p>
              <p><strong>User:</strong> {(selectedScan.user && (selectedScan.user._id || selectedScan.user.id)) || selectedScan.user || "Anonymous"}</p>
              <p><strong>Date:</strong> {new Date(selectedScan.createdAt).toLocaleString()}</p>
            </div>

            {canEditOrDelete && (
              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => handleEdit(selectedScan)}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(selectedScan.id || selectedScan._id, selectedScan.user)}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanDashboard;
