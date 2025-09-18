import { useEffect, useState } from "react";
import api from "../api";

const BatchList = () => {
  const [batches, setBatches] = useState([]);

  async function loadBatches() {
    const { data } = await api.get("/batches");
    setBatches(data);
  }

  async function deleteBatch(id) {
    await api.delete(`/batches/${id}`);
    loadBatches();
  }

  useEffect(() => {
    loadBatches();
  }, []);

  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-2">Batches</h2>
      <ul className="space-y-2">
        {batches.map((b) => (
          <li key={b.id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
            <span>{b.product_name} ({b.quantity})</span>
            <button
              onClick={() => deleteBatch(b.id)}
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

export default BatchList;
