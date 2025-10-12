import React from "react";
import { Link } from "react-router-dom";
import bg9 from '../assets/bg9.jpg';

const About = () => {
  return (
    <div className="mt-20">
      {/* Hero Section */}
      <section className="bg-green-50 py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-green-700">
          About <span className="text-gray-900">Agritrac</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Building trust from the farm to the consumer through reliable product
          traceability.
        </p>
      </section>

      {/* Mission Section */}
      <section className="max-w-6xl mx-auto py-16 px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
            {/* <div>
          <h2 className="text-2xl font-semibold text-green-700">Our Goals</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            We aim to empower farmers, provide buyers with transparent product
            origins, and ensure consumers trust the food they consume. Agritrac
            bridges the gap between agriculture and technology.
          </p>
        </div> */}
        <div>
          <h2 className="text-2xl font-semibold text-green-700">Our Mission</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Our mission is to revolutionize the agricultural landscape by providing cutting-edge technology solutions that optimize the farm-to-table supply chain. We are committed to fostering sustainable practices, enhancing food security, and empowering communities through education and innovation.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-green-700 mt-4">Our Vision</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            At Castor Care Ghana, we envision a future where technology and agriculture work hand in hand to create sustainable and efficient food systems. We aim to empower farmers, enhance food security, and promote responsible consumption through innovative solutions.
          </p>
        </div>
       
        <div>
          <h2 className="text-2xl font-semibold text-green-700 mt-4">Our Values</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            At Castor Care Ghana, we believe in:</p>
    <ul className="list-disc list-inside text-gray-600 mt-2">
      <li>Quality</li>
      <li>Transparency</li>
      <li>Responsible Practices</li>
      <li>Sustainability</li>
    </ul>
        </div>
        </div>
        <div>
            <div>
          <h2 className="text-2xl font-semibold text-green-700">Our Goals</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            We aim to empower farmers, provide buyers with transparent product
            origins, and ensure consumers trust the food they consume. Castor Care Ghana Agritrac
            bridges the gap between agriculture and technology.
          </p>
          </div>
           <img
            src={bg9} alt="Agriculture"
          className="rounded-xl shadow-md h-100 w-full object-cover mt-4"
        />
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16 px-6">
        <h2 className="text-2xl font-bold text-center text-green-700">
          How It Works
        </h2>
        <div className="mt-8 grid gap-8 md:grid-cols-4 max-w-6xl mx-auto">
          <div className="p-6 shadow rounded-lg border text-center">
            <h3 className="font-semibold text-gray-800">1. Farmer Registers</h3>
            <p className="mt-2 text-gray-600 text-sm">
              Farmers sign up and provide details about their farms.
            </p>
          </div>
          <div className="p-6 shadow rounded-lg border text-center">
            <h3 className="font-semibold text-gray-800">2. Batch Creation</h3>
            <p className="mt-2 text-gray-600 text-sm">
              Each harvest is grouped into batches for tracking.
            </p>
          </div>
          <div className="p-6 shadow rounded-lg border text-center">
            <h3 className="font-semibold text-gray-800">3. Packaging</h3>
            <p className="mt-2 text-gray-600 text-sm">
              Packages are labeled with unique QR codes.
            </p>
          </div>
          <div className="p-6 shadow rounded-lg border text-center">
            <h3 className="font-semibold text-gray-800">4. Scan & Verify</h3>
            <p className="mt-2 text-gray-600 text-sm">
              Buyers and consumers scan to verify authenticity.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-green-600 py-12 px-6 text-center text-white">
        <h2 className="text-2xl md:text-3xl font-bold">
          Join Agritrac Today
        </h2>
        <p className="mt-3 text-lg">
          Be part of the future of transparent and sustainable farming.
        </p>
        <Link
          to="/signin"
          className="mt-6 inline-block px-6 py-3 bg-white text-green-700 rounded-full font-medium shadow hover:bg-gray-100 transition"
        >
          Get Started
        </Link>
      </section>
    </div>
  );
};

export default About;
