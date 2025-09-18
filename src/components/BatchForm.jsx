import { useState } from "react";
import api from "../api";

const BatchForm = ({ onSuccess }) => {
  const [farmer_id, setFarmerId] = useState("");
  const [product_name, setProductName] = useState("");
  const [harvest_date, setHarvestDate] = useState("");
  const [quantity, setQuantity] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    await api.post("/batches", { farmer_id, product_name, harvest_date, quantity });
    setFarmerId("");
    setProductName("");
    setHarvestDate("");
    setQuantity("");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 bg-white p-4 rounded-2xl shadow">
      <input
        type="text"
        placeholder="Farmer ID"
        value={farmer_id}
        onChange={(e) => setFarmerId(e.target.value)}
        className="border p-2 w-full rounded"
        required
      />
      <input
        type="text"
        placeholder="Product Name"
        value={product_name}
        onChange={(e) => setProductName(e.target.value)}
        className="border p-2 w-full rounded"
        required
      />
      <input
        type="date"
        value={harvest_date}
        onChange={(e) => setHarvestDate(e.target.value)}
        className="border p-2 w-full rounded"
      />
      <input
        type="text"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="border p-2 w-full rounded"
      />
      <button className="bg-green-600 text-white px-4 py-2 rounded w-full">Add Batch</button>
    </form>
  );
}

export default BatchForm;