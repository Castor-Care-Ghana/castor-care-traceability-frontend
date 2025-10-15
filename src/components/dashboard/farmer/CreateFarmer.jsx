import React, { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const CreateFarmer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    idNumber: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    gpsAddress: "",
    farmSize: "",
    cropType: "",
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files[0];
      setFormData({ ...formData, [name]: file });
      setImagePreview(file ? URL.createObjectURL(file) : null);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();

    payload.append("firstName", formData.firstName);
    payload.append("lastName", formData.lastName);
    payload.append("idNumber", formData.idNumber);
    payload.append("gender", formData.gender);
    payload.append("address", formData.address);
    payload.append("farmSize", formData.farmSize);
    payload.append("cropType", formData.cropType);

    if (formData.phone) payload.append("phone", formData.phone);
    if (formData.email) payload.append("email", formData.email);
    if (formData.gpsAddress) payload.append("gpsAddress", formData.gpsAddress);
    if (formData.image) payload.append("image", formData.image);

    try {
  const res = await fetch(`${import.meta.env.VITE_BASE_URL}/farmers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ FIXED
    },
    body: payload,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Failed to create farmer");
  }

  const result = await res.json();
  const createdFarmer = result.farmer; // ✅ unwrap farmer

  Swal.fire("Success!", "Farmer created successfully 🌱", "success");

  if (user?.role === "admin") {
    navigate("/dashboard/admin/farmers", { state: { newFarmer: createdFarmer } });
  } else {
    navigate("/dashboard/user/farmers", { state: { newFarmer: createdFarmer } });
  }
} catch (error) {
  console.error("Error creating farmer:", error);
  Swal.fire("Error", error.message || "Failed to create farmer", "error");
}
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-lg shadow"
        encType="multipart/form-data"
      >
        {/* Title */}
        <h1 className="text-2xl font-bold mb-4 text-green-700 text-center">
          ➕ Create Farmer
        </h1>

        {/* First & Last Name */}
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />

        {/* ID Number */}
        <input
          type="text"
          name="idNumber"
          placeholder="ID (eg GHA-000000000-0)"
          value={formData.idNumber}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />

        {/* Gender */}
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="" className="text-gray-500">
            Select Gender
          </option>
          <option value="male" className="text-black">
            Male
          </option>
          <option value="female" className="text-black">
            Female
          </option>
          <option value="other" className="text-black">
            Other
          </option>
        </select>

        {/* Phone & Email */}
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        />

        {/* Address & GPS */}
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          name="gpsAddress"
          placeholder="GPS (eg GA-000-0000)"
          value={formData.gpsAddress}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        />

        {/* Farm size & Crop type */}
        <input
          type="text"
          name="farmSize"
          placeholder="Farm Size"
          value={formData.farmSize}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          name="cropType"
          placeholder="Crop Type"
          value={formData.cropType}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />

        {/* File Upload */}
        <input
          type="file"
          name="image"
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        />

        {/* Preview */}
        {imagePreview && (
          <div className="mt-4 flex justify-center">
            <img
              src={imagePreview}
              alt="Selected"
              className="w-32 h-32 object-cover rounded-full border-2 border-green-500 shadow"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() =>
              user?.role === "admin"
                ? navigate("/dashboard/admin/farmers") // ✅ fixed
                : navigate("/dashboard/user/farmers") // ✅ fixed
            }
            className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create Farmer
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFarmer;
