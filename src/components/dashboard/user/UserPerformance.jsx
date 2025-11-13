// src/components/dashboard/UserPerformance.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  apiGetUsers,
  apiGetFarmers,
  apiGetBatches,
  apiGetPackages,
  apiGetScans,
} from "../../../services/traceability";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";
import Swal from "sweetalert2";

const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#0088FE", "#AA46BE"];

// Helpers
const toDateKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
};
const toMonthKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};
const toYearKey = (d) => new Date(d).getFullYear().toString();

const aggregateByUser = (items = [], userField = "createdBy", dateField = "createdAt") => {
  const result = {};
  for (const it of items) {
    const userId = it?.[userField]
      ? typeof it[userField] === "object"
        ? it[userField]._id || it[userField].id
        : it[userField]
      : "unknown";
    const dateVal = it?.[dateField] ? new Date(it[dateField]) : new Date();
    if (!result[userId]) result[userId] = { daily: {}, monthly: {}, yearly: {}, total: 0 };

    const dKey = toDateKey(dateVal);
    const mKey = toMonthKey(dateVal);
    const yKey = toYearKey(dateVal);

    result[userId].daily[dKey] = (result[userId].daily[dKey] || 0) + 1;
    result[userId].monthly[mKey] = (result[userId].monthly[mKey] || 0) + 1;
    result[userId].yearly[yKey] = (result[userId].yearly[yKey] || 0) + 1;
    result[userId].total += 1;
  }
  return result;
};

const getCount = (aggByUser, userId, periodType, key) => {
  if (!aggByUser || !aggByUser[userId]) return 0;
  if (periodType === "daily") return aggByUser[userId].daily[key] || 0;
  if (periodType === "monthly") return aggByUser[userId].monthly[key] || 0;
  if (periodType === "yearly") return aggByUser[userId].yearly[key] || 0;
  return aggByUser[userId].total || 0;
};

