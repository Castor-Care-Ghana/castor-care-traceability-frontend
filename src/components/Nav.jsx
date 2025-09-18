import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo2 from '../assets/logo2.png';
import { FaUser } from 'react-icons/fa';

const Nav = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLinkClick = () => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    setIsLoggedIn(false);
  };

  return (
    <div>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-100 shadow-md flex items-center h-[70px] px-2">
        <div className="logo">
          <img src={logo2} alt="Logo" className="w-[39%] h-[39%] object-cover ml-3" />
        </div>

        {!isMobile && (
          <div className="flex items-center justify-between flex-1">
            <nav className="flex-1 flex justify-center">
              <ul className="flex gap-5 items-center text-sm font-bold text-gray-800">
                <Link to="/" className="navlink">Home</Link>
                <Link to="/about" className="navlink">About</Link>
                <Link to="/product" className="navlink">Products</Link>
                <Link to="/service" className="navlink">Services</Link>
                <Link to="/blog" className="navlink">Blog</Link>
                <Link to="/contact" className="bg-green-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-1">
                  Contact <span>→</span>
                </Link>
              </ul>
            </nav>

            <div onClick={toggleUserMenu} className="cursor-pointer text-2xl text-gray-600 pr-10 ml-[250px] mt-2" aria-label="User menu">
              <FaUser />
            </div>
          </div>
        )}

        {isMobile && (
          <div className="flex items-center ml-auto gap-3">
            <a href="tel:+233244185012" className="text-xl text-gray-600">☎️</a>
            <div onClick={toggleUserMenu} className="text-2xl text-gray-600 cursor-pointer mt-2"><FaUser /></div>
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-3xl bg-transparent border-none cursor-pointer text-gray-600">☰</button>
          </div>
        )}
      </header>

      {isMobile && menuOpen && (
        <div className="fixed top-[70px] right-0 bg-white border border-gray-300 rounded-md shadow-lg p-4 z-50">
          <ul className="flex flex-col gap-3 text-sm font-bold text-gray-800">
            <Link to="/" className="navlink" onClick={handleLinkClick}>Home</Link>
            <Link to="/about" className="navlink" onClick={handleLinkClick}>About</Link>
            <Link to="/product" className="navlink" onClick={handleLinkClick}>Products</Link>
            <Link to="/service" className="navlink" onClick={handleLinkClick}>Services</Link>
            <Link to="/blog" className="navlink" onClick={handleLinkClick}>Blog</Link>
            <li>
              <Link to="/contact" onClick={handleLinkClick} className="bg-green-600 text-white px-4 py-2 rounded-full font-bold flex items-center justify-center">
                Contact <span>→</span>
              </Link>
            </li>
          </ul>
        </div>
      )}

      {userMenuOpen && (
        <div className="fixed top-[70px] right-20 bg-white border border-gray-300 rounded-md shadow-lg p-4 z-50 min-w-[150px]">
          <ul className="flex flex-col gap-2 text-sm font-bold text-gray-800">
            {!isLoggedIn ? (
              <>
                <li><Link to="/signin" onClick={handleLinkClick}>My Account</Link></li>
                <li><Link to="/signup" onClick={handleLinkClick}>Create Account</Link></li>
              </>
            ) : (
              <>
                <li><Link to="/dashboard" onClick={handleLinkClick}>Dashboard</Link></li>
                <li><Link to="/orders" onClick={handleLinkClick}>My Orders</Link></li>
                <li><Link to="/profile" onClick={handleLinkClick}>Update Profile</Link></li>
                <li>
                  <button onClick={handleLogout} className="bg-transparent border-none text-left w-full cursor-pointer text-sm">
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Nav;

//  <nav className="bg-gray-900 text-white p-4 flex gap-4">
//           <Link to="/farmers">Farmers</Link>
//           <Link to="/batches">Batches</Link>
//           <Link to="/scans">Scans</Link>
//         </nav>
