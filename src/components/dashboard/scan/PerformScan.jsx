import React, { useState } from "react";
import api from "../../../api";

const PerformScan = () => {
  const [packageCode, setPackageCode] = useState("");
  const [result, setResult] = useState(null);

  const handleScan = async () => {
    try {
      const res = await api.post("/scans", { packageCode });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Error scanning package");
    }
  };

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-xl font-semibold mb-4">Perform Scan</h1>
      <input
        value={packageCode}
        onChange={(e) => setPackageCode(e.target.value)}
        placeholder="Enter Package Code"
        className="border p-2 w-full mb-3"
      />
      <button onClick={handleScan} className="bg-green-600 text-white px-4 py-2 rounded">Scan</button>

      {result && (
        <div className="mt-4 p-3 border rounded bg-gray-50">
          <h2 className="font-medium">Scan Result:</h2>
          <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default PerformScan;
