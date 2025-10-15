import React, { useEffect, useState } from "react";
import {
  Users, Package, Layers, QrCode, User, TrendingUp,
  Activity, Edit3, Mail, Phone, Calendar, X, Search
} from "lucide-react";
import Swal from "sweetalert2";
import { getUserData, updateUserData } from "../../services/auth";
import {
  apiGetUsers,
  apiGetFarmers,
  apiGetBatches,
  apiGetPackages,
  apiGetScans
} from "../../services/traceability";
import { useAuth } from "../../contexts/AuthContext";


const AdminDashboard = () => {
  const { user, hasPermission, refreshUser } = useAuth();
  const [admin, setAdmin] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedTable, setExpandedTable] = useState(null);
  const [filter, setFilter] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    avatar: "",
    password: "",
  });

  const [stats, setStats] = useState([
    { id: "users", label: "Total Users", value: 0, icon: Users, color: "bg-blue-500" },
    { id: "farmers", label: "Farmers", value: 0, icon: User, color: "bg-green-500" },
    { id: "batches", label: "Batches", value: 0, icon: Layers, color: "bg-purple-500" },
    { id: "packages", label: "Packages", value: 0, icon: Package, color: "bg-yellow-500" },
    { id: "scans", label: "Scans", value: 0, icon: QrCode, color: "bg-red-500" },
  ]);

  const [lists, setLists] = useState({
    users: [],
    farmers: [],
    batches: [],
    packages: [],
    scans: [],
  });

  const fetchStats = async () => {
    try {
      const [usersRes, farmersRes, batchesRes, packagesRes, scansRes] = await Promise.all([
        apiGetUsers(),
        apiGetFarmers(),
        apiGetBatches(),
        apiGetPackages(),
        apiGetScans(),
      ]);

       const scans = scansRes?.data || [];

      // Add status to packages based on scans
      const packagesWithStatus = (packagesRes?.data || []).map(pkg => {
        const soldScan = scans.find(scan => scan.package?.id === pkg.id);
        return {
          ...pkg,
          status: soldScan ? "Sold" : "Available"
        };
      });

      setStats((prev) =>
        prev.map((stat) => {
          switch (stat.id) {
            case "users":
              return { ...stat, value: usersRes?.data?.length || 0 };
            case "farmers":
              return { ...stat, value: farmersRes?.data?.length || 0 };
            case "batches":
              return { ...stat, value: batchesRes?.data?.length || 0 };
            case "packages":
              return { ...stat, value: packagesRes?.data?.length || 0 };
            case "scans":
              return { ...stat, value: scansRes?.data?.length || 0 };
            default:
              return stat;
          }
        })
      );

      setLists({
        users: usersRes?.data || [],
        farmers: farmersRes?.data || [],
        batches: batchesRes?.data || [],
        packages: packagesRes?.data || [],
        scans: scansRes?.data || [],
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await getUserData();
        setAdmin(res.data);
      } catch (err) {
        console.error("Error fetching admin data:", err);
      }
    };
    fetchAdmin();
    fetchStats();
  }, []);

  const openEditModal = () => {
    if (!admin) return;
    setFormData({
      name: admin.name || "",
      email: admin.email || "",
      contact: admin.contact || "",
      avatar: admin.avatar || "",
      password: "",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const cleanData = {
      name: formData.name,
      email: formData.email,
      contact: formData.contact,
      avatar: formData.avatar,
    };
    if (formData.password.trim()) cleanData.password = formData.password;

    try {
      const res = await updateUserData(cleanData);
      await refreshUser();
      setAdmin(res.data);
      setShowEditModal(false);
      Swal.fire({ icon: "success", title: "Profile updated", text: "Changes saved successfully." });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: err.response?.data?.message || "Something went wrong.",
      });
    }
  };

  if (!admin) return <div className="p-6 text-center">Loading admin data...</div>;

  // Safe selectedList
  const selectedList = expandedTable && Array.isArray(lists[expandedTable])
    ? lists[expandedTable]
    : [];

  // Flatten object for filtering
  const flattenObject = (obj) => {
    let str = "";
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        str += " " + flattenObject(obj[key]);
      } else {
        str += " " + obj[key];
      }
    }
    return str;
  };

  // Map to selective fields with nested relations
  const displayList = selectedList.map(item => {
    if (expandedTable === "users") {
      return { name: item.name, email: item.email, contact: item.contact, role: item.role, createdAt: item.createdAt};
    }
    if (expandedTable === "farmers") {
      return { firstName: item.firstName, lastName: item.lastName, phone: item.phone, email: item.email };
    }
    if (expandedTable === "batches") {
      return {
        batchCode: item.batchCode,
        farmerName: item.farmer ? item.farmer.firstName + " " + item.farmer.lastName : "—",
        cropType: item.cropType,
        quantity: item.quantity,
      };
    }
    if (expandedTable === "packages") {
      return {
        packageCode: item.packageCode,
        batchCode: item.batch ? item.batch.batchCode : "—",
        QrCode: item.QrCode,
        status: item.status,
      };
    }
    if (expandedTable === "scans") {
      return { packageCode: item.package ? item.package.packageCode : "—", scanBy: item.scanCode, scannedAt: item.scannedAt };
    }
    return item;
  });

  const filteredList = displayList.filter(item =>
    flattenObject(item).toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Top profile header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border-gray-300">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center ring-4 ring-green-100">
              <User className="w-8 h-8 text-green-600" />
            </div>
            <div
              onClick={openEditModal}
              className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-full cursor-pointer hover:bg-green-600"
            >
              <Edit3 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {admin.name}!</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {admin.email}</span>
              <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {admin.contact || "N/A"}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Joined {admin.createdAt?.slice(0, 10)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
          <Activity className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">System Active</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat) => {
          if (stat.permission && !hasPermission(stat.permission)) return null;
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="bg-white rounded-xl shadow-sm border-gray-300 p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+0%</span>
                <span className="text-gray-500 ml-1">from last month</span>
              </div>
              <button
                onClick={() => {
                  setExpandedTable(expandedTable === stat.id ? null : stat.id);
                  setFilter("");
                }}
                className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded transition"
              >
                {expandedTable === stat.id ? "Hide Table" : `View ${stat.label} List`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Expanded Table */}
      {expandedTable && (
        <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6 mt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
            <h2 className="text-lg font-semibold text-gray-800 capitalize">{expandedTable} Table</h2>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={`Filter ${expandedTable}...`}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
          {filteredList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {Object.keys(filteredList[0]).map((key) => (
                      <th key={key} className="text-left px-3 py-2 border-b border-gray-200 capitalize">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {Object.values(item).map((val, i) => (
                        <td key={i} className="px-3 py-2 border-b border-gray-200">{val ? String(val) : "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No data found for this filter.</p>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              {["name", "contact"].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium capitalize">{field}</label>
                  <input
                    type="text"
                    value={formData[field]}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    className="w-full border rounded px-3 py-2 mt-1"
                    required
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium">New Password (optional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border rounded px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Avatar (optional)</label>
                <input
                  type="file"
                  accept="avatar/*"
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.files[0] })}
                  className="w-full border rounded px-3 py-2 mt-1"
                />
              </div>
              <div className="text-right">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
