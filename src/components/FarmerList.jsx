import { useEffect, useState } from "react";
import api from "../api";

const FarmerList = () => {
  const [farmers, setFarmers] = useState([]);

  async function loadFarmers() {
    const { data } = await api.get("/farmers");
    setFarmers(data);
  }

  async function deleteFarmer(id) {
    await api.delete(`/farmers/${id}`);
    loadFarmers();
  }

  useEffect(() => {
    loadFarmers();
  }, []);

  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-2">Farmers</h2>
      <ul className="space-y-2">
        {farmers.map((f) => (
          <li key={f.id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
            <span>{f.name} ({f.phone})</span>
            <button
              onClick={() => deleteFarmer(f.id)}
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

export default FarmerList;