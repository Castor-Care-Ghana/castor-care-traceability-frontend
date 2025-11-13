import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useLocation, Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  apiGetUsers,
  apiUpdateUser,
  apiDeleteUser,
  apiRemoveUser,
  apiRestoreUser,
} from "../../../services/traceability";

const Dashboard = () => {
  const { user, token } = useAuth();
  const location = useLocation();

  const [inlineUser, setInlineUser] = useState(() => {
    const stored = localStorage.getItem("inlineUser");
    const newUser = location.state?.newUser || (stored ? JSON.parse(stored) : null);
  if (newUser && !("avatar" in newUser)) newUser.avatar = "";
    return location.state?.newUser || (stored ? JSON.parse(stored) : null);
  });

 useEffect(() => {
  if (location.state?.newUser) {
    const user = { ...location.state.newUser, avatar: location.state.newUser.avatar || "" };
    localStorage.setItem("inlineUser", JSON.stringify(user));
    window.history.replaceState({}, document.title);
    setInlineUser(user); // ensure state matches normalized value
  }
}, [location.state]);

  useEffect(() => {
    if (!location.state?.newUser) {
      const stored = localStorage.getItem("inlineUser");
      if (stored) {
        localStorage.removeItem("inlineUser");
        setInlineUser(null);
      }
    }
  }, []);

  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const basePath = `/dashboard/${user?.role?.toLowerCase()}`;
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const getId = (obj) =>
    typeof obj === "string" ? obj : obj?.id ?? obj?._id ?? null;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiGetUsers(token, { includeDeleted: true });
      const arr = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      const normalized = arr.map((u) => ({ ...u, id: u.id ?? u._id }));
      setUsers(normalized);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(filter.toLowerCase()) ||
      u.email?.toLowerCase().includes(filter.toLowerCase()) ||
      u.role?.toLowerCase().includes(filter.toLowerCase())
  );
