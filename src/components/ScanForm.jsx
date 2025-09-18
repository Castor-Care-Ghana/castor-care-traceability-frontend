import { useState } from "react";
import api from "../api";

const ScanForm = ({ onSuccess }) => {
  const [batch_id, setBatchId] = useState("");
  const [role, setRole] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    await api.post("/scans", { batch_id, role });
    setBatchId("");
    setRole("");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 bg-white p-4 rounded-2xl shadow">
      <input
        type="text"
        placeholder="Batch ID"
        value={batch_id}
        onChange={(e) => setBatchId(e.target.value)}
        className="border p-2 w-full rounded"
        required
      />
      <input
        type="text"
        placeholder="Role (Farmer, Distributor, Consumer)"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="border p-2 w-full rounded"
        required
      />
      <button className="bg-purple-600 text-white px-4 py-2 rounded w-full">Add Scan</button>
    </form>
  );
}

export default ScanForm;