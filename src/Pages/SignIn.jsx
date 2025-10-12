import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { apiLogin } from "../services/auth";
import { useAuth } from "../contexts/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotForm, setShowForgotForm] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiLogin({ email, password });
      const { accessToken, user } = response.data;

      if (!accessToken) throw new Error("Access token missing");

      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      rememberMe
        ? localStorage.setItem("rememberedEmail", email)
        : localStorage.removeItem("rememberedEmail");

      login(user);

      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: `Welcome back, ${user.name || "User"}!`,
        timer: 2000,
        showConfirmButton: false,
      });

      const role = user.role?.toLowerCase();
      if (role === "admin") navigate("/dashboard/admin");
      else navigate("/dashboard/user");
    } catch (error) {
      console.error("❌ Login error:", error);

      let msg = "Login failed. Please try again.";
      if (error.response?.status === 422)
        msg = "Invalid email or password format.";
      else if (error.response?.status === 401) msg = "Invalid credentials.";
      else if (error.response?.status === 404) msg = "User not found.";
      else if (error.response?.data?.message) msg = error.response.data.message;

      Swal.fire({ icon: "error", title: "Login Failed", text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail)
      return Swal.fire("Error", "Please enter an email.", "error");

    setForgotLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/users/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail }),
        }
      );

      const result = await res.json();

      if (res.ok) {
        Swal.fire("Success", "Reset link sent to your email.", "success");
        setShowForgotForm(false);
      } else {
        Swal.fire(
          "Error",
          result.message || "Failed to send reset link.",
          "error"
        );
      }
    } catch (err) {
      console.error("❌ Forgot password error:", err);
      Swal.fire("Error", "Network error. Try again.", "error");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-5 py-6">
      <div className="relative w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        {/* Close Button */}
        <button
          onClick={() =>
            showForgotForm ? setShowForgotForm(false) : navigate("/")
          }
          className="absolute top-3 right-3 text-gray-500 hover:text-green-600 hover:bg-green-100 transition rounded-md w-7 h-7 flex items-center justify-center"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="text-center text-2xl font-bold text-green-600 mb-6">
          {showForgotForm ? "Forgot Password" : "Sign In"}
        </h2>

        {showForgotForm ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={forgotLoading}
              className={`w-full py-2 rounded-md font-bold text-white text-sm ${
                forgotLoading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 transition"
              }`}
            >
              {forgotLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2"
                />
                Remember me
              </label>
              <span
                onClick={() => setShowForgotForm(true)}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Forgot password?
              </span>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-md font-bold text-white text-sm ${
                loading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 transition"
              }`}
            >
              {loading ? "Logging in..." : "Sign In"}
            </button>
          </form>
        )}

        {!showForgotForm && (
          <p className="mt-4 text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-green-600 font-bold hover:underline"
            >
              Sign Up
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default SignIn;
