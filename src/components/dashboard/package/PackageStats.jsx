// PackageStats.jsx
import React, { useEffect, useState } from "react";
import api from "../../../api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";
import Swal from "sweetalert2";

const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#0088FE", "#AA46BE"];

const PackageStats = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ Fetch packages
  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const res = await api.get("/packages");
        const data = Array.isArray(res.data) ? res.data : res.data?.packages || [];
        setPackages(data);
      } catch (error) {
        console.error("Error fetching packages:", error);
        Swal.fire("❌ Error", "Failed to fetch packages.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  // ✅ Filtered packages
  const filteredPackages = packages.filter((pkg) => {
    const code = pkg.packageCode?.toLowerCase() || "";
    const batch = pkg.batch?.batchCode?.toLowerCase() || "";
    const crop = pkg.batch?.cropType?.toLowerCase() || "";
    return (
      code.includes(searchQuery.toLowerCase()) ||
      batch.includes(searchQuery.toLowerCase()) ||
      crop.includes(searchQuery.toLowerCase())
    );
  });

  // ✅ Aggregate data for charts
  const cropDistribution = Object.values(
    filteredPackages.reduce((acc, pkg) => {
      const crop = pkg.batch?.cropType || "Unknown";
      acc[crop] = acc[crop] || { name: crop, value: 0 };
      acc[crop].value += pkg.weight || 0;
      return acc;
    }, {})
  );

  const packagesOverTime = Object.values(
    filteredPackages.reduce((acc, pkg) => {
      const date = new Date(pkg.createdAt).toLocaleDateString();
      acc[date] = acc[date] || { date, total: 0 };
      acc[date].total += 1;
      return acc;
    }, {})
  ).sort((a, b) => new Date(a.date) - new Date(b.date));

  const userContribution = Object.values(
    filteredPackages.reduce((acc, pkg) => {
      const user = pkg.user?.name || "Unknown User";
      acc[user] = acc[user] || { user, count: 0 };
      acc[user].count += 1;
      return acc;
    }, {})
  );

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-green-700 mb-4">
        📦 Package Statistics Dashboard
      </h2>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by package code, crop, or batch..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-green-600" size={32} />
        </div>
      ) : (
        <>
          {filteredPackages.length === 0 ? (
            <p className="text-gray-500 text-center">No packages found.</p>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                <div className="bg-green-50 border border-green-200 p-5 rounded-xl text-center">
                  <h3 className="text-lg font-semibold text-green-800">Total Packages</h3>
                  <p className="text-2xl font-bold text-green-700 mt-2">
                    {filteredPackages.length}
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-xl text-center">
                  <h3 className="text-lg font-semibold text-yellow-800">Total Weight</h3>
                  <p className="text-2xl font-bold text-yellow-700 mt-2">
                    {filteredPackages.reduce((sum, pkg) => sum + (pkg.weight || 0), 0)} kg
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl text-center">
                  <h3 className="text-lg font-semibold text-blue-800">Unique Crops</h3>
                  <p className="text-2xl font-bold text-blue-700 mt-2">
                    {new Set(filteredPackages.map((pkg) => pkg.batch?.cropType)).size}
                  </p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* PIE CHART: Crop Distribution */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 text-center text-gray-700">
                    Crop Weight Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={cropDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {cropDistribution.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* FLOW CHART (using BarChart instead of LineChart) */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 text-center text-gray-700">
                    User Contribution (Flow View)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={userContribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="user" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#00C49F"
                        animationDuration={1200}
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* LINE CHART: Packages Over Time */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4 text-center text-gray-700">
                    Package Creation Over Time
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={packagesOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#0088FE"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PackageStats;
