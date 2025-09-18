import { useState } from "react";
import api from "../api";

const FarmerForm = ({ onSuccess }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    await api.post("/farmers", { name, phone, location });
    setName("");
    setPhone("");
    setLocation("");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-x-2 bg-white p-4 rounded-2xl shadow">
      <input
        type="text"
        placeholder="Farmer Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 w-full rounded"
        required
      />
      <input
        type="text"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="border p-2 w-full rounded"
      />
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="border p-2 w-full rounded"
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">Add Farmer</button>
    </form>
  );
}

export default FarmerForm;
