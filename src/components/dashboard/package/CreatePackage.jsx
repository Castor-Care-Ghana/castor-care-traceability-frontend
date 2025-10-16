// CreatePackage.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "../../../api";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const CreatePackage = () => {
  const [form, setForm] = useState({
    batch: "",
    weight: "",
  });

  const [batches, setBatches] = useState([]);
  const [batchQuery, setBatchQuery] = useState("");
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  // fetch batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get("/batches");
        const batchList = Array.isArray(res.data) ? res.data : res.data?.batches || [];
        setBatches(batchList);
      } catch (err) {
        console.error("Error fetching batches:", err);
        setBatches([]);
      }
    };
    fetchBatches();
  }, []);

  // filter batches
  useEffect(() => {
    if (!batchQuery.trim()) {
      setFilteredBatches([]);
      return;
    }
    const q = batchQuery.toLowerCase();
    const filtered = batches.filter((b) => {
      const batchCode = b.batchCode?.toLowerCase() || "";
      const crop = b.crop?.toLowerCase() || "";
      return batchCode.includes(q) || crop.includes(q);
    });
    setFilteredBatches(filtered);
  }, [batchQuery, batches]);

  // batch selection
  const handleSelectBatch = (batch) => {
    const display = `${batch.batchCode} - ${batch.crop} (${batch.quantity})`;
    setForm((prev) => ({ ...prev, batch: batch._id || batch.id || "" }));
    setBatchQuery(display);
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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.batch || String(form.batch).length !== 24) {
      Swal.fire("❌ Error", "Please select a valid batch from the list", "error");
      return;
    }
    if (!form.weight) {
      Swal.fire("❌ Error", "Please enter package weight", "error");
      return;
    }

    try {
      const payload = {
        batch: form.batch,
        weight: Number(form.weight),
      };

      const res = await api.post("/packages", payload);
      const { package: pkg } = res.data || {};

      Swal.fire({
        title: "✅ Package Created!",
        html: `
          <p><strong>Package Code:</strong> ${pkg?.packageCode || "N/A"}</p>
          <p><strong>Weight:</strong> ${pkg?.weight || "N/A"} kg</p>
        `,
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Print Receipt",
        cancelButtonText: "Close",
      }).then((result) => {
        if (result.isConfirmed) {
          const printWindow = window.open("", "_blank");
          printWindow.document.write(`
            <html><head><title>Package Receipt</title>
            <style>body{font-family: Arial; padding:20px} h2{color:green}</style>
            </head><body>
            <h2>Package Receipt</h2>
            <div><strong>Package Code:</strong> ${pkg?.packageCode || ""}</div>
            <div><strong>Batch:</strong> ${batchQuery}</div>
            <div><strong>Weight:</strong> ${form.weight} kg</div>
            <hr/><p>Thank you for using CastorCare Traceability ✅</p>
            <script>window.print();</script>
            </body></html>
          `);
          printWindow.document.close();
          printWindow.onafterprint = () => {
            navigate("/dashboard");
          };
        } else {
          navigate(`/dashboard/${localStorage.getItem("role") === "admin" ? "admin" : "user"}/packages`);
        }
      });

      // Reset form
      setForm({ batch: "", weight: "" });
      setBatchQuery("");
      setFilteredBatches([]);
      setShowSuggestions(false);
    } catch (err) {
      console.error("Error creating package:", err);
      const msg = err?.response?.data?.message || err.message || "Could not create package";
      Swal.fire("❌ Error", msg, "error");
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto bg-white rounded-2xl shadow-md border border-gray-200">
      <h1 className="text-2xl font-bold mb-6 text-green-700 text-center">Create New Package</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Batch Searchable Input */}
        <div className="relative" ref={suggestionsRef}>
          <label className="block text-gray-700 mb-1 font-medium">Batch</label>
          <input
            type="text"
            value={batchQuery}
            onChange={(e) => {
              setBatchQuery(e.target.value);
              setShowSuggestions(true);
              setForm((prev) => ({ ...prev, batch: "" }));
            }}
            onFocus={() => { if (batchQuery.trim()) setShowSuggestions(true); }}
            placeholder="Type batch code or crop..."
            className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            required
          />

          {showSuggestions && batchQuery.trim() !== "" && (
            <ul className="absolute z-10 bg-white border border-gray-300 w-full max-h-40 overflow-y-auto rounded-lg shadow-md">
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch, idx) => {
                  const stableKey = batch._id || batch.id || `batch-${idx}`;
                  return (
                    <li
                      key={stableKey}
                      onClick={() => handleSelectBatch(batch)}
                      className="p-2 hover:bg-green-100 cursor-pointer border-b border-gray-100"
                    >
                      {batch.batchCode} - {batch.crop} ({batch.quantity})
                    </li>
                  );
                })
              ) : (
                <li className="p-2 text-gray-500 italic">No batches found</li>
              )}
            </ul>
          )}
        </div>

        {/* Weight */}
        <div>
          <label className="block text-gray-700 mb-1 font-medium">Weight (kg)</label>
          <input
            type="number"
            name="weight"
            value={form.weight}
            onChange={handleChange}
            placeholder="Enter package weight"
            className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-3 rounded-lg w-full transition-all duration-200"
        >
          Create Package
        </button>
      </form>
    </div>
  );
};

export default CreatePackage;
