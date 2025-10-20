import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import logo2 from "../assets/logo2.png";

const Nav = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md h-[70px] flex items-center px-2">
      {/* Logo on the left */}
      <Link to="/">
      <div className="flex items-center">
        <img src={logo2} alt="Logo" className="w-[40%] h-[40%] object-cover ml-10 hover:scale-120 transition-transform" />
      </div>
      </Link>

      {/* Title in the middle */}
      <div className="flex-1 flex justify-center items-center px-4 pr-50">
        <h1 className="text-3xl font-bold text-gray-800">Agritrac</h1>
      </div>

      <div>
        <Link to="/contact" className="bg-green-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-1">Contact <span>→</span>
      </Link>
      </div>
      

      {/* User icon on the right */}
      <div className="relative m-10">
        <button
          onClick={toggleUserMenu}
          className="text-2xl text-gray-700 hover:text-green-600 transition-colors"
        >
          <FaUser />
        </button>

        {/* Dropdown */}
        {userMenuOpen && (
          <div className="absolute right-0 mt-3 w-44 bg-white border border-gray-200 rounded-lg shadow-lg">
            <ul className="flex flex-col text-sm font-medium text-gray-700">
              <li>
                <Link
                  to="/signin"
                  className="block px-4 py-2 hover:bg-gray-100 rounded-t-lg"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="block px-4 py-2 hover:bg-gray-100 rounded-b-lg"
                >
                  Create Account
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

export default Nav;
