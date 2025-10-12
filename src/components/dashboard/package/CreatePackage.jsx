import React, { useState } from "react";
import api from "../../../api";

const CreatePackage = () => {
  const [form, setForm] = useState({ packageCode: "", batchId: "", weight: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/packages", form);
      alert("Package created successfully");
      setForm({ packageCode: "", batchId: "", weight: "" });
    } catch (err) {
      console.error(err);
      alert("Error creating package");
    }
  };

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-xl font-semibold mb-4">Create Package</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="packageCode" value={form.packageCode} onChange={handleChange} placeholder="Package Code" className="border p-2 w-full" />
        <input name="batchId" value={form.batchId} onChange={handleChange} placeholder="Batch ID" className="border p-2 w-full" />
        <input name="weight" value={form.weight} onChange={handleChange} placeholder="Weight (kg)" className="border p-2 w-full" />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Create</button>
      </form>
    </div>
  );
};

export default CreatePackage;
