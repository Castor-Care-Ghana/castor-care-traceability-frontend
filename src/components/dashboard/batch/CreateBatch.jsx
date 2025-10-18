// CreateBatch.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "../../../api";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

const CreateBatch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const newBatch = navigate.location?.state?.newBatch || null;
  
  const [form, setForm] = useState({
    farmer: "",
    crop: "",
    quantity: "",
    collectionLocation: "",
  });

  const [farmers, setFarmers] = useState([]);
  const [farmerQuery, setFarmerQuery] = useState("");
  const [filteredFarmers, setFilteredFarmers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [gpsAddress, setGpsAddress] = useState("");
  const [ghanaPostCode, setGhanaPostCode] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);

  const suggestionsRef = useRef(null);

  // fetch farmers
  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const res = await api.get("/farmers");
        const farmerList = Array.isArray(res.data) ? res.data : res.data?.farmers || [];
        setFarmers(farmerList);
      } catch (err) {
        console.error("Error fetching farmers:", err);
        setFarmers([]);
      }
    };
    fetchFarmers();
  }, []);

  // helper: phone field variations
  const getPhone = (f) => f?.phone || f?.phoneNumber || f?.phone_number || "";

  // filter farmers only when user types (empty input => no suggestions)
  useEffect(() => {
    if (!farmerQuery.trim()) {
      setFilteredFarmers([]);
      return;
    }
    const q = farmerQuery.toLowerCase();
    const filtered = farmers.filter((f) => {
      const name = `${f.firstName || ""} ${f.lastName || ""}`.trim().toLowerCase();
      const phone = String(getPhone(f) || "").toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
    setFilteredFarmers(filtered);
  }, [farmerQuery, farmers]);

  // GhanaPost-like mock code (display only fallback)
  const generateGhanaPostCode = (lat, lon) => {
    if (!lat || !lon) return "";
    const areaPrefix = "GA";
    const part1 = Math.abs(Math.floor((lat * 1000) % 900)).toString().padStart(3, "0");
    const part2 = Math.abs(Math.floor((lon * 1000) % 900)).toString().padStart(3, "0");
    return `${areaPrefix}-${part1}-${part2}`;
  };

  // Reverse-geocode using LocationIQ, fallback to Nominatim
  const reverseGeocode = async (lat, lon) => {
    const token = import.meta.env.VITE_LOCATIONIQ_KEY;
    try {
      if (token) {
        // LocationIQ reverse endpoint
        // You may need to change domain (us1 / eu1) depending on your LocationIQ account; us1 works for most.
        const url = `https://us1.locationiq.com/v1/reverse.php?key=${encodeURIComponent(
          token
        )}&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=json`;
        const resp = await fetch(url);
        if (resp.ok) {
          const data = await resp.json();
          if (data?.display_name) return data.display_name;
        } else {
          console.warn("LocationIQ response not ok", resp.status);
        }
      }

      // fallback: Nominatim (OpenStreetMap)
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lon)}`;
      const nomResp = await fetch(nomUrl, {
        headers: { "Accept-Language": "en" },
      });
      if (nomResp.ok) {
        const nomData = await nomResp.json();
        if (nomData?.display_name) return nomData.display_name;
        if (nomData?.address) return Object.values(nomData.address).join(", ");
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
    }
    return null;
  };

  // fallback to IP-based geolocation if device geolocation fails
  const ipFallback = async () => {
    try {
      // ipapi.co is a simple free endpoint (subject to rate limits). Replace if you prefer another service.
      const resp = await fetch("https://ipapi.co/json/");
      if (!resp.ok) throw new Error("IP geolocation failed");
      const data = await resp.json();
      if (data) {
        const lat = data.latitude || data.lat;
        const lon = data.longitude || data.lon;
        setLatitude(lat ?? null);
        setLongitude(lon ?? null);
        // try reverse geocode the IP-derived coordinates (best-effort)
        if (lat && lon) {
          const addr = await reverseGeocode(lat, lon);
          setGpsAddress(addr || "Location from IP (approximate)");
          setGhanaPostCode(generateGhanaPostCode(lat, lon));
        } else {
          setGpsAddress("Unable to determine location from IP");
        }
      }
    } catch (err) {
      console.warn("IP fallback failed:", err);
      setGpsAddress("Unable to retrieve full address");
    } finally {
      setLoadingLocation(false);
    }
  };

  // get device location with watchPosition (collect best reading by accuracy)
  const getDeviceLocation = () => {
    setLoadingLocation(true);
    setGpsAddress("");
    setGhanaPostCode("");

    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      setLoadingLocation(false);
      return;
    }

    let best = null;
    let watchId = null;
    const desiredAccuracyMeters = 30; // stop early if we get this accuracy
    const maxWaitMs = 15000; // max time to wait for better accuracy

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    };

    const finalize = async (pos) => {
      cleanup();
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setLatitude(lat);
      setLongitude(lon);

      // reverse geocode using LocationIQ (or fallback)
      const fullAddr = await reverseGeocode(lat, lon);
      setGpsAddress(fullAddr || "Full address unavailable");
      setGhanaPostCode(generateGhanaPostCode(lat, lon));
      setLoadingLocation(false);
    };

    // start a timeout to stop waiting
    const timeoutId = setTimeout(async () => {
      if (best) {
        await finalize(best);
      } else {
        // no position received — try IP fallback
        cleanup();
        await ipFallback();
      }
    }, maxWaitMs);

    // watchPosition to collect samples
    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          // save best sample by accuracy
          if (!best || (pos.coords && pos.coords.accuracy < best.coords.accuracy)) {
            best = pos;
          }

          // if the sample is already good enough, stop and use it
          if (pos.coords && pos.coords.accuracy && pos.coords.accuracy <= desiredAccuracyMeters) {
            clearTimeout(timeoutId);
            finalize(pos);
          }
        },
        async (err) => {
          console.warn("watchPosition error:", err);
          clearTimeout(timeoutId);
          cleanup();
          // fallback to IP-based geolocation
          await ipFallback();
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: maxWaitMs }
      );
    } catch (err) {
      console.warn("Geolocation watch failed:", err);
      clearTimeout(timeoutId);
      cleanup();
      ipFallback();
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // farmer selection
  const handleSelectFarmer = (farmer) => {
    const display = `${farmer.firstName || ""} ${farmer.lastName || ""}`.trim() + " - " + (getPhone(farmer) || "No Phone");
    setForm((prev) => ({ ...prev, farmer: farmer._id || farmer.id || "" }));
    setFarmerQuery(display);
    setShowSuggestions(false);
  };

  // hide suggestions when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!suggestionsRef.current) return;
      if (!suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // try auto-matching typed farmer to actual registered farmer if not clicked
    let selectedFarmerId = form.farmer;
    if (!selectedFarmerId && farmerQuery.trim()) {
      const q = farmerQuery.trim().toLowerCase();
      const match = farmers.find((f) => {
        const name = `${f.firstName || ""} ${f.lastName || ""}`.trim().toLowerCase();
        const phone = (getPhone(f) || "").toLowerCase();
        const combined = `${name} - ${phone}`.toLowerCase();
        return q === name || q === combined || q === phone;
      });
      if (match) {
        selectedFarmerId = match._id || match.id;
        setForm((prev) => ({ ...prev, farmer: selectedFarmerId }));
      }
    }

    if (!selectedFarmerId || String(selectedFarmerId).length !== 24) {
      Swal.fire("❌ Error", "Please select a valid farmer from the list", "error");
      return;
    }

    if (!form.crop?.trim() || !form.quantity || !form.collectionLocation?.trim()) {
      Swal.fire("❌ Error", "Please fill crop, quantity and collection location", "error");
      return;
    }

    try {
      const payload = {
        farmer: selectedFarmerId,
        crop: form.crop,
        quantity: Number(form.quantity),
        collectionLocation: form.collectionLocation,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      };

      const res = await api.post("/batches", payload);
      const { batch } = res.data || {};

      // build redirect path and include created batch in state
      const role = user?.role || localStorage.getItem("role");
      const redirectPath = `/dashboard/${role === "admin" ? "admin" : "user"}/batches`;

      // show SweetAlert with batchCode and generated GPS (from backend), allow print
      Swal.fire({
        title: "✅ Batch Created!",
        html: `
          <p><strong>Batch Code:</strong> ${batch?.batchCode || "N/A"}</p>
          <p><strong>GPS Address (generated):</strong> ${batch?.gpsAddress || "N/A"}</p>
        `,
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Print Receipt",
        cancelButtonText: "Close",
      }).then((result) => {
        if (result.isConfirmed) {
          const printWindow = window.open("", "_blank");
          printWindow.document.write(`
            <html><head><title>Batch Receipt</title>
            <style>body{font-family: Arial; padding:20px} h2{color:green}</style>
            </head><body>
            <h2>Batch Receipt</h2>
            <div><strong>Batch Code:</strong> ${batch?.batchCode || ""}</div>
            <div><strong>Farmer:</strong> ${farmerQuery}</div>
            <div><strong>Crop:</strong> ${form.crop}</div>
            <div><strong>Quantity:</strong> ${form.quantity}</div>
            <div><strong>Collection Location:</strong> ${form.collectionLocation}</div>
            <div><strong>Latitude:</strong> ${latitude ?? "N/A"}</div>
            <div><strong>Longitude:</strong> ${longitude ?? "N/A"}</div>
            <div><strong>Full Address (client):</strong> ${gpsAddress || "N/A"}</div>
            <div><strong>GPS Address (server):</strong> ${batch?.gpsAddress || "N/A"}</div>
            <hr/><p>Thank you for using CastorCare Traceability ✅</p>
            <script>window.print();</script>
            </body></html>
          `);
          printWindow.document.close();

          // redirect main app to batches with state after print (and attempt to close print window)
          printWindow.onafterprint = () => {
            try {
              printWindow.close();
            } catch (e) {}
            navigate(redirectPath, { state: { newBatch: batch } });
          };

          // As a safety fallback (some browsers may not fire onafterprint), also redirect after a short delay
          setTimeout(() => {
            navigate(redirectPath, { state: { newBatch: batch } });
          }, 1000);
        } else {
          // redirect on cancel, include created batch in state
          navigate(redirectPath, { state: { newBatch: batch } });
        }
      });

      // Reset form & UI
      setForm({ farmer: "", crop: "", quantity: "", collectionLocation: "" });
      setFarmerQuery("");
      setLatitude(null);
      setLongitude(null);
      setGpsAddress("");
      setGhanaPostCode("");
      setFilteredFarmers([]);
      setShowSuggestions(false);
    } catch (err) {
      console.error("Error creating batch:", err);
      const msg = err?.response?.data?.message || err?.response?.data || err.message || "Could not create batch";
      Swal.fire("❌ Error", msg, "error");
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto bg-white rounded-2xl shadow-md border border-gray-200">
      <h1 className="text-2xl font-bold mb-6 text-green-700 text-center">Create New Batch</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Farmer searchable input */}
        <div className="relative" ref={suggestionsRef}>
          <label className="block text-gray-700 mb-1 font-medium">Farmer</label>
          <input
            type="text"
            value={farmerQuery}
            onChange={(e) => {
              setFarmerQuery(e.target.value);
              setShowSuggestions(true);
              setForm((prev) => ({ ...prev, farmer: "" })); // clear selected id while typing
            }}
            onFocus={() => { if (farmerQuery.trim()) setShowSuggestions(true); }}
            placeholder="Type farmer name or phone..."
            className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            required
          />

          {showSuggestions && farmerQuery.trim() !== "" && (
            <ul className="absolute z-10 bg-white border border-gray-300 w-full max-h-40 overflow-y-auto rounded-lg shadow-md">
              {filteredFarmers.length > 0 ? (
                filteredFarmers.map((farmer, idx) => {
                  const stableKey =
                    farmer._id || farmer.id || `${(farmer.firstName || "")}-${(farmer.lastName || "")}-${getPhone(farmer)}-${idx}`;
                  return (
                    <li
                      key={stableKey}
                      onClick={() => handleSelectFarmer(farmer)}
                      className="p-2 hover:bg-green-100 cursor-pointer border-b border-gray-100"
                    >
                      {farmer.firstName} {farmer.lastName} - {getPhone(farmer) || "No Phone"}
                    </li>
                  );
                })
              ) : (
                <li className="p-2 text-gray-500 italic">No farmers found</li>
              )}
            </ul>
          )}
        </div>

        {/* Crop */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium">Crop</label>
          <input
            name="crop"
            value={form.crop}
            onChange={handleChange}
            placeholder="e.g., Maize"
            className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            required
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium">Quantity</label>
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

        {/* Collection Location */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium">Collection Location</label>
          <input
            name="collectionLocation"
            value={form.collectionLocation}
            onChange={handleChange}
            placeholder="e.g., Tamale Warehouse"
            className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            required
          />
        </div>

        {/* GPS Section */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={getDeviceLocation}
            disabled={loadingLocation}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-3 rounded-lg w-full transition-all duration-200 flex items-center justify-center"
          >
            {loadingLocation ? "Fetching GPS..." : "📍 Get Current Location"}
          </button>

          {latitude && longitude && (
            <div className="text-sm text-gray-700 mt-3 border border-gray-300 p-3 rounded-lg bg-gray-50 space-y-1">
              <p><strong>Latitude:</strong> {latitude}</p>
              <p><strong>Longitude:</strong> {longitude}</p>
              <p><strong>Full Address (client):</strong></p>
              <input
                type="text"
                value={gpsAddress}
                disabled
                className="bg-gray-100 border-none w-full text-gray-600 p-1 rounded"
              />
              <p><strong>GPS Address (mock):</strong> {ghanaPostCode || "N/A"}</p>
            </div>
          )}
        </div>

        {/* Submit */}
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
