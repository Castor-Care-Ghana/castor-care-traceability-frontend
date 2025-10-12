import React, { useEffect, useState } from "react";
import api from "../../../api";

const ListBatches = () => {
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    api.get("/batches")
      .then((res) => setBatches(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Batches List</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Batch Number</th>
            <th className="p-2 border">Farmer ID</th>
            <th className="p-2 border">Description</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((b) => (
            <tr key={b._id}>
              <td className="p-2 border">{b.batchNumber}</td>
              <td className="p-2 border">{b.farmerId}</td>
              <td className="p-2 border">{b.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListBatches;
