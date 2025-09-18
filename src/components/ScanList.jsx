import { useEffect, useState } from "react";
import api from "../api";

const ScanList = () => {
  const [scans, setScans] = useState([]);

  async function loadScans() {
    const { data } = await api.get("/scans");
    setScans(data);
  }

  async function deleteScan(id) {
    await api.delete(`/scans/${id}`);
    loadScans();
  }

  useEffect(() => {
    loadScans();
  }, []);

  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-2">Scans</h2>
      <ul className="space-y-2">
        {scans.map((s) => (
          <li key={s.id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
            <span>{s.batch_id} – {s.role} – {s.scanned_at}</span>
            <button
              onClick={() => deleteScan(s.id)}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ScanList;