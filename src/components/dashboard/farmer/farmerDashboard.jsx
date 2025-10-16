import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  apiGetFarmers,
  apiUpdateFarmer,
  apiDeleteFarmer,
} from "../../../services/traceability";

const FarmerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [farmers, setFarmers] = useState([]);
  const [filter, setFilter] = useState("");
  const [view, setView] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const newFarmer = location.state?.newFarmer;
  
  useEffect(() => {
    if (location.state?.newFarmer) {
      setSelectedFarmer(location.state.newFarmer);
      setShowModal(true);
    }
  }, [location.state]);

  const basePath = `/dashboard/${user?.role?.toLowerCase()}`;

  const fetchFarmers = async () => {
    try {
      const response = await apiGetFarmers();
      const farmersArray = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      const formattedFarmers = farmersArray.map((f) => ({
        ...f,
        id: f.id ?? f._id,
        name: `${f.firstName || ""} ${f.lastName || ""}`.trim(),
      }));

      formattedFarmers.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );

      setFarmers(formattedFarmers);
    } catch (error) {
      console.error("❌ Error fetching farmers:", error);
      Swal.fire("Error", "Failed to fetch farmers", "error");
      setFarmers([]);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const filteredFarmers = farmers.filter(
    (f) =>
      f.name?.toLowerCase().includes(filter.toLowerCase()) ||
      (f.farmerCode || "").toLowerCase().includes(filter.toLowerCase()) ||
      (f.email || "").toLowerCase().includes(filter.toLowerCase())
  );

  // ✅ CSV Export
const exportToCSV = (data, filename = "farmers.csv") => {
  if (!data.length) {
    Swal.fire("No data", "There are no farmers to download.", "info");
    return;
  }

  // Pick only needed fields
  const headers = ["Name", "Email", "Phone", "Address", "Farm Size", "Crop Type", "GPS", "ID Number", "Gender"];
  const rows = data.map((f) => [
    f.name || "",
    f.email || "",
    f.phone || "",
    f.address || "",
    f.farmSize || "",
    f.cropType || "",
    f.gpsAddress || "",
    f.idNumber || "",
    f.gender || "",
  ]);

  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

  const userFarmers = filteredFarmers.filter(
    (f) =>
      f.user === user?.id ||
      f.user?.id === user?.id ||
      f.user?._id === user?.id
  );

  const handleEdit = async (farmer) => {
    const farmerId =
      farmer?.id ||
      farmer?._id ||
      farmer?.farmerId ||
      farmer?.farmer?.id ||
      farmer?.farmer?._id;

    if (!farmerId) {
      Swal.fire("Error", "Farmer ID not found.", "error");
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: "Edit Farmer Information",
      html: `
        <div class="flex flex-col gap-3 text-left">
          <input id="swal-fname" type="text" placeholder="First Name"
            value="${farmer.firstName || ""}"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:outline-none" required />

          <input id="swal-lname" type="text" placeholder="Last Name"
            value="${farmer.lastName || ""}"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:outline-none" required />

          <input id="swal-idNumber" type="text" placeholder="GHA-000000000-0"
            value="${farmer.idNumber || ""}"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:outline-none" required />

          <select id="swal-gender"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-600 focus:outline-none" required>
            <option value="">Select Gender</option>
            <option value="male" ${farmer.gender === "male" ? "selected" : ""}>Male</option>
            <option value="female" ${farmer.gender === "female" ? "selected" : ""}>Female</option>
            <option value="other" ${farmer.gender === "other" ? "selected" : ""}>Other</option>
          </select>

          <input id="swal-email" type="email" placeholder="Email"
            value="${farmer.email || ""}"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:outline-none" />

          <input id="swal-phone" type="text" placeholder="Phone Number"
            value="${farmer.phone || ""}"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:outline-none" />

          <input id="swal-address" type="text" placeholder="Address"
            value="${farmer.address || ""}"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:outline-none" required />

          <input id="swal-gps" type="text" placeholder="GA-000-0000"
            value="${farmer.gpsAddress || ""}"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:outline-none" />

          <input id="swal-farmSize" type="text" placeholder="Farm Size (e.g. 5 acres)"
            value="${farmer.farmSize || ""}"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:outline-none" required />

          <input id="swal-cropType" type="text" placeholder="Crop Type (e.g. Maize)"
            value="${farmer.cropType || ""}"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-500 focus:ring-2 focus:ring-green-600 focus:outline-none" required />

          <div class="flex items-center gap-2">
            <input type="file" id="swal-imageFile" accept="image/*"
              class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-600 focus:outline-none" />
          </div>

          <img id="swal-preview" src="${farmer.image || ""}"
            class="w-24 h-24 rounded-full object-cover border border-gray-300 mt-2 ${
              farmer.image ? "" : "hidden"
            }" />
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      confirmButtonColor: "#166534",
      preConfirm: () => {
        const getVal = (id) => document.getElementById(id)?.value.trim() || "";
        const previewEl = document.getElementById("swal-preview");
        const previewSrc = previewEl?.src;
        const imageToSend =
          previewSrc && previewSrc.startsWith("data:") ? previewSrc : undefined;

        return {
          firstName: getVal("swal-fname"),
          lastName: getVal("swal-lname"),
          idNumber: getVal("swal-idNumber"),
          gender: getVal("swal-gender"),
          email: getVal("swal-email"),
          phone: getVal("swal-phone"),
          address: getVal("swal-address"),
          gpsAddress: getVal("swal-gps"),
          farmSize: getVal("swal-farmSize"),
          cropType: getVal("swal-cropType"),
          image: imageToSend,
        };
      },
      didOpen: () => {
        const fileInput = document.getElementById("swal-imageFile");
        const preview = document.getElementById("swal-preview");
        fileInput?.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            preview.src = ev.target.result;
            preview.classList.remove("hidden");
          };
          reader.readAsDataURL(file);
        });
      },
    });

    if (!formValues) return;

    try {
      const payload = { ...formValues };
      if (!payload.image) delete payload.image;

      await apiUpdateFarmer(farmerId, payload);
      Swal.fire("✅ Updated!", "Farmer information updated successfully.", "success");
      fetchFarmers();
    } catch (error) {
      console.error("❌ Edit error:", error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to update farmer.",
        "error"
      );
    }
  };

  const handleDelete = async (id, farmerUserId) => {
    const isAdmin = user?.role?.toLowerCase() === "admin";
    const isOwner =
      farmerUserId === user?.id ||
      farmerUserId?.id === user?.id ||
      farmerUserId?._id === user?.id;

    if (!isAdmin && !isOwner) {
      Swal.fire("Unauthorized", "You can only delete your own farmers.", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the farmer record.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      await apiDeleteFarmer(id);
      Swal.fire("Deleted!", "Farmer has been deleted.", "success");
      setSelectedFarmer(null);
      fetchFarmers();
    } catch (error) {
      console.error("❌ Delete error:", error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to delete farmer.",
        "error"
      );
    }
  };

  const handleViewFarmer = (farmer) => setSelectedFarmer(farmer);
  const closeModal = () => setSelectedFarmer(null);

  const canEditOrDelete =
    selectedFarmer &&
    (user?.role?.toLowerCase() === "admin" ||
      selectedFarmer.user === user?.id ||
      selectedFarmer.user?.id === user?.id ||
      selectedFarmer.user?._id === user?.id);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-green-700">👨‍🌾 Farmer Dashboard</h1>

      {/* Buttons */}
      <div className="flex gap-4 mb-8">
        <Link
          to={`${basePath}/farmers/create`}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow"
        >
          ➕ Create Farmer
        </Link>

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

     {/* ✅ Inline Farmer Card (after create) */}
{newFarmer && view === "" && (
  <div className="inline-block bg-white p-4 rounded-lg shadow border border-green-200 w-100 auto m-2 align-top">
    <h2 className="text-xl font-bold text-green-700 mb-4">
            🎉 New Farmer Added
          </h2>
    <div className="flex flex-col items-center">
      {/* Avatar */}
      {newFarmer.imageUrl || newFarmer.image ? (
        <img
          src={newFarmer.imageUrl || newFarmer.image}
          alt="Farmer"
          className="w-20 h-20 rounded-full border-2 border-green-500 object-cover mb-3"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-xl border-2 border-green-500 mb-3">
          {newFarmer.firstName?.charAt(0)?.toUpperCase() ||
            newFarmer.lastName?.charAt(0)?.toUpperCase() ||
            "?"}
        </div>
      )}

      {/* Farmer Info */}
      <div className="text-left space-y-1 flex-1">
        <h2 className="text-base-center font-bold text-green-700">
          {newFarmer.firstName} {newFarmer.lastName}
        </h2>
        <p className="text-s text-gray-600">ID: {newFarmer.idNumber || "N/A"}</p>
        <p className="text-s text-gray-600">Gender: {newFarmer.gender || "N/A"}</p>
        <p className="text-s text-gray-600">Phone: {newFarmer.phone || "N/A"}</p>
        <p className="text-s text-gray-600">Email: {newFarmer.email || "N/A"}</p>
        <p className="text-s text-gray-600">Address: {newFarmer.address || "N/A"}</p>
        <p className="text-s text-gray-600">GPS: {newFarmer.gpsAddress || "N/A"}</p>
        <p className="text-s text-gray-600">Farm Size: {newFarmer.farmSize || "N/A"}</p>
        <p className="text-s text-gray-600">Crop: {newFarmer.cropType || "N/A"}</p>
      </div>

      {/* Edit/Delete Buttons */}
      <div className="flex justify-center gap-4 mt-3">
        <button
          onClick={() => handleEdit(newFarmer)}
          className="text-green-600 hover:text-green-800 text-lg"
          title="Edit Farmer"
        >
          ✏️
        </button>
        <button
          onClick={() => handleDelete(newFarmer.id, newFarmer.user)}
          className="text-red-500 hover:text-red-700 text-lg"
          title="Delete Farmer"
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
      {view === "all" ? "All Farmers" : "My Farmers"}
    </h2>

    <div className="flex items-center gap-3">
      {/* Search box */}
      <div className="relative w-40">
        <span className="absolute inset-y-0 left-2 flex items-center text-gray-400">
          🔍
        </span>
        <input
          type="text"
          placeholder="Filter farmers..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* CSV Download */}
      <button
        onClick={() =>
          exportToCSV(
            view === "all" ? filteredFarmers : userFarmers,
            `${view === "all" ? "all_farmers" : "my_farmers"}.csv`
          )
        }
        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow text-sm"
      >
        ⬇️ CSV
      </button>
    </div>
  </div>
)}

      {/* Farmers Table */}
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        {view === "" && <p className="text-gray-600 text-center">Select an action to continue 🌱</p>}

        {view === "all" &&
          (filteredFarmers.length ? (
            <ul className="space-y-2">
              {filteredFarmers.map((f) => (
                <li
                  key={f.id}
                  onClick={() => handleViewFarmer(f)}
                  className="p-3 border border-gray-300 rounded-lg flex items-center gap-3 hover:bg-green-50 cursor-pointer"
                >
                  {f.image ? (
                    <img
                      src={f.image}
                      alt={f.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-300"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-lg border border-green-400">
                      {f.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}

                  <div>
                    <p className="font-medium text-green-700">{f.name}</p>
                    <p className="text-sm text-gray-500">{f.email}</p>
                    <p className="text-sm text-gray-600">{f.address}</p>
                  </div>
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
                  key={f.id}
                  className="p-3 border border-gray-300 rounded-lg flex items-center gap-3 hover:bg-green-50"
                >
                  {f.image ? (
                    <img
                      src={f.image}
                      alt={f.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-300"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-lg border border-green-400">
                      {f.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}

                  <div
                    className="cursor-pointer flex-1"
                    onClick={() => handleViewFarmer(f)}
                  >
                    <p className="font-medium text-green-700">{f.name}</p>
                    <p className="text-sm text-gray-500">{f.email}</p>
                    <p className="text-sm text-gray-600">{f.address}</p>
                  </div>

                  <div className="flex gap-3 ml-4">
                    <button
                      onClick={() => handleEdit(f)}
                      className="text-green-600 hover:text-green-800 text-lg"
                      title="Edit Farmer"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(f.id, f.user)}
                      className="text-red-500 hover:text-red-700 text-lg"
                      title="Delete Farmer"
                    >
                      🗑️
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

      {/* Modal */}
      {selectedFarmer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-3 text-gray-600 hover:text-gray-800 text-xl"
            >
              ✖
            </button>
            <h2 className="text-xl font-semibold text-green-700 mb-4">
              Farmer Details
            </h2>

            <div className="space-y-2 text-gray-700">
              <p><strong>Name:</strong> {selectedFarmer.name}</p>
              <p><strong>ID Number:</strong> {selectedFarmer.idNumber}</p>
              <p><strong>Gender:</strong> {selectedFarmer.gender}</p>
              <p>
                <strong>Email:</strong> {selectedFarmer.email}
              </p>
              <p>
                <strong>Phone:</strong> {selectedFarmer.phone}
              </p>

              <p>
                <strong>Address:</strong> {selectedFarmer.address}
              </p>
              <p>
                <strong>GPS:</strong> {selectedFarmer.gpsAddress}
              </p>
              <p>
                <strong>Crop:</strong> {selectedFarmer.cropType}
              </p>
              <p>
                <strong>Farm Size:</strong> {selectedFarmer.farmSize}
              </p>
            </div>

            {canEditOrDelete && (
              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => handleEdit(selectedFarmer)}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(selectedFarmer.id, selectedFarmer.user)}
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

export default FarmerDashboard;
