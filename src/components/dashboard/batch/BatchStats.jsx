import React, { useEffect, useState } from "react";
import { apiGetBatches } from "../../../services/traceability";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#dc2626", "#9333ea"];

const BatchStats = () => {
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiGetBatches();
        setBatches(Array.isArray(res.data) ? res.data : res);
      } catch (err) {
        console.error("❌ Error fetching batches:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-10 text-blue-700">
        📊 Batch Statistics
      </h1>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart */}
        <div className="border rounded-lg p-4 shadow bg-white">
          <h3 className="text-lg font-semibold mb-3 text-green-700">
            Crop Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                dataKey="value"
                data={Object.values(
                  batches.reduce((acc, b) => {
                    const crop = b.crop || b.cropType || "Unknown";
                    acc[crop] = acc[crop] || { name: crop, value: 0 };
                    acc[crop].value += 1;
                    return acc;
                  }, {})
                )}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#16a34a"
                label
              >
                {batches.map((b) => (
                  <Cell
                    key={b._id}
                    fill={COLORS[Math.floor(Math.random() * COLORS.length)]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="border rounded-lg p-4 shadow bg-white">
          <h3 className="text-lg font-semibold mb-3 text-green-700">
            Quantity by Crop
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={Object.values(
                batches.reduce((acc, b) => {
                  const crop = b.crop || b.cropType || "Unknown";
                  acc[crop] = acc[crop] || { name: crop, value: 0 };
                  acc[crop].value += b.quantity || 0;
                  return acc;
                }, {})
              )}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Map */}
      <div className="border rounded-lg p-4 shadow bg-white">
        <h3 className="text-lg font-semibold mb-3 text-green-700">
          Batch Collection Map
        </h3>
        <MapContainer
          center={[7.9465, -1.0232]}
          zoom={7}
          style={{ height: "400px", width: "100%", borderRadius: "0.5rem" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          {batches.map(
            (b) =>
              b.latitude &&
              b.longitude && (
                <Marker key={b._id} position={[b.latitude, b.longitude]}>
                  <Popup>
                    <strong>{b.crop || b.cropType}</strong> <br />
                    Code: {b.batchCode} <br />
                    {b.quantity} kg <br />
                    {b.collectionLocation}
                  </Popup>
                </Marker>
              )
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default BatchStats;
