import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../../contexts/AuthContext";
import {
  apiGetPackages,
  apiGetScans,
  apiCreateScan,
} from "../../../services/traceability";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

const PerformScan = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ✅ Local State
  const [packages, setPackages] = useState([]);
  const [packageCode, setPackageCode] = useState("");
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [packageInfo, setPackageInfo] = useState(null);
  const [packageStatus, setPackageStatus] = useState("");
  const [location, setLocation] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFirstScan, setIsFirstScan] = useState(false);
  const [packageFound, setPackageFound] = useState(false);

  // ✅ Newly added to handle redirect update properly
  const [newScan, setNewScan] = useState(null);

  // Show proper user display
  const scannedBy = user
    ? `${user.name || user.displayName || user.email || "User"} (${
        user.role || "User"
      })`
    : "Anonymous";

  const basePath = `/dashboard/${user?.role?.toLowerCase() || "user"}/scans`;

  // 📦 Fetch all packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await apiGetPackages();
        const data = Array.isArray(res?.data) ? res.data : res || [];
        setPackages(data);
      } catch (error) {
        console.error("❌ Failed to fetch packages:", error);
        Swal.fire("Error", "Could not load packages.", "error");
      }
    };
    fetchPackages();
  }, []);

  // 📷 Barcode handler
  const handleScan = (err, result) => {
    if (result) {
      const scannedCode = result.text.trim();
      setPackageCode(scannedCode);
      setCameraActive(false);
      Swal.fire("📦 Code Scanned!", `Package Code: ${scannedCode}`, "success");
    }
  };

  // 🔍 Package lookup (type or scan)
  useEffect(() => {
    const checkPackage = async () => {
      if (!packageCode.trim()) {
        setFilteredPackages([]);
        setPackageInfo(null);
        setPackageFound(false);
        setPackageStatus("");
        return;
      }

      // Filter dropdown by packageCode
      const filtered = packages.filter((pkg) =>
        pkg.packageCode?.toLowerCase().includes(packageCode.toLowerCase())
      );
      setFilteredPackages(filtered.slice(0, 6));

      // Find exact match
      const matchedPackage = packages.find(
        (pkg) =>
          pkg.packageCode?.toLowerCase() === packageCode.toLowerCase()
      );

      if (!matchedPackage) {
        setPackageFound(false);
        setPackageInfo(null);
        setPackageStatus("");
        return;
      }

      setPackageFound(true);
      setPackageInfo(matchedPackage);
      setFilteredPackages([]);

      try {
        const scansRes = await apiGetScans();
        const scans = Array.isArray(scansRes?.data)
          ? scansRes.data
          : scansRes || [];

        const hasScans = scans.some(
          (s) =>
            s.package === matchedPackage.id ||
            s.package?._id === matchedPackage.id
        );

        setIsFirstScan(!hasScans);
        setPackageStatus(hasScans ? matchedPackage.status || "available" : "");
      } catch (error) {
        console.error("❌ Error checking scans:", error);
        setIsFirstScan(false);
      }
    };

    const timeout = setTimeout(checkPackage, 300);
    return () => clearTimeout(timeout);
  }, [packageCode, packages]);

  // ✅ Select from dropdown
  const handleSelectSuggestion = (pkg) => {
    setPackageCode(pkg.packageCode);
    setPackageInfo(pkg);
    setPackageFound(true);
    setFilteredPackages([]);
  };

  // 💾 Submit scan
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!packageInfo || !packageFound) {
      Swal.fire("Package Not Found", "Please select or scan a valid package.", "warning");
      return;
    }

    if (isFirstScan && !packageStatus) {
      Swal.fire("Status Needed", "Please select package status.", "info");
      return;
    }

    if (!location.trim()) {
      Swal.fire("Missing Info", "Please enter your location.", "info");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        package: packageInfo.id, // ✅ backend expects this id
        scannedBy,
        location,
        ...(isFirstScan && { status: packageStatus }),
      };

      await apiCreateScan(payload);

      // ✅ Save scan to local state before redirect
      const createdScan = {
        ...payload,
        packageName: packageInfo.packageCode,
        createdAt: new Date(),
      };

      setNewScan(createdScan);

      Swal.fire("✅ Success", "Scan recorded successfully!", "success");

      // ✅ Redirect after state update
      setTimeout(() => {
        navigate(basePath, { state: { newScan: createdScan } });
      }, 200);
    } catch (error) {
      console.error("❌ Save failed:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Failed to record scan.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-2xl shadow-md border border-green-200 relative">
      <h1 className="text-2xl font-bold text-center text-green-700 mb-6">
        📲 Perform Package Scan
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Package Code Input */}
        <div className="relative">
          <label className="block mb-2 text-gray-700 font-medium">
            Package Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Scan or type package code"
              value={packageCode}
              onChange={(e) => setPackageCode(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <button
              type="button"
              onClick={() => setCameraActive((prev) => !prev)}
              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              {cameraActive ? "Close" : "📷 Scan"}
            </button>
          </div>

          {/* Dropdown Suggestions */}
          {filteredPackages.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-300 rounded-lg mt-1 w-full max-h-48 overflow-y-auto shadow-lg">
              {filteredPackages.map((pkg) => (
                <li
                  key={pkg.id}
                  onClick={() => handleSelectSuggestion(pkg)}
                  className="px-4 py-2 hover:bg-green-100 cursor-pointer text-sm"
                >
                  <div className="font-medium">{pkg.packageCode}</div>
                  <div className="text-xs text-gray-500">
                    Crop: {pkg.batch?.cropType || "N/A"}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Not Found */}
          {!packageFound && packageCode && filteredPackages.length === 0 && (
            <p className="text-red-600 text-sm mt-1">❌ Package not found.</p>
          )}
        </div>

        {/* Camera */}
        {cameraActive && (
          <div className="mt-3 border border-gray-300 rounded-lg overflow-hidden">
            <BarcodeScannerComponent
              width="100%"
              height={260}
              onUpdate={handleScan}
              facingMode="environment"
            />
          </div>
        )}

        {/* Package Status */}
        {packageFound && (
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Package Status
            </label>
            {isFirstScan ? (
              <select
                value={packageStatus}
                onChange={(e) => setPackageStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="">-- Select Status --</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="in-transit">In-transit</option>
                <option value="delivered">Delivered</option>
                <option value="returned">Returned</option>
              </select>
            ) : (
              <div className="text-sm px-3 py-1 bg-gray-100 rounded-full inline-block">
                Status: {packageStatus || "Unknown"}
              </div>
            )}
          </div>
        )}

        {/* Scanned By */}
        <div>
          <label className="block mb-2 text-gray-700 font-medium">
            Scanned By
          </label>
          <input
            type="text"
            value={scannedBy}
            readOnly
            className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block mb-2 text-gray-700 font-medium">
            Location
          </label>
          <input
            type="text"
            placeholder="e.g. address or gps"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
        >
          {loading ? "Saving..." : "✅ Save Scan"}
        </button>

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(basePath)}
          className="w-full mt-3 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
        >
          ← Back to Dashboard
        </button>
      </form>

      {/* Package Info */}
      {packageInfo && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-700 mb-2">
            Package Details
          </h3>
          <p>
            <strong>Package Code:</strong> {packageInfo.packageCode}
          </p>
          <p>
            <strong>Crop:</strong> {packageInfo.batch?.cropType}
          </p>
          <p>
            <strong>Weight:</strong> {packageInfo.weight} kg
          </p>
          <p>
            <strong>Created:</strong>{" "}
            {new Date(packageInfo.createdAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default PerformScan;