const UserPerformance = () => {
  const [users, setUsers] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [packagesData, setPackagesData] = useState([]);
  const [scansData, setScansData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [timeframe, setTimeframe] = useState("total");
  const [selectedDateKey, setSelectedDateKey] = useState(() => {
    const now = new Date();
    return { daily: toDateKey(now), monthly: toMonthKey(now), yearly: toYearKey(now) };
  });
  const [showStats, setShowStats] = useState(false);

  // NEW: pagination state for chart (show 5 users per page)
  const [chartPage, setChartPage] = useState(0);
  const usersPerPage = 5;

  // Fetch data
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [uRes, fRes, bRes, pRes, sRes] = await Promise.all([
          apiGetUsers(),
          apiGetFarmers(),
          apiGetBatches(),
          apiGetPackages(),
          apiGetScans(),
        ]);
        if (!mounted) return;

        const uData = Array.isArray(uRes?.data) ? uRes.data : uRes || [];
        const fData = Array.isArray(fRes?.data) ? fRes.data : fRes || [];
        const bData = Array.isArray(bRes?.data) ? bRes.data : bRes || [];
        const pData = Array.isArray(pRes?.data) ? pRes.data : pRes || [];
        const sData = Array.isArray(sRes?.data) ? sRes.data : sRes || [];

        // Normalize IDs
        const normalizeUsers = uData.map((u) => ({ ...u, _id: u._id || u.id }));
        const normalizeFarmers = fData.map((f) => ({
          ...f,
          createdBy: f.createdBy?._id || f.createdBy || "unknown",
        }));
        const normalizeBatches = bData.map((b) => ({
          ...b,
          createdBy: b.createdBy?._id || b.createdBy || "unknown",
        }));
        const normalizePackages = pData.map((p) => ({
          ...p,
          createdBy: p.createdBy?._id || p.createdBy || "unknown",
        }));
        const normalizeScans = sData.map((s) => ({
          ...s,
          createdBy: s.createdBy?._id || s.createdBy || "unknown",
        }));
        setUsers(normalizeUsers);
        setFarmers(normalizeFarmers);
        setBatches(normalizeBatches);
        setPackagesData(normalizePackages);
        setScansData(normalizeScans);
      } catch (err) {
        console.error(err);
        setError("Failed to load performance data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const farmersAgg = useMemo(() => aggregateByUser(farmers), [farmers]);
  const batchesAgg = useMemo(() => aggregateByUser(batches), [batches]);
  const packagesAgg = useMemo(() => aggregateByUser(packagesData), [packagesData]);
  const scansAgg = useMemo(() => aggregateByUser(scansData), [scansData]);

  const filteredUsers = useMemo(() => {
    if (!query) return users;
    const q = query.toLowerCase();
    return users.filter(
      (u) => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
    );
  }, [users, query]);

  const timeframeKey =
    timeframe === "daily"
      ? selectedDateKey.daily
      : timeframe === "monthly"
      ? selectedDateKey.monthly
      : timeframe === "yearly"
      ? selectedDateKey.yearly
      : "total";

  const exportCSV = () => {
    const rows = [["User ID", "Name", "Email", "Farmers", "Batches", "Packages", "Scans", "Timeframe", "PeriodKey"]];
    filteredUsers.forEach((u) => {
      const uid = u._id || u.id;
      const name = `"${(u.name || "").replace(/"/g, '""')}"`;
      const email = `"${(u.email || "").replace(/"/g, '""')}"`;
      const f = timeframe === "total" ? farmersAgg[uid]?.total || 0 : getCount(farmersAgg, uid, timeframe, timeframeKey);
      const b = timeframe === "total" ? batchesAgg[uid]?.total || 0 : getCount(batchesAgg, uid, timeframe, timeframeKey);
      const p = timeframe === "total" ? packagesAgg[uid]?.total || 0 : getCount(packagesAgg, uid, timeframe, timeframeKey);
        const s = timeframe === "total" ? scansAgg[uid]?.total || 0 : getCount(scansAgg, uid, timeframe, timeframeKey);
      rows.push([uid, name, email, f, b, p, s, timeframe, timeframeKey].join(","));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user_performance_${timeframe}_${timeframeKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-green-600" size={32}/></div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  const userContribution = filteredUsers.map((u) => {
    const uid = u._id || u.id;
    return { user: u.name, count: packagesAgg[uid]?.total || 0 };
  });

  // NEW: prepare paginated chart data (5 users per page) with three series
  const totalChartPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  // clamp chartPage
  const safeChartPage = Math.min(Math.max(0, chartPage), Math.max(0, totalChartPages - 1));

  const paginatedUsers = filteredUsers.slice(safeChartPage * usersPerPage, safeChartPage * usersPerPage + usersPerPage);

  const chartData = paginatedUsers.map((u) => {
    const uid = u._id || u.id;
    return {
      user: u.name || "Unknown",
      batches: timeframe === "total" ? (batchesAgg[uid]?.total || 0) : getCount(batchesAgg, uid, timeframe, timeframeKey),
      farmers: timeframe === "total" ? (farmersAgg[uid]?.total || 0) : getCount(farmersAgg, uid, timeframe, timeframeKey),
      packages: timeframe === "total" ? (packagesAgg[uid]?.total || 0) : getCount(packagesAgg, uid, timeframe, timeframeKey),
      scans: timeframe === "total" ? (scansAgg[uid]?.total || 0) : getCount(scansAgg, uid, timeframe, timeframeKey),
    };
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-green-700">User Performance</h1>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={() => setShowStats((s) => !s)}
            className="px-3 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
          >
            {showStats ? "Hide Stats" : "Show Stats"}
          </button>
          <button
            onClick={exportCSV}
            className="px-3 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter/Search & Timeframe */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
  <input
    type="text"
    placeholder="Search users..."
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    className="px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:ring-2 focus:ring-green-400 focus:border-transparent focus:outline-none"
  />
  <select
    value={timeframe}
    onChange={(e) => setTimeframe(e.target.value)}
    className="px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:ring-2 focus:ring-green-400 focus:border-transparent focus:outline-none"
  >
    <option value="total">Total</option>
    <option value="daily">Daily</option>
    <option value="monthly">Monthly</option>
    <option value="yearly">Yearly</option>
  </select>

  {timeframe !== "total" && (
    <div className="flex gap-2 items-center">
      {timeframe === "daily" && (
        <input
          type="date"
          value={selectedDateKey.daily}
          onChange={(e) =>
            setSelectedDateKey((s) => ({ ...s, daily: e.target.value }))
          }
          className="px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:ring-2 focus:ring-green-400 focus:border-transparent focus:outline-none"
        />
      )}
      {timeframe === "monthly" && (
        <input
          type="month"
          value={selectedDateKey.monthly}
          onChange={(e) =>
            setSelectedDateKey((s) => ({ ...s, monthly: e.target.value }))
          }
          className="px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:ring-2 focus:ring-green-400 focus:border-transparent focus:outline-none"
        />
      )}
      {timeframe === "yearly" && (
        <input
          type="number"
          min="2000"
          max="2100"
          value={selectedDateKey.yearly}
          onChange={(e) =>
            setSelectedDateKey((s) => ({ ...s, yearly: e.target.value }))
          }
          className="px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:ring-2 focus:ring-green-400 focus:border-transparent focus:outline-none w-24"
        />
      )}
    </div>
  )}
    </div>


      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg shadow text-center">
          <div className="text-sm text-gray-500">Farmers</div>
          <div className="text-2xl font-semibold text-green-700">
            {filteredUsers.reduce(
              (acc, u) => acc + (timeframe === "total" ? farmersAgg[u._id]?.total || 0 : getCount(farmersAgg, u._id, timeframe, timeframeKey)),
              0
            )}
          </div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow text-center">
          <div className="text-sm text-gray-500">Batches</div>
          <div className="text-2xl font-semibold text-green-700">
            {filteredUsers.reduce(
              (acc, u) => acc + (timeframe === "total" ? batchesAgg[u._id]?.total || 0 : getCount(batchesAgg, u._id, timeframe, timeframeKey)),
              0
            )}
          </div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow text-center">
          <div className="text-sm text-gray-500">Packages</div>
          <div className="text-2xl font-semibold text-green-700">
            {filteredUsers.reduce(
              (acc, u) => acc + (timeframe === "total" ? packagesAgg[u._id]?.total || 0 : getCount(packagesAgg, u._id, timeframe, timeframeKey)),
              0
            )}
          </div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow text-center">
          <div className="text-sm text-gray-500">Scans</div>
          <div className="text-2xl font-semibold text-green-700">
            {filteredUsers.reduce(
              (acc, u) => acc + (timeframe === "total" ? scansAgg[u._id]?.total || 0 : getCount(scansAgg, u._id, timeframe, timeframeKey)),
              0
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {showStats && (
        <div className=" mb-6 bg-white p-6 rounded-lg shadow">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-center text-gray-700">User Contribution</h3>

            {/* REPLACED: show paginated grouped bar chart for 5 users at a time */}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="user" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                {/* order matches legend colors you had earlier */}
                <Bar dataKey="batches" fill="#FFBB28" barSize={20} />
                <Bar dataKey="farmers" fill="#00C49F" barSize={20} />
                <Bar dataKey="packages" fill="#0088FE" barSize={20} />
                <Bar dataKey="scans" fill="#AA46BE" barSize={20} />
              </BarChart>
            </ResponsiveContainer>

            {/* Pagination dots */}
            {totalChartPages > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                {Array.from({ length: totalChartPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setChartPage(i)}
                    className={`w-3 h-3 rounded-full ${i === safeChartPage ? "bg-green-600" : "bg-gray-300"} hover:bg-green-400 transition`}
                    aria-label={`Go to chart page ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Table / Cards */}
      <div className="space-y-4">
        {/* Cards for mobile */}
        <div className="grid grid-cols-1 md:hidden gap-3">
          {filteredUsers.map((u) => {
            const uid = u._id || u.id;
            const fcount = timeframe === "total" ? farmersAgg[uid]?.total || 0 : getCount(farmersAgg, uid, timeframe, timeframeKey);
            const bcount = timeframe === "total" ? batchesAgg[uid]?.total || 0 : getCount(batchesAgg, uid, timeframe, timeframeKey);
            const pcount = timeframe === "total" ? packagesAgg[uid]?.total || 0 : getCount(packagesAgg, uid, timeframe, timeframeKey);
            const scount = timeframe === "total" ? scansAgg[uid]?.total || 0 : getCount(scansAgg, uid, timeframe, timeframeKey);
            return (
              <div key={uid} className="p-4 bg-white rounded-lg shadow flex items-center justify-between">
                <div>
                  <div className="font-medium text-green-700">{u.name}</div>
                  <div className="text-sm text-gray-500">{u.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">F / B / P / S</div>
                  <div className="font-semibold">{fcount} / {bcount} / {pcount} / {scount}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Table for md+ */}
        <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Farmers</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Batches</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Packages</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Scans</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredUsers.map((u) => {
                const uid = u._id || u.id;
                const fcount = timeframe === "total" ? farmersAgg[uid]?.total || 0 : getCount(farmersAgg, uid, timeframe, timeframeKey);
                const bcount = timeframe === "total" ? batchesAgg[uid]?.total || 0 : getCount(batchesAgg, uid, timeframe, timeframeKey);
                const pcount = timeframe === "total" ? packagesAgg[uid]?.total || 0 : getCount(packagesAgg, uid, timeframe, timeframeKey);
                const scount = timeframe === "total" ? scansAgg[uid]?.total || 0 : getCount(scansAgg, uid, timeframe, timeframeKey);
                return (
                  <tr key={uid} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-green-700 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-center">{fcount}</td>
                    <td className="px-4 py-3 text-center">{bcount}</td>
                    <td className="px-4 py-3 text-center">{pcount}</td>
                    <td className="px-4 py-3 text-center">{scount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserPerformance;
