// src/components/dashboard/package/PackageDashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useLocation, Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  apiGetPackages,
  apiUpdatePackage,
  apiDeletePackage,
} from "../../../services/traceability";

const PackageDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [packages, setPackages] = useState([]);
  const [filter, setFilter] = useState("");
  const [view, setView] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);

  const newPackage = location.state?.newPackage;

  useEffect(() => {
    // if a newPackage was passed through location state, open modal for it
    if (location.state?.newPackage) {
      setSelectedPackage(location.state.newPackage);
    }
  }, [location.state]);

  const basePath = `/dashboard/${user?.role?.toLowerCase()}`;

  // Helpers
  const getId = (obj) =>
    typeof obj === "string" ? obj : obj?.id ?? obj?._id ?? null;

  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const isOwnerOf = (pkg) => {
    const uid = getId(user);
    const pu = getId(pkg?.user);
    return uid && pu && String(uid) === String(pu);
  };

  // Fetch packages
  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await apiGetPackages();
      // support various response shapes: res.data, res.data.data, or array returned directly
      const arr =
        Array.isArray(res?.data?.data) ? res.data.data :
        Array.isArray(res?.data) ? res.data :
        Array.isArray(res) ? res :
        Array.isArray(res?.data?.packages) ? res.data.packages :
        [];

      setPackages(
        arr.map((p) => ({
          ...p,
          id: p.id ?? p._id,
          product: p.batch?.crop ?? p.batch?.cropType ?? "Unknown Crop",
        }))
      );
    } catch (err) {
      console.error("❌ Error fetching packages:", err);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Filter logic (case-insensitive)
  const filteredPackages = packages.filter(
    (pkg) =>
      (pkg.batch?.crop || pkg.batch?.cropType || "")
        .toLowerCase()
        .includes(filter.toLowerCase()) ||
      (pkg.packageCode || "").toLowerCase().includes(filter.toLowerCase())
  );

  const userPackages = filteredPackages.filter((p) => {
    const uid = getId(user);
    const pu = getId(p.user);
    return uid && pu && String(uid) === String(pu);
  });

  // Stats
  const totalPackages = packages.length;
  const totalWeight = packages.reduce((sum, p) => sum + (p.weight || 0), 0);
  const uniqueProducts = [
    ...new Set(packages.map((p) => p.product || "")),
  ].length;
  const myPackages = userPackages.length;

  // Export CSV
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    return `"${String(val).replace(/"/g, '""')}"`;
  };

  const exportToCSV = (data = [], filename = "packages.csv") => {
    if (!data.length) {
      Swal.fire("No data", "There are no packages to download.", "info");
      return;
    }
    const headers = [
      "Product",
      "Package Code",
      "Weight",
      "Destination",
      "Receiver",
    ];
    const rows = data.map((p) => [
      p.batch?.crop || p.batch?.cropType || "",
      p.packageCode || "",
      p.weight ?? "",
      p.destination || "",
      p.user?.name || "Unknown",
    ]);
    const csvLines = [
      headers.map(escapeCell).join(","),
      ...rows.map((r) => r.map(escapeCell).join(",")),
    ];
    const csvContent = "\uFEFF" + csvLines.join("\r\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Edit
  const handleEdit = async (pkg) => {
    const pkgId = pkg?.id || pkg?._id;
    if (!pkgId) {
      Swal.fire("Error", "Package ID not found.", "error");
      return;
    }
    if (!isAdmin && !isOwnerOf(pkg)) {
      Swal.fire(
        "Unauthorized",
        "You can only edit your own packages.",
        "warning"
      );
      return;
    }

    const safe = (v) =>
      v === undefined || v === null
        ? ""
        : String(v).replace(/"/g, "&quot;");

    const { value: formValues } = await Swal.fire({
      title: "Edit Package",
      width: 600,
      html: `
        <div class="flex flex-col gap-3 text-left">
          <label class="text-sm text-gray-600">Product</label>
          <input id="swal-product" type="text" value="${safe(
            pkg.batch?.crop
          )}" disabled
            class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500" />
          
          <label class="text-sm text-gray-600">Weight (kg)</label>
          <input id="swal-weight" type="number" value="${safe(pkg.weight)}"
            class="w-full border border-gray-300 rounded-lg px-3 py-2" />

          <label class="text-sm text-gray-600">Package Code</label>
          <input type="text" value="${safe(
            pkg.packageCode
          )}" disabled
            class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500" />

            <label class="text-sm text-gray-600">Batch Code</label>
          <input type="text" value="${safe(
            pkg.batch?.batchCode
          )}" disabled
            class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500" />
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      confirmButtonColor: "#166534",
      preConfirm: () => {
        return {
          weight: Number(document.getElementById("swal-weight").value),
        };
      },
    });

    if (!formValues) return;

    try {
      await apiUpdatePackage(pkgId, formValues);
      Swal.fire("✅ Updated!", "Package updated successfully.", "success");
      fetchPackages();
      setSelectedPackage(null);
    } catch (err) {
      console.error("❌ Edit error:", err);
      Swal.fire(
        "Error",
        err?.response?.data?.message || err.message,
        "error"
      );
    }
  };

  // Delete
  const handleDelete = async (id, pkgUser) => {
    const isOwner = String(getId(pkgUser)) === String(getId(user));
    if (!isAdmin && !isOwner) {
      Swal.fire(
        "Unauthorized",
        "You can only delete your own packages.",
        "warning"
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the package.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete",
    });
    if (!confirm.isConfirmed) return;

    try {
      await apiDeletePackage(id);
      Swal.fire("Deleted!", "Package has been deleted.", "success");
      setSelectedPackage(null);
      fetchPackages();
    } catch (error) {
      console.error("❌ Delete error:", error);
      Swal.fire("Error", "Failed to delete package.", "error");
    }
  };

  const handleView = (pkg) => setSelectedPackage(pkg);
  const closeModal = () => setSelectedPackage(null);

  const canEditOrDelete =
    selectedPackage &&
    (user?.role?.toLowerCase() === "admin" ||
      selectedPackage.user === user?.id ||
      selectedPackage.user?.id === user?.id ||
      selectedPackage.user?._id === user?.id);

  if (loading) return <p className="p-6 text-center">Loading packages...</p>;

  // Helper to render farmer name safely whether populated object or id string
  const renderFarmerName = (pkg) => {
    const farmer = pkg?.batch?.farmer;
    if (!farmer) return "N/A";
    if (typeof farmer === "string") {
      // backend returned only id
      return farmer;
    }
    // farmer is an object
    const first = farmer.firstName || farmer.name || "";
    const last = farmer.lastName || "";
    const full = `${first} ${last}`.trim();
    return full || "N/A";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-green-700">
        📦 Package Dashboard
      </h1>

      <div className="flex justify-end mb-4">
        <Link
          to={`${basePath}/packages/stats`}
          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow text-sm"
        >
          📊 Statistics
        </Link>
      </div>

      {/* Stats Inline */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-100 p-2 rounded-lg shadow text-center">
          <p className="text-xl font-bold text-green-700">{totalPackages}</p>
          <p className="text-sm text-gray-600">Total Packages</p>
        </div>
        <div className="bg-blue-100 p-2 rounded-lg shadow text-center">
          <p className="text-xl font-bold text-blue-700">{uniqueProducts}</p>
          <p className="text-sm text-gray-600">Unique Products</p>
        </div>
        <div className="bg-yellow-100 p-2 rounded-lg shadow text-center">
          <p className="text-xl font-bold text-yellow-700">
            {totalWeight} kg
          </p>
          <p className="text-sm text-gray-600">Total Weight</p>
        </div>
        <div className="bg-purple-100 p-2 rounded-lg shadow text-center">
          <p className="text-xl font-bold text-purple-700">{myPackages}</p>
          <p className="text-sm text-gray-600">My Packages</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <Link
          to={`${basePath}/packages/create`}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow"
        >
          ➕ Create Package
        </Link>
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

      {/* Inline new package card */}
      {newPackage && (
        <div className="mb-6 p-4 border border-green-300 bg-green-50 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-green-800 mb-2">
            🎉 New Package Created!
          </h2>
          <p>
            <strong>Package Code:</strong> {newPackage.packageCode}
          </p>
          <p>
            <strong>Crop:</strong> {newPackage.batch?.crop || "N/A"}
          </p>
          <p>
            <strong>Weight:</strong> {newPackage.weight} kg
          </p>
          <p>
            <strong>Batch Code:</strong> {newPackage.batch?.batchCode || "N/A"}
          </p>

          {/* backend-generated link / qrCode */}
          {(newPackage.link || newPackage.qrCode) && (
            <p className="mt-2">
              <a
                href={newPackage.link || newPackage.qrCode}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                🔗 View Traceability Link
              </a>
            </p>
          )}
        </div>
      )}

      {/* Filter + CSV */}
      {(view === "all" || view === "my") && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {view === "all" ? "All Packages" : "My Packages"}
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Filter packages..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-40 pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={() =>
                exportToCSV(
                  view === "all" ? filteredPackages : userPackages,
                  `${view}_packages.csv`
                )
              }
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow text-sm"
            >
              ⬇️ CSV
            </button>
          </div>
        </div>
      )}

      {/* Package List */}
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        {view === "" && (
          <p className="text-gray-600 text-center">
            Select an action to continue 📦
          </p>
        )}

        {view === "all" &&
          (filteredPackages.length ? (
            <ul className="space-y-2">
              {filteredPackages.map((p) => (
                <li
                  key={p.id}
                  onClick={() => handleView(p)}
                  className="p-3 border border-gray-300 rounded-lg flex items-center gap-3 hover:bg-green-50 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-lg border border-green-400">
                    {p.product?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-green-700">{p.batch?.crop || p.batch?.cropType || "Unknown"}</p>
                    <p className="text-sm text-gray-500">
                      Code: {p.packageCode}
                    </p>
                    <p className="text-sm text-gray-600">
                      Weight: {p.weight} kg
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">No packages found 📭</p>
          ))}

        {view === "my" &&
          (userPackages.length ? (
            <ul className="space-y-2">
              {userPackages.map((p) => (
                <li
                  key={p.id}
                  className="p-3 border border-gray-300 rounded-lg flex items-center gap-3 hover:bg-green-50"
                >
                  <div
                    className="cursor-pointer flex-1"
                    onClick={() => handleView(p)}
                  >
                    <p className="font-medium text-green-700">
                      {p.batch?.crop}
                    </p>
                    <p className="text-sm text-gray-500">
                      Code: {p.packageCode}
                    </p>
                    <p className="text-sm text-gray-600">
                      Weight: {p.weight} kg
                    </p>
                  </div>
                  <div className="flex gap-3 ml-4">
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-green-600 hover:text-green-800 text-lg"
                      title="Edit Package"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.user)}
                      className="text-red-500 hover:text-red-700 text-lg"
                      title="Delete Package"
                    >
                      🗑️
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

      {/* Selected Package Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-3 text-gray-600 hover:text-gray-800 text-xl"
            >
              ✖
            </button>
            <h2 className="text-xl font-semibold text-green-700 mb-4">
              Package Details
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Package Code:</strong> {selectedPackage.packageCode}
              </p>
              <p>
                <strong>Crop:</strong> {selectedPackage.batch?.crop || "N/A"}
              </p>
              <p>
                <strong>Batch:</strong> {selectedPackage.batch?.batchCode || "N/A"}
              </p>
              <p>
                <strong>Weight:</strong> {selectedPackage.weight} kg
              </p>
              <p>
                <strong>Packed By:</strong>{" "}
                {selectedPackage.user?.name || "Unknown"}
              </p>
              <p>
                <strong>Farmer:</strong>{" "}
                {renderFarmerName(selectedPackage)}
              </p>
              <p><strong>Source:</strong> {selectedPackage.batch?.collectionLocation|| "N/A"}</p>

              {/* backend-generated link (qrCode or link) */}
              {(selectedPackage.link || selectedPackage.qrCode) && (
                <p>
                  <strong>Traceability Link:</strong>{" "}
                  <a
                    href={selectedPackage.link || selectedPackage.qrCode}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {selectedPackage.link || selectedPackage.qrCode}
                  </a>
                </p>
              )}
            </div>
            {(isAdmin || isOwnerOf(selectedPackage)) && (
              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => handleEdit(selectedPackage)}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() =>
                    handleDelete(selectedPackage.id, selectedPackage.user)
                  }
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

export default PackageDashboard;

