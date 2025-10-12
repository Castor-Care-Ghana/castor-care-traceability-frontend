import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <section className="mt-20">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-green-700">
            Welcome to <span className="text-gray-900">Castor Care Ghana</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl">
            A reliable and transparent{" "}
            <span className="font-semibold text-green-700">Traceability System</span>{" "}
            designed to connect farmers, batches, and packages with trust and accountability.
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex gap-4">
            <Link
              to="/signin"
              className="px-6 py-3 bg-green-600 text-white rounded-full font-medium shadow-md hover:bg-green-700 transition"
            >
              Get Started
            </Link>
            <Link
              to="/about"
              className="px-6 py-3 border border-green-600 text-green-700 rounded-full font-medium hover:bg-green-50 transition"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Highlight Section */}
      <div id="about" className="max-w-6xl mx-auto px-6 py-16 grid gap-8 md:grid-cols-3">
        <div className="p-6 bg-white shadow-md rounded-xl border hover:shadow-lg transition">
          <h3 className="text-lg font-semibold text-green-700">For Farmers</h3>
          <p className="mt-2 text-gray-600 text-sm">
            Register farms, track batches, and ensure transparency from the ground up.
          </p>
        </div>
        <div className="p-6 bg-white shadow-md rounded-xl border hover:shadow-lg transition">
          <h3 className="text-lg font-semibold text-green-700">For Buyers</h3>
          <p className="mt-2 text-gray-600 text-sm">
            Gain confidence in product origin and quality with verified traceability.
          </p>
        </div>
        <div className="p-6 bg-white shadow-md rounded-xl border hover:shadow-lg transition">
          <h3 className="text-lg font-semibold text-green-700">For Admins</h3>
          <p className="mt-2 text-gray-600 text-sm">
            Manage users, oversee processes, and maintain system-wide accountability.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Home;
