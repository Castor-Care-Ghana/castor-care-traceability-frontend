import React, { useEffect, useState } from "react";
import api from "../../../api";

const ListFarmers = () => {
  const [farmers, setFarmers] = useState([]);

  useEffect(() => {
    api.get("/farmers")
      .then((res) => setFarmers(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Farmers List</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Location</th>
            <th className="p-2 border">Contact</th>
          </tr>
        </thead>
        <tbody>
          {farmers.map((f) => (
            <tr key={f._id}>
              <td className="p-2 border">{f.name}</td>
              <td className="p-2 border">{f.location}</td>
              <td className="p-2 border">{f.contact}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListFarmers;
