import React, { useState, useEffect } from "react";
import api from "../../../api";

const CreateBatch = () => {
  const [form, setForm] = useState({
    farmer: "",
    cropType: "",
    quantity: "",
    collectionLocation: "",
  });

  const [farmerQuery, setFarmerQuery] = useState("");
  const [filteredFarmers, setFilteredFarmers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [gpsAddress, setGpsAddress] = useState("");
  const [ghanaPostCode, setGhanaPostCode] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);

  // 🔹 Fetch filtered farmers dynamically as user types
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (farmerQuery.trim().length < 2) {
        setFilteredFarmers([]);
        return;
      }
      try {
        const res = await api.get(`/farmers?name=${farmerQuery}`);
        setFilteredFarmers(res.data);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Error fetching filtered farmers:", err);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [farmerQuery]);

  // 🔹 Generate GhanaPost-style code (mock version)
  const generateGhanaPostCode = (lat, lon) => {
    if (!lat || !lon) return "";
    const areaPrefix = "GA";
    const part1 = Math.abs(Math.floor((lat * 1000) % 900))
      .toString()
      .padStart(3, "0");
    const part2 = Math.abs(Math.floor((lon * 1000) % 900))
      .toString()
      .padStart(3, "0");
    return `${areaPrefix}-${part1}-${part2}`;
  };

  // 🔹 Get GPS + reverse geocode
  const getDeviceLocation = () => {
    setLoadingLocation(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude);
        setLongitude(longitude);

        try {
          const res = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${
              import.meta.env.VITE_OPENCAGE_API_KEY
            }`
          );
          const data = await res.json();
          const address =
            data.results?.[0]?.formatted || "Unable to retrieve address";

          setGpsAddress(address);
          setGhanaPostCode(generateGhanaPostCode(latitude, longitude));
        } catch (err) {
          console.error("Error fetching address:", err);
          setGpsAddress("Unknown location");
        }
        setLoadingLocation(false);
      },
      (error) => {
        alert("Unable to retrieve your location: " + error.message);
        setLoadingLocation(false);
      }
    );
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSelectFarmer = (farmer) => {
    setForm({ ...form, farmer: farmer._id });
    setFarmerQuery(farmer.name);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        latitude,
        longitude,
        gpsAddress,
        batchCode: ghanaPostCode,
      };
      await api.post("/batches", payload);
      alert("✅ Batch created successfully!");

      setForm({ farmer: "", cropType: "", quantity: "", collectionLocation: "" });
      setFarmerQuery("");
      setLatitude(null);
      setLongitude(null);
      setGpsAddress("");
      setGhanaPostCode("");
    } catch (err) {
      console.error(err);
      alert("❌ Error creating batch");
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto bg-white rounded-2xl shadow-md border border-gray-200">
      <h1 className="text-2xl font-bold mb-6 text-green-700 text-center">
        Create New Batch
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 🔹 Farmer Searchable Input */}
        <div className="relative">
          <label className="block text-gray-700 mb-1 font-medium">
            Farmer
          </label>
          <input
            type="text"
            value={farmerQuery}
            onChange={(e) => setFarmerQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Type farmer name..."
            className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            required
          />
          {showSuggestions && filteredFarmers.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-300 w-full max-h-40 overflow-y-auto rounded-lg shadow-md">
              {filteredFarmers.map((farmer) => (
                <li
                  key={farmer._id}
                  onClick={() => handleSelectFarmer(farmer)}
                  className="p-2 hover:bg-green-100 cursor-pointer border-b border-gray-100"
                >
                  {farmer.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 🔹 Crop Type */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium">
            Crop Type
          </label>
          <input
            name="cropType"
            value={form.cropType}
            onChange={handleChange}
            placeholder="e.g., Maize"
            className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            required
          />
        </div>

        {/* 🔹 Quantity */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium">
            Quantity
          </label>
          <input
            type="number"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            placeholder="Enter quantity"
            className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            required
          />
        </div>

        {/* 🔹 Collection Location */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium">
            Collection Location
          </label>
          <input
            name="collectionLocation"
            value={form.collectionLocation}
            onChange={handleChange}
            placeholder="e.g., Tamale Warehouse"
            className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            required
          />
        </div>

        {/* 🔹 GPS Section */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={getDeviceLocation}
            disabled={loadingLocation}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-3 rounded-lg w-full transition-all duration-200"
          >
            {loadingLocation ? "Fetching GPS..." : "📍 Get Current Location"}
          </button>

          {latitude && longitude && (
            <div className="text-sm text-gray-700 mt-3 border border-gray-300 p-3 rounded-lg bg-gray-50 space-y-1">
              <p>
                <strong>Latitude:</strong> {latitude}
              </p>
              <p>
                <strong>Longitude:</strong> {longitude}
              </p>
              <p>
                <strong>GPS Address (GhanaPost):</strong> {ghanaPostCode}
              </p>
              <p>
                <strong>Full Address:</strong> {gpsAddress}
              </p>
            </div>
          )}
        </div>

        {/* 🔹 Submit */}
        <button
          type="submit"
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-3 rounded-lg w-full transition-all duration-200"
        >
          Create Batch
        </button>
      </form>
    </div>
  );
};

export default CreateBatch;
