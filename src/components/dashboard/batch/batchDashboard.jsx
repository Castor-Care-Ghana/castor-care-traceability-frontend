// src/components/dashboard/batch/BatchDashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useLocation, Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  apiGetBatches,
  apiUpdateBatch,
  apiDeleteBatch,
  apiGetFarmers,
} from "../../../services/traceability";

const BatchDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [batches, setBatches] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [filter, setFilter] = useState("");
  const [view, setView] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const newBatch = location.state?.newBatch;
  useEffect(() => {
    if (location.state?.newBatch) {
      setSelectedBatch(location.state.newBatch);
      setShowModal(true);
    }

  }, [location.state]);

  const basePath = `/dashboard/${user?.role?.toLowerCase()}`;

  // helpers
  const getId = (obj) => (typeof obj === "string" ? obj : obj?.id ?? obj?._id ?? null);

  const getFarmerIdFromBatch = (b) => {
    if (!b) return null;
    if (b.farmer) return getId(b.farmer);
    // fallback: maybe farmer stored on batch.user (rare)
    return getId(b.user);
  };

  const getFarmerNameFromBatch = (b) => {
    if (!b) return "Unknown";
    if (b.farmer) {
      const f = b.farmer;
      if (typeof f === "string") {
        // try resolve from farmers state
        const matched = farmers.find((x) => getId(x) === f);
        return matched ? `${matched.firstName || ""} ${matched.lastName || ""}`.trim() : f;
      } else {
        return `${f.firstName || ""} ${f.lastName || ""}`.trim() || b.user?.name || "Unknown";
      }
    }
    return b.user?.name || "Unknown";
  };

  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const isOwnerOf = (batch) => {
    const uid = getId(user);
    const bu = getId(batch?.user) || getFarmerIdFromBatch(batch);
    return uid && bu && String(uid) === String(bu);
  };

  // fetch farmers
  const fetchFarmers = async () => {
    try {
      const res = await apiGetFarmers();
      const arr = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const normalized = arr.map((f) => ({ ...f, id: f.id ?? f._id }));
      setFarmers(normalized);
    } catch (err) {
      console.error("❌ Error fetching farmers:", err);
      setFarmers([]);
    }
  };

  // fetch batches
  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await apiGetBatches();
      const arr = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const normalized = arr.map((b) => ({
        ...b,
        id: b.id ?? b._id,
        // support both crop (new) and cropType (older)
        crop: b.crop ?? b.cropType ?? "Unknown Crop",
      }));
      setBatches(normalized);
    } catch (err) {
      console.error("❌ Error fetching batches:", err);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
    fetchBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // filter logic (includes farmer name)
const filteredBatches = batches.filter((batch) => {
  const farmerName = batch.farmer 
    ? `${batch.farmer.firstName || ""} ${batch.farmer.lastName || ""}`.toLowerCase()
    : "";

  return (
    batch.crop.toLowerCase().includes(filter.toLowerCase()) ||
    batch.batchCode.toLowerCase().includes(filter.toLowerCase()) ||
    farmerName.includes(filter.toLowerCase())
  );
});

  const userBatches = filteredBatches.filter((b) => {
    // owner detection: compare batch.user or batch.user._id etc.
    const uid = getId(user);
    const bu = getId(b.user);
    return uid && bu && String(uid) === String(bu);
  });

  // CSV export (safe escaping + BOM)
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const exportToCSV = (data = [], filename = "batches.csv") => {
    if (!data || !data.length) {
      Swal.fire("No data", "There are no batches to download.", "info");
      return;
    }
    const headers = ["Farmer", "Crop", "Batch Code", "Quantity", "Location", "Receiver"];
    const rows = data.map((b) => {
      const farmerName = getFarmerNameFromBatch(b);
      const receiverName = b.user?.name || "Unknown";
      return [
        farmerName,
        b.crop || "",
        b.batchCode || "",
        b.quantity ?? "",
        b.collectionLocation || "",
        receiverName,
      ];
    });
    const csvLines = [headers.map(escapeCell).join(","), ...rows.map((r) => r.map(escapeCell).join(","))];
    const csvContent = "\uFEFF" + csvLines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Edit (dropdown for farmer)
 const handleEdit = async (batch) => {
  const batchId = batch?.id || batch?._id;
  if (!batchId) {
    Swal.fire("Error", "Batch ID not found.", "error");
    return;
  }

  // ✅ permission check
  const owner = isOwnerOf(batch);
  if (!isAdmin && !owner) {
    Swal.fire("Unauthorized", "You can only edit your own batches.", "warning");
    return;
  }

  // Pre-fill farmer
  const currentFarmerId = getFarmerIdFromBatch(batch) || "";
  const currentFarmerName = getFarmerNameFromBatch(batch);

  const safe = (v) =>
    v === undefined || v === null ? "" : String(v).replace(/"/g, "&quot;");

  const { value: formValues } = await Swal.fire({
    title: "Edit Batch",
    width: 600,
    html: `
      <div class="flex flex-col gap-3 text-left">
        <label class="text-sm text-gray-600">Farmer</label>
        <input id="swal-farmer-input" type="text"
          placeholder="Search farmer..."
          value="${safe(currentFarmerName)}"
          class="w-full border border-gray-300 rounded-lg px-3 py-2" />

        <div id="swal-farmer-suggestions"
          class="hidden max-h-32 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow mt-1"></div>

        <label class="text-sm text-gray-600">Crop</label>
        <input id="swal-crop" type="text" placeholder="Crop"
          value="${safe(batch.crop)}"
          class="w-full border border-gray-300 rounded-lg px-3 py-2" />

        <label class="text-sm text-gray-600">Quantity (kg)</label>
        <input id="swal-quantity" type="number" placeholder="Quantity (kg)"
          value="${safe(batch.quantity)}"
          class="w-full border border-gray-300 rounded-lg px-3 py-2" />

        <label class="text-sm text-gray-600">Collection Location</label>
        <input id="swal-location" type="text" placeholder="Collection Location"
          value="${safe(batch.collectionLocation)}"
          class="w-full border border-gray-300 rounded-lg px-3 py-2" />

        <label class="text-sm text-gray-600">Batch Code</label>
        <input type="text" value="${safe(batch.batchCode)}" disabled
          class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500" />

        <label class="text-sm text-gray-600">GPS Address</label>
        <input type="text" value="${safe(
          batch.gpsAddress ??
            `${batch.latitude ?? ""}${
              batch.longitude ? ", " + batch.longitude : ""
            }`
        )}" disabled
          class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500" />
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Save Changes",
    confirmButtonColor: "#166534",
    didOpen: () => {
      const input = document.getElementById("swal-farmer-input");
      const suggestionBox = document.getElementById("swal-farmer-suggestions");
      const preview = document.getElementById("swal-farmer-preview");
      let selectedFarmerId = currentFarmerId;

      input.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        const matches = farmers.filter((f) =>
          `${f.firstName} ${f.lastName}`.toLowerCase().includes(query)
        );

        if (matches.length === 0) {
          suggestionBox.innerHTML = "<div class='p-2 text-gray-400'>No farmers found</div>";
          suggestionBox.classList.remove("hidden");
          return;
        }

        suggestionBox.innerHTML = matches
          .map(
            (f) => `
            <div data-id="${f._id}" class="p-2 hover:bg-green-100 cursor-pointer border-b border-gray-100">
              ${f.firstName} ${f.lastName}
            </div>
          `
          )
          .join("");
        suggestionBox.classList.remove("hidden");

        suggestionBox.querySelectorAll("div[data-id]").forEach((el) => {
          el.addEventListener("click", () => {
            selectedFarmerId = el.dataset.id;
            input.value = el.innerText;
            suggestionBox.classList.add("hidden");
          });
        });
      });

      Swal.getPopup().dataset.farmerId = selectedFarmerId;
    },
    preConfirm: () => {
      const farmerSel = Swal.getPopup().dataset.farmerId || currentFarmerId;
      const cropVal = document.getElementById("swal-crop").value.trim();
      const qtyRaw = document.getElementById("swal-quantity").value;
      const collectionLocationVal =
        document.getElementById("swal-location").value.trim();

      if (!farmerSel) {
        Swal.showValidationMessage("Please select a valid farmer.");
        return false;
      }
      if (!cropVal) {
        Swal.showValidationMessage("Crop is required.");
        return false;
      }
      if (qtyRaw === "" || isNaN(qtyRaw) || Number(qtyRaw) <= 0) {
        Swal.showValidationMessage("Quantity must be a positive number.");
        return false;
      }
      if (!collectionLocationVal) {
        Swal.showValidationMessage("Collection location is required.");
        return false;
      }

      return {
        farmer: farmerSel,
        crop: cropVal,
        quantity: Number(qtyRaw),
        collectionLocation: collectionLocationVal,
      };
    },
  });

  if (!formValues) return;

  try {
    const payload = { ...formValues };
    await apiUpdateBatch(batchId, payload);
    Swal.fire("✅ Updated!", "Batch updated successfully.", "success");
    fetchBatches();
    setSelectedBatch(null);
  } catch (err) {
    console.error("❌ Edit error:", err);
    Swal.fire(
      "Error",
      err.response?.data?.message || "Failed to update batch.",
      "error"
    );
  }
};
  const handleDelete = async (id, batchUserId) => {
    const isOwner =
      batchUserId === user?.id ||
      batchUserId?.id === user?.id ||
      batchUserId?._id === user?.id;

    if (!isAdmin && !isOwner) {
      Swal.fire("Unauthorized", "You can only delete your own batches.", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the batch.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      await apiDeleteBatch(id);
      Swal.fire("Deleted!", "Batch has been deleted.", "success");
      setSelectedBatch(null);
      fetchBatches();
    } catch (error) {
      console.error("❌ Delete error:", error);
      Swal.fire("Error", error.response?.data?.message || "Failed to delete batch.", "error");
    }
  };

  const handleViewBatch = (batch) => setSelectedBatch(batch);
  const closeModal = () => setSelectedBatch(null);

  const canEditOrDelete =
    selectedBatch &&
    (user?.role?.toLowerCase() === "admin" ||
      selectedBatch.user === user?.id ||
      selectedBatch.user?.id === user?.id ||
      selectedBatch.user?._id === user?.id);

  if (loading) return <p className="p-6 text-center">Loading batches...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-green-700">🌿 Batch Dashboard</h1>

      {/* Stats button right */}
      <div className="flex justify-end mb-4">
        <Link
          to={`${basePath}/batches/stats`}
          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow text-sm"
        >
          📊 Statistics
        </Link>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mb-8">
        <Link
          to={`${basePath}/batches/create`}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow"
        >
          ➕ Create Batch
        </Link>

        <button
          onClick={() => setView("all")}
          className={`px-4 py-2 rounded-lg border border-gray-400 ${
            view === "all" ? "bg-green-600 text-white" : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
        >
          📋 Show All Batches
        </button>

        <button
          onClick={() => setView("my")}
          className={`px-4 py-2 rounded-lg border border-gray-400 ${
            view === "my" ? "bg-green-600 text-white" : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
        >
          👤 My Batches
        </button>
      </div>

        {/* ✅ Inline Farmer Card (after create) */}
{newBatch && view === "" && (
  <div className="inline-block bg-white p-4 rounded-lg shadow border border-green-200 w-100 auto m-2 align-top">
    <h2 className="text-xl font-bold text-green-700 mb-4">
      🎉 New Batch Added
    </h2>
    <div className="flex flex-col items-center">
      {/* Batch Info */}
      <div className="text-left space-y-1 flex-1">
        <h2 className="text-base-center text-xl font-bold text-green-700 mb-2">
         {newBatch.batchCode || "N/A"}
        </h2>
        <p className="text-s text-gray-600">
        Farmer: {getFarmerNameFromBatch(newBatch) || "N/A"}
      </p>

        <p className="text-s text-gray-600">
          Crop: {newBatch.crop || "N/A"}
        </p>
        <p className="text-s text-gray-600">
          Quantity: {newBatch.quantity || "N/A"} kg
        </p>
        <p className="text-s text-gray-600">
          Collection Location: {newBatch.collectionLocation || "N/A"}
        </p>
        <p className="text-s text-gray-600">
        GPS:{" "}
        {newBatch.gpsAddress ||
          [newBatch.latitude, newBatch.longitude, newBatch.fullAddress]
            .filter(Boolean)
            .join(", ") ||
          "N/A"}
      </p>
      <p className="text-s text-gray-600">
          Received By: {newBatch.user?.name || "N/A"}
        </p>

        <p className="text-s text-gray-600">
          Date:{" "}
          {newBatch.createdAt
            ? new Date(newBatch.createdAt).toLocaleDateString()
            : "N/A"}
        </p>
      </div>

      {/* Edit/Delete Buttons */}
      <div className="flex justify-center gap-4 mt-3">
        <button
          onClick={() => handleEdit(newBatch)}
          className="text-green-600 hover:text-green-800 text-lg"
          title="Edit Batch"
        >
          ✏️
        </button>
        <button
          onClick={() => handleDelete(newBatch.id || newBatch._id, newBatch.user)}
          className="text-red-500 hover:text-red-700 text-lg"
          title="Delete Batch"
        >
          🗑️
        </button>
      </div>
    </div>
  </div>
)}


      {/* Filter + CSV */}
      {(view === "all" || view === "my") && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {view === "all" ? "All Batches" : "My Batches"}
          </h2>

          <div className="flex items-center gap-3">
            <div className="relative w-40">
              <span className="absolute inset-y-0 left-2 flex items-center text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Filter batches..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Farmer filter dropdown
            <select
              value={farmerFilter}
              onChange={(e) => setFarmerFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              title="Filter by farmer"
            >
              <option value="">All Farmers</option>
              {farmers.map((f) => (
                <option key={getId(f) || f._id} value={getId(f) || f._id}>
                  {`${f.firstName || ""} ${f.lastName || ""}`.trim() || f.name}
                </option>
              ))}
            </select> */}

            <button
              onClick={() =>
                exportToCSV(view === "all" ? filteredBatches : userBatches, `${view === "all" ? "all_batches" : "my_batches"}.csv`)
              }
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow text-sm"
            >
              ⬇️ CSV
            </button>
          </div>
        </div>
      )}

      {/* Batches List */}
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        {view === "" && <p className="text-gray-600 text-center">Select an action to continue 🌱</p>}

        {view === "all" &&
          (filteredBatches.length ? (
            <ul className="space-y-2">
              {filteredBatches.map((b) => (
                <li
                  key={b.id}
                  onClick={() => handleViewBatch(b)}
                  className="p-3 border border-gray-300 rounded-lg flex items-center gap-3 hover:bg-green-50 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-lg border border-green-400">
                    {b.crop?.charAt(0)?.toUpperCase() || "?"}
                  </div>

                  <div>
                    <p className="font-medium text-green-700">{b.crop}</p>
                    <p className="text-sm text-gray-500">Code: {b.batchCode}</p>
                    <p className="text-sm text-gray-600">Qty: {b.quantity} kg</p>
                    <p className="text-xs text-gray-400">Farmer: {getFarmerNameFromBatch(b)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">No batches found 🌾</p>
          ))}

        {view === "my" &&
          (userBatches.length ? (
            <ul className="space-y-2">
              {userBatches.map((b) => (
                <li
                  key={b.id}
                  className="p-3 border border-gray-300 rounded-lg flex items-center gap-3 hover:bg-green-50"
                >
                  <div
                    className="cursor-pointer flex-1"
                    onClick={() => handleViewBatch(b)}
                  >
                    <p className="font-medium text-green-700">{b.crop}</p>
                    <p className="text-sm text-gray-500">Code: {b.batchCode}</p>
                    <p className="text-sm text-gray-600">Qty: {b.quantity} kg</p>
                  </div>

                  <div className="flex gap-3 ml-4">
                    <button
                      onClick={() => handleEdit(b)}
                      className="text-green-600 hover:text-green-800 text-lg"
                      title="Edit Batch"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(b.id, b.user)}
                      className="text-red-500 hover:text-red-700 text-lg"
                      title="Delete Batch"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">You haven’t created any batches yet 🌿</p>
          ))}
      </div>

      {/* Selected Batch Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full relative">
            <button onClick={closeModal} className="absolute top-2 right-3 text-gray-600 hover:text-gray-800 text-xl">✖</button>
            <h2 className="text-xl font-semibold text-green-700 mb-4">Batch Details</h2>

            <div className="space-y-2 text-gray-700">
              <p><strong>Crop:</strong> {selectedBatch.crop}</p>
              <p><strong>Batch Code:</strong> {selectedBatch.batchCode}</p>
              <p><strong>Quantity:</strong> {selectedBatch.quantity} kg</p>
              <p><strong>Location:</strong> {selectedBatch.collectionLocation}</p>
              <p><strong>Receiver:</strong> {user?.name || "Unknown"}</p>
              <p><strong>Farmer:</strong> {getFarmerNameFromBatch(selectedBatch)}</p>
            </div>

            {((isAdmin) || isOwnerOf(selectedBatch)) && (
              <div className="flex justify-end gap-3 mt-5">
                <button onClick={() => handleEdit(selectedBatch)} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">✏️ Edit</button>
                <button onClick={() => handleDelete(selectedBatch.id, selectedBatch.user)} className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">🗑️ Delete</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchDashboard;
