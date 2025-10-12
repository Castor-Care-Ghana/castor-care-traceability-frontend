import React, { useEffect, useState } from "react";
import api from "../../../api";
import { useAuth } from "../../../contexts/AuthContext";

const MyAccount = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user?._id) {
      api.get(`/users/${user._id}`)
        .then((res) => setProfile(res.data))
        .catch((err) => console.error(err));
    }
  }, [user]);

  if (!profile) return <p className="p-6">Loading account...</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">My Account</h1>
      <div className="space-y-2">
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Role:</strong> {profile.role}</p>
      </div>
    </div>
  );
};

export default MyAccount;
