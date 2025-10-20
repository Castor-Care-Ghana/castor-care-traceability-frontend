// CreatePackage.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "../../../api";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

const CreatePackage = () => {
  const [form, setForm] = useState({
    batch: "",
    weight: "",
  });

  const [batches, setBatches] = useState([]);
  const [batchQuery, setBatchQuery] = useState("");
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [processing, setProcessing] = useState(false);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  // Fetch batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get("/batches");
        const batchList = Array.isArray(res.data)
          ? res.data
          : res.data?.batches || [];
        setBatches(batchList);
      } catch (err) {
        console.error("Error fetching batches:", err);
        setBatches([]);
      }
    };
    fetchBatches();
  }, []);

  // Filter batches by query
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

  // Select batch
  const handleSelectBatch = (batch) => {
    // prevent selecting depleted batch
    if (batch.quantity <= 0) return;
    const display = `${batch.batchCode} - ${batch.crop} (${batch.quantity} kg remaining)`;
    setForm((prev) => ({ ...prev, batch: batch._id || batch.id || "" }));
    setBatchQuery(display);
    setShowSuggestions(false);
  };

  // Hide dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Helper to update batch quantities locally (and filteredBatches)
  const decrementBatchLocal = (batchId, weight) => {
    setBatches((prev) =>
      prev.map((b) =>
        b._id === batchId
          ? { ...b, quantity: Math.max(0, (b.quantity || 0) - Number(weight)) }
          : b
      )
    );
    setFilteredBatches((prev) =>
      prev.map((b) =>
        b._id === batchId
          ? { ...b, quantity: Math.max(0, (b.quantity || 0) - Number(weight)) }
          : b
      )
    );

    // Update batchQuery display if current selection was this batch
    const selectedId = form.batch;
    if (selectedId === batchId) {
      const b = batches.find((x) => x._id === batchId);
      const newQty = Math.max(0, (b?.quantity || 0) - Number(form.weight));
      setBatchQuery(`${b?.batchCode || ""} - ${b?.crop || ""} (${newQty} kg remaining)`);
    }
  };

  // Submit new package
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (processing) return;

    if (!form.batch || String(form.batch).length !== 24) {
      Swal.fire("❌ Error", "Please select a valid batch from the list", "error");
      return;
    }

    if (!form.weight) {
      Swal.fire("❌ Error", "Please enter package weight", "error");
      return;
    }

    const selectedBatch = batches.find((b) => b._id === form.batch);
    if (selectedBatch && Number(form.weight) > (selectedBatch.quantity || 0)) {
      Swal.fire(
        "❌ Error",
        `Batch only has ${selectedBatch.quantity || 0} kg remaining.`,
        "error"
      );
      return;
    }

    try {
      setProcessing(true);

      const payload = {
        batch: form.batch,
        weight: Number(form.weight),
      };

      const res = await api.post("/packages", payload);
      const pkg = res.data?.data || res.data?.package || res.data;

      if (!pkg) throw new Error("No package data returned from backend");

      // update local batch quantity immediately
      decrementBatchLocal(form.batch, Number(form.weight));

      // Prepare QR src (public API)
      const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
        pkg.qrCode
      )}`;

      const createdPackage = pkg;
      // Show Swal with PDF/Print options
      await Swal.fire({
        title: "✅ Package Created!",
        html: `
          <p><strong>Package Code:</strong> ${pkg.packageCode || "N/A"}</p>
          <p><strong>Weight:</strong> ${pkg.weight || "N/A"} kg</p>
          <p><a href="${pkg.qrCode}" target="_blank">🔗 View Tracking Link</a></p>
          <img src="${qrSrc}" alt="QR Code" style="margin-top:10px"/>
        `,
        icon: "success",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "⬇️ PDF",
        denyButtonText: "🖨️ Receipt",
        cancelButtonText: "Close",
      }).then(async (result) => {
        // PDF generation
        if (result.isConfirmed) {
          try {
            Swal.fire({
              title: "Generating PDF...",
              html: "Please wait — preparing your receipt.",
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              },
            });

            // load QR image first
            await new Promise((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => resolve();
              img.onerror = () => reject(new Error("QR failed to load"));
              img.src = qrSrc;
            });

            // Build PDF
            const doc = new jsPDF();
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.text("CastorCare Traceability Receipt", 20, 20);
            doc.setFontSize(12);
            doc.setTextColor(60);

            doc.text(`Package Code: ${pkg.packageCode || "N/A"}`, 20, 40);
            doc.text(`Weight: ${pkg.weight || "N/A"} kg`, 20, 48);
            doc.text(`Batch: ${batchQuery || "N/A"}`, 20, 56);

            if (pkg.batch?.farmer) {
              doc.text(`Farmer: ${pkg.batch.farmer.name || "N/A"}`, 20, 64);
              doc.text(
                `Farmer Location: ${pkg.batch.farmer.collectionLocation || "N/A"}`,
                20,
                72
              );
            }

            if (pkg.batch) {
              doc.text(`Crop: ${pkg.batch.crop || "N/A"}`, 20, 80);
              doc.text(
                `Batch Location: ${pkg.batch.collectionLocation || "N/A"}`,
                20,
                88
              );
            }

            doc.text(`Created by: ${pkg.user?.name || "N/A"}`, 20, 96);

            // Add QR image into PDF
            const qrImg = new Image();
            qrImg.crossOrigin = "anonymous";
            qrImg.src = qrSrc;
            await new Promise((resolve, reject) => {
              qrImg.onload = () => resolve();
              qrImg.onerror = () => reject(new Error("QR failed to load"));
            });
            doc.addImage(qrImg, "PNG", 140, 40, 50, 50);

            doc.save(`Package_${pkg.packageCode}.pdf`);
            Swal.close();
          } catch (pdfErr) {
            console.error("PDF generation failed:", pdfErr);
            Swal.close();
            Swal.fire("❌ Error", "Failed to generate PDF. Try printing instead.", "error");
          } finally {
            setProcessing(false);
          }
        }

        // Print
        else if (result.isDenied) {
          try {
            const win = window.open("", "_blank");
            win.document.write(`
              <html>
                <head>
                  <title>Package Receipt</title>
                  <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h2 { color: green; }
                    .section { margin-bottom: 10px; }
                  </style>
                </head>
                <body>
                  <h2>CastorCare Traceability Package Receipt</h2>
                  <div class="section"><strong>Package Code:</strong> ${pkg.packageCode || ""}</div>
                  <div class="section"><strong>Batch:</strong> ${batchQuery || "N/A"}</div>
                  <div class="section"><strong>Weight:</strong> ${pkg.weight || "N/A"} kg</div>
                  <div class="section"><strong>Created by:</strong> ${pkg.user?.name || "N/A"}</div>
                  <div class="section">
                    <strong>QR Code:</strong><br/>
                    <img id="qrImage" src="${qrSrc}" width="150" height="150" />
                  </div>
                  <hr/>
                  <p>Thank you for using CastorCare Traceability ✅</p>
                  <script>
                    (function waitAndPrint(){
                      const img = document.getElementById('qrImage');
                      if(!img) { window.print(); return; }
                      if(img.complete) {
                        setTimeout(()=>{ window.print(); }, 250);
                      } else {
                        img.onload = ()=> setTimeout(()=>{ window.print(); },250);
                        img.onerror = ()=> setTimeout(()=>{ window.print(); },250);
                      }
                    })();
                  </script>
                </body>
              </html>
            `);
            win.document.close();

            // try to close and navigate after print (best-effort)
            win.onafterprint = () => {
              try { win.close(); } catch (e) {}
              navigate("/dashboard/" + (localStorage.getItem("role") === "admin" ? "admin" : "user") + "/packages", {state: { newPackage: pkg }});
            };
          } catch (printErr) {
            console.error("Print failed:", printErr);
            Swal.fire("❌ Error", "Failed to open print window.", "error");
          } finally {
            setProcessing(false);
          }
        }

        // Cancel/Close
        else {
          setProcessing(false);
          navigate(
            `/dashboard/${localStorage.getItem("role") === "admin" ? "admin" : "user"}/packages`,
            {state: { newPackage: createdPackage }}
          );
        }
      });

      // Reset form
      setForm({ batch: "", weight: "" });
      setBatchQuery("");
      setFilteredBatches([]);
      setShowSuggestions(false);
    } catch (err) {
      console.error("Error creating package:", err);
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Could not create package";
      Swal.fire("❌ Error", msg, "error");
      setProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto bg-white rounded-2xl shadow-md border border-gray-200">
      <h1 className="text-2xl font-bold mb-6 text-green-700 text-center">
        Create New Package
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Batch Input */}
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
            onFocus={() => {
              if (batchQuery.trim()) setShowSuggestions(true);
            }}
            placeholder="Type batch code or crop..."
            className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            required
            disabled={processing}
          />

          {showSuggestions && batchQuery.trim() !== "" && (
            <ul className="absolute z-10 bg-white border border-gray-300 w-full max-h-40 overflow-y-auto rounded-lg shadow-md">
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch, idx) => {
                  const stableKey = batch._id || batch.id || `batch-${idx}`;
                  const isDepleted = (batch.quantity || 0) <= 0;
                  return (
                    <li
                      key={stableKey}
                      onClick={() => !isDepleted && handleSelectBatch(batch)}
                      className={`p-2 border-b border-gray-100 ${
                        isDepleted
                          ? "text-gray-400 cursor-not-allowed bg-gray-50"
                          : "hover:bg-green-100 cursor-pointer"
                      }`}
                    >
                      {batch.batchCode} - {batch.crop} ({batch.quantity || 0} kg left)
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
          <label className="block text-gray-700 mb-1 font-medium">
            Weight (kg)
          </label>
          <input
            type="number"
            name="weight"
            value={form.weight}
            onChange={handleChange}
            placeholder="Enter package weight"
            className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            required
            disabled={processing}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/dashboard/${localStorage.getItem("role") === "admin" ? "admin" : "user"}/packages`
              )
            }
            className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ${
              processing ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={processing}
          >
            {processing ? "Processing..." : "Create Package"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePackage;