const handleEdit = async (userData) => {
  const userId = userData?.id || userData?._id;
  if (!userId) return Swal.fire("Error", "User ID not found.", "error");

  const safe = (v) => (v === undefined || v === null ? "" : String(v).replace(/"/g, "&quot;"));

  let avatarUrl =
  userData.avatar && userData.avatar.trim() !== ""
    ? userData.avatar
    : "";



  const { value: formValues } = await Swal.fire({
    title: "Edit User",
    width: 600,
    html: `
      <div class="flex flex-col gap-3 text-left">
        <label class="text-sm text-gray-600">Name</label>
        <input id="swal-name" type="text" value="${safe(userData.name)}" class="w-full border border-gray-300 rounded-lg px-3 py-2" />

        <label class="text-sm text-gray-600">Email</label>
        <input id="swal-email" type="email" value="${safe(userData.email)}" class="w-full border border-gray-300 rounded-lg px-3 py-2" />

        ${
          isAdmin
            ? `<label class="text-sm text-gray-600">Role</label>
               <select id="swal-role" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                 <option value="user" ${userData.role === "user" ? "selected" : ""}>User</option>
                 <option value="admin" ${userData.role === "admin" ? "selected" : ""}>Admin</option>
               </select>`
            : ""
        }

        <label class="text-sm text-gray-600">Contact</label>
        <input id="swal-contact" type="text" value="${safe(userData.contact)}" class="w-full border border-gray-300 rounded-lg px-3 py-2" />

        <label class="text-sm text-gray-600">Avatar</label>
        <input id="swal-avatar" type="file" accept="image/*" class="w-full border border-gray-300 rounded-lg px-3 py-2" />

        ${
          avatarUrl
            ? `<div id="avatar-container" class="relative mt-2 w-20 h-20">
                 <img id="swal-avatar-preview" src="${avatarUrl}" alt="avatar" class="w-20 h-20 rounded-full border border-green-400 object-cover cursor-pointer" />
                 <span id="remove-avatar-btn" class="absolute top-0 right-0 text-red-500 font-bold cursor-pointer">-</span>
               </div>`
            : ""
        }
        <small class="text-gray-500">Leave empty to keep existing avatar</small>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Save Changes",
    confirmButtonColor: "#166534",
    didOpen: () => {
      const removeBtn = document.getElementById("remove-avatar-btn");
      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          const container = document.getElementById("avatar-container");
          if (container) container.remove();
          avatarUrl = null;
        });
      }

      const preview = document.getElementById("swal-avatar-preview");
      if (preview) {
        preview.addEventListener("click", () => {
          if (avatarUrl) {
            Swal.fire({
              imageUrl: avatarUrl,
              imageAlt: "Avatar",
              showConfirmButton: false,
            });
          }
        });
      }
    },
    preConfirm: () => {
      const nameVal = document.getElementById("swal-name").value.trim();
      const emailVal = document.getElementById("swal-email").value.trim();
      const roleVal = isAdmin ? document.getElementById("swal-role").value.trim() : undefined;
      const contactVal = document.getElementById("swal-contact").value.trim();
      const avatarFile = document.getElementById("swal-avatar").files[0];

      if (!nameVal || !emailVal) {
        Swal.showValidationMessage("Name and Email are required.");
        return false;
      }

      // ✅ If user removed avatar AND did not upload a new file
      if (!avatarFile && avatarUrl === null) {
        return { name: nameVal, email: emailVal, role: roleVal, contact: contactVal, avatar: "" };
      }

      return { name: nameVal, email: emailVal, role: roleVal, contact: contactVal, avatar: avatarFile || null };
    },
  });

  if (!formValues) return;

  try {
    const form = new FormData();
      Object.entries(formValues).forEach(([key, val]) => {
    if (key === "avatar") {
      if (val === "") form.append("avatar", "");   // ✅ explicit removal
      else if (val) form.append("avatar", val);    // upload file
    } else {
      form.append(key, val);
    }
  });


    const endpoint = !isAdmin || getId(userData) === getId(user) ? "me" : userId;

    // Send to backend and get updated user (including avatar URL)
    const updatedUser = await apiUpdateUser(endpoint, form, token);

    Swal.fire("✅ Updated!", "User updated successfully.", "success");

    const newAvatar = updatedUser.avatar || avatarUrl;

    // Update inline state
    if (inlineUser && getId(inlineUser) === getId(userData)) {
      const updatedInline = { ...inlineUser, ...formValues, avatar: newAvatar };
      setInlineUser(updatedInline);
      localStorage.setItem("inlineUser", JSON.stringify(updatedInline));
    }

    // Update selected user modal
    if (selectedUser && getId(selectedUser) === getId(userData)) {
      setSelectedUser((prev) => ({ ...prev, ...formValues, avatar: newAvatar }));
    }

    // Update main users list
    setUsers((prev) =>
      prev.map((u) => (getId(u) === getId(userData) ? { ...u, ...formValues, avatar: newAvatar } : u))
    );

  } catch (err) {
    console.error("❌ Edit error:", err);
    Swal.fire("Error", err.response?.data?.message || "Failed to update user.", "error");
  }
};


const handleDelete = async (id) => {
  if (!isAdmin && getId(user) !== id) {
    Swal.fire("Unauthorized", "You can only delete your own profile.", "warning");
    return;
  }

  const confirm = await Swal.fire({
    title: "Delete user?",
    text: "This will disable the user but keep their record in the system.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, disable",
  });

  if (!confirm.isConfirmed) return;

  try {
    // Soft delete on backend
    await apiDeleteUser(id, token); // backend sets deleted=true

    // Update user in state (badge shows deleted)
    setUsers((prev) =>
      prev.map((u) => (getId(u) === id ? { ...u, deleted: true } : u))
    );

    // Update modal/inline cards if affected
    if (selectedUser && getId(selectedUser) === id)
      setSelectedUser((prev) => ({ ...prev, deleted: true }));
    if (inlineUser && getId(inlineUser) === id)
      setInlineUser((prev) => ({ ...prev, deleted: true }));

    Swal.fire("Disabled!", "User has been disabled.", "success");
  } catch (err) {
    console.error("❌ Delete error:", err);
    Swal.fire("Error", err.response?.data?.message || "Failed to disable user.", "error");
  }
};

// Permanent remove user from backend and list
const handleRemove = async (id) => {
  if (!isAdmin) {
    Swal.fire("Unauthorized", "Only admins can permanently remove users.", "warning");
    return;
  }

  const confirm = await Swal.fire({
    title: "Permanently remove user?",
    text: "This will delete the user completely from the system. This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, remove permanently",
  });

  if (!confirm.isConfirmed) return;

  // Close modals if affected user is open
  if (selectedUser && getId(selectedUser) === id) setSelectedUser(null);
  if (inlineUser && getId(inlineUser) === id) {
    setInlineUser(null);
    localStorage.removeItem("inlineUser");
  }

  try {
    // Permanent remove from backend
    await apiRemoveUser(id, token); // backend removes document completely

    // Remove from frontend list
    setUsers((prev) => prev.filter((u) => getId(u) !== id));

    Swal.fire("Removed!", "User permanently removed.", "success");
  } catch (err) {
    console.error("❌ Remove error:", err);
    Swal.fire("Error", err.response?.data?.message || "Failed to remove user.", "error");
  }
};

const handleRestore = async (id) => {
  if (!isAdmin) {
    Swal.fire("Unauthorized", "Only admins can restore users.", "warning");
    return;
  }

  try {
    // ✅ Restore backend deleted = false
    await apiRestoreUser(id, token);

    // Update state for both modal and inline card
    setUsers((prev) =>
      prev.map((u) => (getId(u) === id ? { ...u, deleted: false } : u))
    );

    if (selectedUser && getId(selectedUser) === id) setSelectedUser(null);
    if (inlineUser && getId(inlineUser) === id) {
      setInlineUser((prev) => ({ ...prev, deleted: false }));
    }

    Swal.fire("Restored!", "User restored successfully.", "success");
  } catch (err) {
    console.error("❌ Restore error:", err);
    Swal.fire("Error", err.response?.data?.message || "Failed to restore user.", "error");
  }
};
  const exportToCSV = (data, filename) => {
    const csvRows = [];
    const headers = ["ID", "Name", "Email", "Role", "Contact", "Deleted"];
    csvRows.push(headers.join(","));
    data.forEach((user) => {
      const { id, name, email, role, contact, deleted } = user;
      const row = [id, name, email, role, contact, deleted ? "Yes" : "No"];
      csvRows.push(row.join(","));
    });
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };    
  if (loading) return <p className="p-6 text-center">Loading users...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-green-700">👥 User Dashboard</h1>

      <div className="flex justify-end mb-4">
        <Link
          to={`${basePath}/users/performance`}
          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow text-sm"
        >
          📊 Performance
        </Link>
      </div>

      <div className="flex gap-4 mb-8">
        <Link
          to={`${basePath}/users/create`}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow"
        >
          ➕ Create User
        </Link>

        <button
          onClick={() => {
            setInlineUser(null);
            localStorage.removeItem("inlineUser");
          }}
          className="px-4 py-2 rounded-lg border border-gray-400 bg-green-200 text-green-900 hover:bg-green-500 hover:text-white shadow"
        >
          📋 All Users
        </button>
      </div>

      {/* ✅ Inline New User Card */}
      {inlineUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full relative">
            <button
              onClick={() => {
                setInlineUser(null);
                localStorage.removeItem("inlineUser");
                window.location.href = `${basePath}/users`;
              }}
              className="absolute top-2 right-3 text-gray-600 hover:text-gray-800 text-xl"
            >
              ✖
            </button>
            <h2 className="text-xl font-semibold text-green-700 mb-4">🎉 New User Added</h2>

            {inlineUser.avatar && inlineUser.avatar.trim() !== "" ? (
              <img src={inlineUser.avatar} alt="avatar" className="w-20 h-20 rounded-full border border-green-400 object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-lg border border-green-400">
                {inlineUser.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}

            <div className="space-y-2 text-gray-700 mt-3">
              <p><strong>Name:</strong> {inlineUser.name}</p>
              <p><strong>Email:</strong> {inlineUser.email}</p>
              <p><strong>Role:</strong> {inlineUser.role}</p>
              <p><strong>Contact:</strong> {inlineUser.contact}</p>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => handleEdit(inlineUser)} className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">✏️ Edit</button>
              <button onClick={() => handleDelete(inlineUser.id)} className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">🗑️ Delete</button>
            </div>
          </div>
        </div>

      )}

      {/* Filter + CSV Export */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700">All Users</h2>

        <div className="flex items-center gap-3">
          <div className="relative w-40">
            <span className="absolute inset-y-0 left-2 flex items-center text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Filter users..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <button
            onClick={() => exportToCSV(filteredUsers, "all_users.csv")}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow text-sm"
          >
            ⬇️ CSV
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        {filteredUsers.length ? (
          <ul className="space-y-2">
            {filteredUsers.map((u) => (
              <li
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="p-3 border border-gray-300 rounded-lg flex items-center justify-between hover:bg-green-50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {u.avatar && u.avatar.trim() !== "" ? (
                    <img
                      src={u.avatar}
                      alt="avatar"
                      className="w-10 h-10 rounded-full border border-green-400 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-lg border border-green-400">
                      {u.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}

                  <div>
                    <p className="font-medium text-green-700">{u.name}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                    <p className="text-sm text-gray-600 capitalize">{u.role}</p>
                  </div>
                </div>

                {u.deleted && (
                  <span className="px-3 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">
                    Deleted
                  </span>
                )}

                {getId(u) === getId(user) && (
                  <span className="px-3 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                    Active
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">No users found 👥</p>
        )}
      </div>

      {/* Selected User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full relative">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-2 right-3 text-gray-600 hover:text-gray-800 text-xl"
            >
              ✖
            </button>
            <h2 className="text-xl font-semibold text-green-700 mb-4">User Details</h2>

            {selectedUser.avatar && selectedUser.avatar.trim() !== "" ? (
              <img
                src={selectedUser.avatar}
                alt="avatar"
                className="w-20 h-20 rounded-full border border-green-400 object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-lg border border-green-400">
                {selectedUser.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}

            <div className="space-y-2 text-gray-700 mt-3">
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p><strong>Contact:</strong> {selectedUser.contact}</p>
            </div>

            {(isAdmin || getId(selectedUser) === getId(user)) && (
              <div className="flex justify-end gap-3 mt-5">
                {!selectedUser.deleted ? (
                  <>
                    <button
                      onClick={() => handleEdit(selectedUser)}
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(selectedUser.id)}
                      className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      🗑️ Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleRestore(selectedUser.id)}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      ♻️ Restore
                    </button>
                    <button
                      onClick={() => handleRemove(selectedUser.id, true)}
                      className="px-3 py-2 bg-red-700 text-white rounded hover:bg-red-800"
                    >
                      ❌ Remove
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
