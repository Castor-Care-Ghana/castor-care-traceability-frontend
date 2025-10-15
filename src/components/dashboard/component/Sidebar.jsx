import React, { useState } from "react";
import {
  Home,
  Users,
  Package,
  QrCode,
  Layers,
  Sprout,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

const Sidebar = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);

  if (loading || !user) return null;

  const role = user?.role?.toLowerCase();

  const sidebarMenus = {
    admin: [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "farmers", label: "Farmers", icon: Sprout },
      { id: "batches", label: "Batches", icon: Layers },
      { id: "packages", label: "Packages", icon: Package },
      { id: "scans", label: "Scans", icon: QrCode },
      { id: "users", label: "Users", icon: Users },
      { id: "settings", label: "Settings", icon: Settings },
    ],
    user: [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "farmers", label: "Farmers", icon: Sprout },
      { id: "batches", label: "Batches", icon: Layers },
      { id: "packages", label: "Packages", icon: Package },
      { id: "scans", label: "Scans", icon: QrCode },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  };

  const menuItems = sidebarMenus[role] || [];

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "user":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, logout",
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/signin";
      }
    });
  };

  return (
    <div
      className={`bg-white shadow-lg flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Toggle Arrow */}
      <div className="flex justify-end p-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-green-50 transition"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-green-600" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-green-600" />
          )}
        </button>
      </div>

      {/* User Info */}
      <div className="p-4">
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
          {/* Avatar always visible */}
          <div className={`w-10 h-10 flex items-center justify-center ${
        collapsed ? "rounded-none bg-none " : "rounded-full bg-green-200"
      }`}>
            <span className="text-green-700 font-bold">
              {user?.name?.[0] || "U"}
            </span>
          </div>
          {/* Name & role only visible when expanded */}
          {!collapsed && (
            <div>
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                  role
                )}`}
              >
                {role}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const targetPath = `/dashboard/${role}${
              item.id !== "dashboard" ? `/${item.id}` : ""
            }`;
            const isActive = location.pathname === targetPath;

            return (
              <li key={item.id}>
                <button
                  onClick={() => navigate(targetPath)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? "bg-green-100 text-green-700 border-l-4 border-green-600"
                      : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
