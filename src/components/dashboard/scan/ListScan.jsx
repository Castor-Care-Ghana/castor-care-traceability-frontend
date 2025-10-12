import React, { useEffect, useState } from "react";
import api from "../../../api";

const ListScans = () => {
  const [scans, setScans] = useState([]);

  useEffect(() => {
    api.get("/scans")
      .then((res) => setScans(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Scans List</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Package Code</th>
            <th className="p-2 border">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((s) => (
            <tr key={s._id}>
              <td className="p-2 border">{s.packageCode}</td>
              <td className="p-2 border">{new Date(s.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListScans;
