import React, { useEffect, useState } from "react";
import api from "../../../api";

const ListPackages = () => {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    api.get("/packages")
      .then((res) => setPackages(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Packages List</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Package Code</th>
            <th className="p-2 border">Batch ID</th>
            <th className="p-2 border">Weight</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((p) => (
            <tr key={p._id}>
              <td className="p-2 border">{p.packageCode}</td>
              <td className="p-2 border">{p.batchId}</td>
              <td className="p-2 border">{p.weight}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListPackages;
