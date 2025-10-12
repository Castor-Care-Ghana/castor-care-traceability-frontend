import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Swal from "sweetalert2";
import { apiSignup } from "../services/auth";
import { useAuth } from "../contexts/AuthContext";

const SignUp = () => {
  const { login } = useAuth();
  const [role, setRole] = useState("user");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const formatPhoneForBackend = (phoneNumber) => {
    if (phoneNumber.startsWith("233")) {
      return "0" + phoneNumber.substring(3);
    }
    return phoneNumber;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      return setErrorMsg("Passwords don't match!");
    }
    if (!contact) {
      return setErrorMsg("Please enter your contact number.");
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        contact: formatPhoneForBackend(contact),
        email: email.trim(),
        password,
        role: "user", // default user
      };

      const response = await apiSignup(payload);

      if (response.status === 200 || response.status === 201) {
        const { user, token } = response.data;

        // Save user + token
        login(user, token);

        Swal.fire({
          icon: "success",
          title: "Registration Successful",
          text: "Redirecting to your dashboard...",
          timer: 1500,
          showConfirmButton: false,
        });

        // Redirect by role
        if (user.role === "admin") navigate("/dashboard/admin");
        else navigate("/dashboard/user");
      }
    } catch (err) {
      console.error("❌ Signup error:", err.response?.data || err.message);
      let errorMessage = err.response?.data?.message || "Signup failed, please try again.";
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: errorMessage,
      });
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-3 py-6">
      <div className="relative w-full max-w-md p-6 mt-12 bg-white/95 rounded-lg shadow-lg">
        {/* Close Button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-green-100 hover:text-green-600 transition"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="text-center text-2xl font-bold text-green-600 mb-4">
          Sign Up
        </h2>

        <form onSubmit={handleSignUp} className="space-y-3">
          {/* Name */}
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />

          {/* Contact */}
          <PhoneInput
            country={"gh"}
            value={contact}
            onChange={setContact}
            inputStyle={{ width: "90%", padding: "10px", marginLeft: "40px", fontSize: "14px" }}
            containerClass="mb-2"
            inputProps={{ required: true }}
          />

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm pr-10"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 cursor-pointer text-gray-600"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm pr-10"
            />
            <span
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-3 cursor-pointer text-gray-600"
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {errorMsg && (
            <p className="text-red-500 text-xs text-center">{errorMsg}</p>
          )}

          <label className="flex items-center text-xs mb-2">
            <input type="checkbox" required className="mr-2" />
            I agree to the terms and conditions
          </label>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md font-bold text-white text-sm ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 transition"
            }`}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-3 text-xs text-center">
          Already have an account?{" "}
          <Link to="/signin" className="text-green-600 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
