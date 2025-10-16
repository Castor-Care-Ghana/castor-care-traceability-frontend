import React, { useEffect, useState } from "react";
import { apiGetPackages } from "../../../services/traceability";
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

const COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#dc2626", "#9333ea"];

const PackageStats = () => {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiGetPackages();
        setPackages(Array.isArray(res.data) ? res.data : res);
      } catch (err) {
        console.error("❌ Error fetching packages:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-10 text-green-700">
        📦 Package Statistics
      </h1>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart */}
        <div className="border rounded-lg p-4 shadow bg-white">
          <h3 className="text-lg font-semibold mb-3 text-green-700">
            Packages by Batch
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                dataKey="value"
                data={Object.values(
                  packages.reduce((acc, pkg) => {
                    const batch = pkg.batch?.batchCode || "Unknown";
                    acc[batch] = acc[batch] || { name: batch, value: 0 };
                    acc[batch].value += 1;
                    return acc;
                  }, {})
                )}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#16a34a"
                label
              >
                {packages.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="border rounded-lg p-4 shadow bg-white">
          <h3 className="text-lg font-semibold mb-3 text-green-700">
            Package Weight by Batch
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={Object.values(
                packages.reduce((acc, pkg) => {
                  const batch = pkg.batch?.batchCode || "Unknown";
                  acc[batch] = acc[batch] || { name: batch, value: 0 };
                  acc[batch].value += pkg.weight || 0;
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
    </div>
  );
};

export default PackageStats;
