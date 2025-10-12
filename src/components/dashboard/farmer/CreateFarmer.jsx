import React, { useState } from "react";
import api from "../../../api";

const CreateFarmer = () => {
  const [form, setForm] = useState({ name: "", location: "", contact: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/farmers", form);
      alert("Farmer created successfully");
      setForm({ name: "", location: "", contact: "" });
    } catch (err) {
      console.error(err);
      alert("Error creating farmer");
    }
  };

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-xl font-semibold mb-4">Create Farmer</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Farmer Name" className="border p-2 w-full" />
        <input name="location" value={form.location} onChange={handleChange} placeholder="Location" className="border p-2 w-full" />
        <input name="contact" value={form.contact} onChange={handleChange} placeholder="Contact" className="border p-2 w-full" />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Create</button>
      </form>
    </div>
  );
};

export default CreateFarmer;
